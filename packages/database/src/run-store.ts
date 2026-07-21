import { BALANCE_RELEASE_ID, CONTENT_RELEASE_ID, RUN_CONTRACT_VERSION, type AuthoritativeRunSnapshot, type RunCommandEnvelope, type RunCommandResponse, type RunProgressionStatus, type RunZoneProgressSnapshot } from "@idle-tamer/contracts";
import { AUTHORITATIVE_CACHE_CAPACITY, resumeCombatAt, runLevelCost, settleAuthoritativeRun, type AuthoritativeRunState } from "@idle-tamer/game-core";
import { ZONES } from "@idle-tamer/content";
import type { Pool, PoolClient, QueryResultRow } from "pg";

import { applyBalanceDelta, hashCommand, withTransaction } from "./transaction";

export class RunDatabaseError extends Error {
  public constructor(
    public readonly code: "CONFLICT" | "VALIDATION" | "INSUFFICIENT_BALANCE" | "NOT_READY" | "NOT_FOUND",
    message: string,
    public readonly latestRevision?: number,
  ) {
    super(message);
    this.name = "RunDatabaseError";
  }
}

export interface RunStore {
  bootstrap(userId: string, now: Date): Promise<{ snapshot: AuthoritativeRunSnapshot; settlement: { victoriesAdded: number; goldAdded: string } }>;
  executeCommand(userId: string, envelope: RunCommandEnvelope, now: Date): Promise<RunCommandResponse>;
}

interface RunRow extends QueryResultRow {
  player_id: string;
  revision: string;
  active_monster_definition_id: string;
  active_monster_level: number;
  current_zone_id: string;
  highest_zone_number: number;
  run_victories: string;
  total_victories: string;
  progression_status: RunProgressionStatus;
  next_combat_at: Date;
  gold: string;
}

interface ZoneRow extends QueryResultRow {
  zone_id: string;
  stage: number;
  clears: string;
}

interface PendingRow extends QueryResultRow {
  id: string;
  gold: string;
  slot_count: number;
  victory_count: number;
}

interface ExistingCommandRow extends QueryResultRow {
  request_hash: Buffer;
  response_snapshot: RunCommandResponse;
}

interface RunContext {
  playerId: string;
  revision: number;
  gold: bigint;
  state: AuthoritativeRunState;
  pending: { id: string; gold: bigint; slots: number; victories: number } | null;
}

const safeRevision = (raw: string): number => {
  const revision = Number(raw);
  if (!Number.isSafeInteger(revision)) throw new Error("Run revision exceeded the safe API range.");
  return revision;
};

const loadContext = async (client: PoolClient, userId: string): Promise<RunContext> => {
  const result = await client.query<RunRow>(
    `SELECT r.player_id, r.revision, r.active_monster_definition_id,
            l.level AS active_monster_level, r.current_zone_id, r.highest_zone_number,
            r.run_victories, r.total_victories, r.progression_status, r.next_combat_at,
            COALESCE(w.amount, 0)::text AS gold
       FROM player_profiles p
       JOIN users u ON u.id = p.user_id AND u.status = 'active'
       JOIN player_runs r ON r.player_id = p.id
       JOIN player_run_levels l
         ON l.player_id = r.player_id AND l.monster_definition_id = r.active_monster_definition_id
       LEFT JOIN wallet_balances w ON w.player_id = r.player_id AND w.definition_id = 'gold'
      WHERE p.user_id = $1
      FOR UPDATE OF r, l`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) throw new RunDatabaseError("NOT_READY", "Choose a starter before starting an authoritative run.");
  await client.query(
    `INSERT INTO wallet_balances (player_id, definition_id, amount)
     VALUES ($1, 'gold', 100)
     ON CONFLICT (player_id, definition_id) DO NOTHING`,
    [row.player_id],
  );
  const wallet = await client.query<{ amount: string } & QueryResultRow>(
    "SELECT amount::text FROM wallet_balances WHERE player_id = $1 AND definition_id = 'gold' FOR UPDATE",
    [row.player_id],
  );
  const zones = await client.query<ZoneRow>(
    `SELECT zone_id, stage, clears::text
       FROM player_zone_progress
      WHERE player_id = $1
      FOR UPDATE`,
    [row.player_id],
  );
  const pending = await client.query<PendingRow>(
    `SELECT id, gold::text, slot_count, victory_count
       FROM pending_reward_batches
      WHERE player_id = $1 AND claimed_at IS NULL
      FOR UPDATE`,
    [row.player_id],
  );
  const zoneProgress = Object.fromEntries(zones.rows.map((entry) => [entry.zone_id, { stage: entry.stage, clears: entry.clears }]));
  zoneProgress["violet-rim"] ??= { stage: 1, clears: "0" };
  const pendingRow = pending.rows[0];
  return {
    playerId: row.player_id,
    revision: safeRevision(row.revision),
    gold: BigInt(wallet.rows[0]?.amount ?? row.gold),
    state: {
      activeMonsterDefinitionId: row.active_monster_definition_id,
      activeMonsterLevel: row.active_monster_level,
      currentZoneId: row.current_zone_id,
      highestZoneNumber: row.highest_zone_number,
      zoneProgress,
      runVictories: BigInt(row.run_victories),
      totalVictories: BigInt(row.total_victories),
      progressionStatus: row.progression_status,
      nextCombatAtMs: row.next_combat_at.getTime(),
    },
    pending: pendingRow ? { id: pendingRow.id, gold: BigInt(pendingRow.gold), slots: pendingRow.slot_count, victories: pendingRow.victory_count } : null,
  };
};

const persistState = async (client: PoolClient, context: RunContext, revision: number): Promise<void> => {
  await client.query(
    `UPDATE player_runs
        SET revision = $2, active_monster_definition_id = $3, current_zone_id = $4,
            highest_zone_number = $5, run_victories = $6, total_victories = $7,
            progression_status = $8, next_combat_at = $9, updated_at = clock_timestamp()
      WHERE player_id = $1`,
    [
      context.playerId,
      revision,
      context.state.activeMonsterDefinitionId,
      context.state.currentZoneId,
      context.state.highestZoneNumber,
      context.state.runVictories.toString(),
      context.state.totalVictories.toString(),
      context.state.progressionStatus,
      new Date(context.state.nextCombatAtMs),
    ],
  );
  for (const [zoneId, progress] of Object.entries(context.state.zoneProgress)) {
    await client.query(
      `INSERT INTO player_zone_progress (player_id, zone_id, stage, clears)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (player_id, zone_id)
       DO UPDATE SET stage = EXCLUDED.stage, clears = EXCLUDED.clears, updated_at = clock_timestamp()`,
      [context.playerId, zoneId, progress.stage, progress.clears],
    );
  }
};

const settleContext = async (client: PoolClient, context: RunContext, now: Date): Promise<{ victoriesAdded: number; goldAdded: bigint; changed: boolean }> => {
  const before = `${context.state.progressionStatus}|${context.state.nextCombatAtMs}`;
  const settlement = settleAuthoritativeRun(
    context.state,
    now.getTime(),
    AUTHORITATIVE_CACHE_CAPACITY - (context.pending?.slots ?? 0),
  );
  context.state = settlement.state;
  if (settlement.victoriesAdded > 0) {
    if (context.pending) {
      context.pending.gold += settlement.goldAdded;
      context.pending.slots += settlement.victoriesAdded;
      context.pending.victories += settlement.victoriesAdded;
      await client.query(
        `UPDATE pending_reward_batches
            SET gold = $2, slot_count = $3, victory_count = $4, updated_at = $5
          WHERE id = $1`,
        [context.pending.id, context.pending.gold.toString(), context.pending.slots, context.pending.victories, now],
      );
    } else {
      const inserted = await client.query<{ id: string } & QueryResultRow>(
        `INSERT INTO pending_reward_batches
           (player_id, source, gold, slot_count, victory_count, content_release_id, balance_release_id, created_at, updated_at)
         VALUES ($1, 'combat', $2, $3, $3, $4, $5, $6, $6)
         RETURNING id`,
        [context.playerId, settlement.goldAdded.toString(), settlement.victoriesAdded, CONTENT_RELEASE_ID, BALANCE_RELEASE_ID, now],
      );
      context.pending = { id: inserted.rows[0].id, gold: settlement.goldAdded, slots: settlement.victoriesAdded, victories: settlement.victoriesAdded };
    }
  }
  return {
    victoriesAdded: settlement.victoriesAdded,
    goldAdded: settlement.goldAdded,
    changed: settlement.victoriesAdded > 0 || before !== `${context.state.progressionStatus}|${context.state.nextCombatAtMs}`,
  };
};

const snapshot = (context: RunContext, now: Date): AuthoritativeRunSnapshot => ({
  revision: context.revision,
  serverTime: now.toISOString(),
  contentReleaseId: CONTENT_RELEASE_ID,
  balanceReleaseId: BALANCE_RELEASE_ID,
  gold: context.gold.toString(),
  pendingGold: (context.pending?.gold ?? 0n).toString(),
  cacheSlotsUsed: context.pending?.slots ?? 0,
  cacheCapacity: AUTHORITATIVE_CACHE_CAPACITY,
  activeMonster: { definitionId: context.state.activeMonsterDefinitionId, level: context.state.activeMonsterLevel },
  currentZoneId: context.state.currentZoneId,
  unlockedZoneIds: ZONES.slice(0, context.state.highestZoneNumber).map((zone) => zone.id),
  highestZoneNumber: context.state.highestZoneNumber,
  zoneProgress: context.state.zoneProgress,
  runVictories: context.state.runVictories.toString(),
  totalVictories: context.state.totalVictories.toString(),
  progressionStatus: context.state.progressionStatus,
  nextCombatAt: new Date(context.state.nextCombatAtMs).toISOString(),
});

export class PostgresRunStore implements RunStore {
  public constructor(private readonly pool: Pool) {}

  public bootstrap(userId: string, now: Date): Promise<{ snapshot: AuthoritativeRunSnapshot; settlement: { victoriesAdded: number; goldAdded: string } }> {
    return withTransaction(this.pool, async (client) => {
      const context = await loadContext(client, userId);
      const settled = await settleContext(client, context, now);
      if (settled.changed) {
        context.revision += 1;
        await persistState(client, context, context.revision);
      }
      return { snapshot: snapshot(context, now), settlement: { victoriesAdded: settled.victoriesAdded, goldAdded: settled.goldAdded.toString() } };
    });
  }

  public executeCommand(userId: string, envelope: RunCommandEnvelope, now: Date): Promise<RunCommandResponse> {
    return withTransaction(this.pool, async (client) => {
      const context = await loadContext(client, userId);
      const requestHash = hashCommand(envelope.command);
      const existing = await client.query<ExistingCommandRow>(
        `SELECT request_hash, response_snapshot
           FROM game_commands
          WHERE player_id = $1 AND command_id = $2`,
        [context.playerId, envelope.commandId],
      );
      if (existing.rowCount === 1) {
        const row = existing.rows[0];
        if (!row.request_hash.equals(requestHash)) throw new RunDatabaseError("VALIDATION", "commandId was reused for a different run command.");
        return { ...row.response_snapshot, replayed: true };
      }
      if (context.revision !== envelope.expectedRevision) {
        throw new RunDatabaseError("CONFLICT", "The authoritative run revision is stale.", context.revision);
      }

      await client.query(
        `INSERT INTO game_commands
           (player_id, command_id, client_instance_id, request_hash, command_type, expected_revision, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
        [context.playerId, envelope.commandId, envelope.clientInstanceId, requestHash, envelope.command.type, envelope.expectedRevision],
      );
      await settleContext(client, context, now);

      let event: RunCommandResponse["event"];
      if (envelope.command.type === "cache.claim") {
        if (!context.pending || context.pending.gold <= 0n) throw new RunDatabaseError("VALIDATION", "The combat cache is empty.");
        const claimedGold = context.pending.gold;
        await client.query(
          `UPDATE pending_reward_batches
              SET claimed_at = $2, claimed_by_command_id = $3, updated_at = $2
            WHERE id = $1 AND claimed_at IS NULL`,
          [context.pending.id, now, envelope.commandId],
        );
        context.gold = await applyBalanceDelta(client, {
          kind: "wallet",
          playerId: context.playerId,
          commandId: envelope.commandId,
          definitionId: "gold",
          delta: claimedGold,
          reason: "cache.claim",
          contentReleaseId: CONTENT_RELEASE_ID,
          balanceReleaseId: BALANCE_RELEASE_ID,
        });
        context.pending = null;
        context.state.progressionStatus = "fighting";
        context.state.nextCombatAtMs = resumeCombatAt(context.state, now.getTime());
        event = { type: "cache.claimed", payload: { gold: claimedGold.toString() } };
      } else if (envelope.command.type === "monster.level_up") {
        if (envelope.command.definitionId !== context.state.activeMonsterDefinitionId) {
          throw new RunDatabaseError("VALIDATION", "Only the server-authoritative active monster can receive a run level.");
        }
        const cost = runLevelCost(context.state.activeMonsterLevel);
        try {
          context.gold = await applyBalanceDelta(client, {
            kind: "wallet",
            playerId: context.playerId,
            commandId: envelope.commandId,
            definitionId: "gold",
            delta: -cost,
            reason: "monster.level_up",
            contentReleaseId: CONTENT_RELEASE_ID,
            balanceReleaseId: BALANCE_RELEASE_ID,
          });
        } catch (error) {
          if (error instanceof Error && error.message === "The balance is too low.") throw new RunDatabaseError("INSUFFICIENT_BALANCE", "Not enough gold for this run level.");
          throw error;
        }
        context.state.activeMonsterLevel += 1;
        await client.query(
          `UPDATE player_run_levels
              SET level = $3, updated_at = $4
            WHERE player_id = $1 AND monster_definition_id = $2`,
          [context.playerId, context.state.activeMonsterDefinitionId, context.state.activeMonsterLevel, now],
        );
        context.state.progressionStatus = "fighting";
        context.state.nextCombatAtMs = resumeCombatAt(context.state, now.getTime());
        event = { type: "monster.level_up", payload: { definitionId: context.state.activeMonsterDefinitionId, level: context.state.activeMonsterLevel, cost: cost.toString() } };
      } else if (envelope.command.type === "zone.select") {
        const zoneId = envelope.command.zoneId;
        const zoneIndex = ZONES.findIndex((zone) => zone.id === zoneId);
        if (zoneIndex < 0 || zoneIndex >= context.state.highestZoneNumber) throw new RunDatabaseError("VALIDATION", "This zone is not unlocked.");
        context.state.currentZoneId = zoneId;
        context.state.zoneProgress[zoneId] ??= { stage: 1, clears: "0" };
        context.state.progressionStatus = "fighting";
        context.state.nextCombatAtMs = resumeCombatAt(context.state, now.getTime());
        event = { type: "zone.selected", payload: { zoneId } };
      } else {
        throw new RunDatabaseError("VALIDATION", "This run command is not available.");
      }

      context.revision += 1;
      await persistState(client, context, context.revision);
      const response: RunCommandResponse = {
        runContractVersion: RUN_CONTRACT_VERSION,
        accepted: true,
        replayed: false,
        snapshot: snapshot(context, now),
        event,
      };
      await client.query(
        `UPDATE game_commands
            SET status = 'accepted', resulting_revision = $3, response_snapshot = $4::jsonb, completed_at = $5
          WHERE player_id = $1 AND command_id = $2`,
        [context.playerId, envelope.commandId, context.revision, JSON.stringify(response), now],
      );
      return response;
    });
  }
}
