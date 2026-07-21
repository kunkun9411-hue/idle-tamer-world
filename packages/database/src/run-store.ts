import { BALANCE_RELEASE_ID, CONTENT_RELEASE_ID, RUN_CONTRACT_VERSION, type AuthoritativeRunSnapshot, type RunBootstrapResponse, type RunCommandEnvelope, type RunCommandResponse, type RunProgressionStatus, type RunZoneProgressSnapshot } from "@idle-tamer/contracts";
import { AUTHORITATIVE_CACHE_CAPACITY, cacheCapacity, deterministicCombatLoot, resumeCombatAt, runLevelCost, settleAuthoritativeRun, type AuthoritativeRunState } from "@idle-tamer/game-core";
import { getGem, getMonster, getMonsterForm, getZoneSynergy, ZONES } from "@idle-tamer/content";
import type { Pool, PoolClient, QueryResultRow } from "pg";

import { applyBalanceDelta, hashCommand, withTransaction } from "./transaction";
import { executeProgressionCommand, ProgressionCommandError, type MutableProgressionCommandContext } from "./run-progression-commands";
import { incrementActivity, loadCollectionSnapshot, type PendingProgressionLoot } from "./run-progression-snapshot";

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
  bootstrap(userId: string, now: Date): Promise<{ snapshot: AuthoritativeRunSnapshot; settlement: RunBootstrapResponse["settlement"] }>;
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
  support_monster_definition_id: string | null;
  prestige_count: number;
  egg_pity: number;
  active_hyper_level: number;
  active_evolution: "rookie" | "evolved";
  research_power: number;
  research_vitality: number;
  research_extraction: number;
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
  egg_drops: Record<string, number>;
  item_drops: Record<string, number>;
  gem_drops: Record<string, number>;
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
  supportMonsterDefinitionId: string | null;
  prestigeCount: number;
  eggPity: number;
  cacheCapacity: number;
  pending: ({ id: string; gold: bigint; slots: number; victories: number } & PendingProgressionLoot) | null;
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
            COALESCE(w.amount, 0)::text AS gold, r.support_monster_definition_id,
            r.prestige_count, r.egg_pity, m.hyper_level AS active_hyper_level,
            m.evolution AS active_evolution,
            COALESCE((SELECT level FROM research_levels WHERE player_id = r.player_id AND definition_id = 'power'), 0) AS research_power,
            COALESCE((SELECT level FROM research_levels WHERE player_id = r.player_id AND definition_id = 'vitality'), 0) AS research_vitality,
            COALESCE((SELECT level FROM research_levels WHERE player_id = r.player_id AND definition_id = 'extraction'), 0) AS research_extraction
       FROM player_profiles p
       JOIN users u ON u.id = p.user_id AND u.status = 'active'
       JOIN player_runs r ON r.player_id = p.id
       JOIN player_run_levels l
         ON l.player_id = r.player_id AND l.monster_definition_id = r.active_monster_definition_id
       JOIN monster_instances m
         ON m.player_id = r.player_id AND m.definition_id = r.active_monster_definition_id
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
    `SELECT id, gold::text, slot_count, victory_count, egg_drops, item_drops, gem_drops
       FROM pending_reward_batches
      WHERE player_id = $1 AND claimed_at IS NULL
      FOR UPDATE`,
    [row.player_id],
  );
  const zoneProgress = Object.fromEntries(zones.rows.map((entry) => [entry.zone_id, { stage: entry.stage, clears: entry.clears }]));
  zoneProgress["violet-rim"] ??= { stage: 1, clears: "0" };
  const pendingRow = pending.rows[0];
  const activeGemRows = await client.query<{ gem_definition_id: string } & QueryResultRow>(
    `SELECT s.gem_definition_id FROM monster_gem_slots s
      WHERE s.player_id = $1 AND s.monster_instance_id = (
        SELECT id FROM monster_instances WHERE player_id = $1 AND definition_id = $2
      )`,
    [row.player_id, row.active_monster_definition_id],
  );
  const gemBonuses = activeGemRows.rows.reduce((total, entry) => {
    const gem = getGem(entry.gem_definition_id);
    return { attack: total.attack + (gem?.attackPercent ?? 0), hp: total.hp + (gem?.hpPercent ?? 0) };
  }, { attack: 0, hp: 0 });
  const leadDefinition = getMonster(row.active_monster_definition_id);
  const leadRole = row.active_evolution === "evolved" ? leadDefinition.evolution.combatRole ?? leadDefinition.combatRole : leadDefinition.combatRole;
  const supportDefinition = row.support_monster_definition_id ? getMonster(row.support_monster_definition_id) : null;
  const supportMonster = supportDefinition ? await client.query<{ evolution: "rookie" | "evolved" } & QueryResultRow>(
    "SELECT evolution FROM monster_instances WHERE player_id = $1 AND definition_id = $2",
    [row.player_id, row.support_monster_definition_id],
  ) : null;
  const supportRole = supportDefinition
    ? supportMonster?.rows[0]?.evolution === "evolved" ? supportDefinition.evolution.combatRole ?? supportDefinition.combatRole : supportDefinition.combatRole
    : undefined;
  const synergy = getZoneSynergy(row.current_zone_id, leadRole, supportRole);
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
      activeHyperLevel: row.active_hyper_level,
      activeEvolution: row.active_evolution,
      activeGemAttackPercent: gemBonuses.attack,
      activeGemHpPercent: gemBonuses.hp,
      researchPowerLevel: row.research_power,
      researchVitalityLevel: row.research_vitality,
      zoneAttackPercent: synergy?.attackPercent ?? 0,
      zoneHpPercent: synergy?.hpPercent ?? 0,
      prestigeCount: row.prestige_count,
      goldMultiplier: (1 + row.research_extraction * 0.1) * (1 + row.prestige_count * 0.001),
    },
    supportMonsterDefinitionId: row.support_monster_definition_id,
    prestigeCount: row.prestige_count,
    eggPity: row.egg_pity,
    cacheCapacity: cacheCapacity(row.research_extraction),
    pending: pendingRow ? {
      id: pendingRow.id,
      gold: BigInt(pendingRow.gold),
      slots: pendingRow.slot_count,
      victories: pendingRow.victory_count,
      eggs: pendingRow.egg_drops ?? {},
      items: pendingRow.item_drops ?? {},
      gems: pendingRow.gem_drops ?? {},
    } : null,
  };
};

const persistState = async (client: PoolClient, context: RunContext, revision: number): Promise<void> => {
  await client.query(
    `UPDATE player_runs
        SET revision = $2, active_monster_definition_id = $3, current_zone_id = $4,
            highest_zone_number = $5, run_victories = $6, total_victories = $7,
            progression_status = $8, next_combat_at = $9, support_monster_definition_id = $10,
            prestige_count = $11, egg_pity = $12, updated_at = clock_timestamp()
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
      context.supportMonsterDefinitionId,
      context.prestigeCount,
      context.eggPity,
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
  const firstTotalVictory = context.state.totalVictories;
  const settlement = settleAuthoritativeRun(
    context.state,
    now.getTime(),
    context.cacheCapacity - (context.pending?.slots ?? 0),
  );
  context.state = settlement.state;
  if (settlement.victoriesAdded > 0) {
    const loot = deterministicCombatLoot(context.playerId, firstTotalVictory, settlement.victoriesAdded, context.eggPity, context.prestigeCount);
    context.eggPity = loot.nextEggPity;
    const mergeDrops = (current: Record<string, number>, added: Record<string, number>): Record<string, number> => {
      const merged = { ...current };
      for (const [definitionId, amount] of Object.entries(added)) merged[definitionId] = (merged[definitionId] ?? 0) + amount;
      return merged;
    };
    await incrementActivity(client, context.playerId, "victory", settlement.victoriesAdded);
    await incrementActivity(client, context.playerId, "boss_victory", settlement.outcomes.filter((outcome) => outcome.boss).length);
    if (context.pending) {
      context.pending.gold += settlement.goldAdded;
      context.pending.slots += settlement.victoriesAdded;
      context.pending.victories += settlement.victoriesAdded;
      context.pending.eggs = mergeDrops(context.pending.eggs, loot.eggs);
      context.pending.items = mergeDrops(context.pending.items, loot.items);
      context.pending.gems = mergeDrops(context.pending.gems, loot.gems);
      await client.query(
        `UPDATE pending_reward_batches
            SET gold = $2, slot_count = $3, victory_count = $4,
                egg_drops = $5::jsonb, item_drops = $6::jsonb, gem_drops = $7::jsonb, updated_at = $8
          WHERE id = $1`,
        [context.pending.id, context.pending.gold.toString(), context.pending.slots, context.pending.victories,
          JSON.stringify(context.pending.eggs), JSON.stringify(context.pending.items), JSON.stringify(context.pending.gems), now],
      );
    } else {
      const inserted = await client.query<{ id: string } & QueryResultRow>(
        `INSERT INTO pending_reward_batches
           (player_id, source, gold, slot_count, victory_count, content_release_id, balance_release_id,
            egg_drops, item_drops, gem_drops, created_at, updated_at)
         VALUES ($1, 'combat', $2, $3, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $9)
         RETURNING id`,
        [context.playerId, settlement.goldAdded.toString(), settlement.victoriesAdded, CONTENT_RELEASE_ID, BALANCE_RELEASE_ID,
          JSON.stringify(loot.eggs), JSON.stringify(loot.items), JSON.stringify(loot.gems), now],
      );
      context.pending = {
        id: inserted.rows[0].id, gold: settlement.goldAdded, slots: settlement.victoriesAdded,
        victories: settlement.victoriesAdded, eggs: loot.eggs, items: loot.items, gems: loot.gems,
      };
    }
  }
  return {
    victoriesAdded: settlement.victoriesAdded,
    goldAdded: settlement.goldAdded,
    changed: settlement.victoriesAdded > 0 || before !== `${context.state.progressionStatus}|${context.state.nextCombatAtMs}`,
  };
};

const snapshot = async (client: PoolClient, context: RunContext, now: Date): Promise<AuthoritativeRunSnapshot> => ({
  revision: context.revision,
  serverTime: now.toISOString(),
  contentReleaseId: CONTENT_RELEASE_ID,
  balanceReleaseId: BALANCE_RELEASE_ID,
  gold: context.gold.toString(),
  pendingGold: (context.pending?.gold ?? 0n).toString(),
  cacheSlotsUsed: context.pending?.slots ?? 0,
  cacheCapacity: context.cacheCapacity,
  activeMonster: { definitionId: context.state.activeMonsterDefinitionId, level: context.state.activeMonsterLevel },
  currentZoneId: context.state.currentZoneId,
  unlockedZoneIds: ZONES.slice(0, context.state.highestZoneNumber).map((zone) => zone.id),
  highestZoneNumber: context.state.highestZoneNumber,
  zoneProgress: context.state.zoneProgress,
  runVictories: context.state.runVictories.toString(),
  totalVictories: context.state.totalVictories.toString(),
  progressionStatus: context.state.progressionStatus,
  nextCombatAt: new Date(context.state.nextCombatAtMs).toISOString(),
  collection: await loadCollectionSnapshot(client, {
    playerId: context.playerId,
    activeDefinitionId: context.state.activeMonsterDefinitionId,
    supportDefinitionId: context.supportMonsterDefinitionId,
    prestigeCount: context.prestigeCount,
    eggPity: context.eggPity,
    pending: context.pending ?? { eggs: {}, items: {}, gems: {} },
    now,
  }),
});

export class PostgresRunStore implements RunStore {
  public constructor(private readonly pool: Pool) {}

  public bootstrap(userId: string, now: Date): Promise<{ snapshot: AuthoritativeRunSnapshot; settlement: RunBootstrapResponse["settlement"] }> {
    return withTransaction(this.pool, async (client) => {
      const context = await loadContext(client, userId);
      const settled = await settleContext(client, context, now);
      if (settled.changed) {
        context.revision += 1;
        await persistState(client, context, context.revision);
      }
      const currentSnapshot = await snapshot(client, context, now);
      return {
        snapshot: currentSnapshot,
        settlement: {
          victoriesAdded: settled.victoriesAdded,
          goldAdded: settled.goldAdded.toString(),
          eggsAdded: currentSnapshot.collection.pendingEggs.length,
          itemsAdded: Object.values(currentSnapshot.collection.pendingItems).reduce((sum, amount) => sum + Number(amount), 0),
          gemsAdded: currentSnapshot.collection.pendingGems.length,
        },
      };
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
        const claimedEggs = { ...context.pending.eggs };
        const claimedItems = { ...context.pending.items };
        const claimedGems = { ...context.pending.gems };
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
        for (const [definitionId, amount] of Object.entries(claimedEggs)) if (amount > 0) await applyBalanceDelta(client, {
          kind: "egg", playerId: context.playerId, commandId: envelope.commandId, definitionId,
          delta: BigInt(amount), reason: "cache.claim", contentReleaseId: CONTENT_RELEASE_ID, balanceReleaseId: BALANCE_RELEASE_ID,
        });
        for (const [definitionId, amount] of Object.entries(claimedItems)) if (amount > 0) await applyBalanceDelta(client, {
          kind: "item", playerId: context.playerId, commandId: envelope.commandId, definitionId,
          delta: BigInt(amount), reason: "cache.claim", contentReleaseId: CONTENT_RELEASE_ID, balanceReleaseId: BALANCE_RELEASE_ID,
        });
        for (const [definitionId, amount] of Object.entries(claimedGems)) if (amount > 0) await applyBalanceDelta(client, {
          kind: "gem", playerId: context.playerId, commandId: envelope.commandId, definitionId,
          delta: BigInt(amount), reason: "cache.claim", contentReleaseId: CONTENT_RELEASE_ID, balanceReleaseId: BALANCE_RELEASE_ID,
        });
        await incrementActivity(client, context.playerId, "cache_claim");
        context.pending = null;
        context.state.progressionStatus = "fighting";
        context.state.nextCombatAtMs = resumeCombatAt(context.state, now.getTime());
        event = {
          type: "cache.claimed",
          payload: {
            gold: claimedGold.toString(),
            eggs: Object.values(claimedEggs).reduce((sum, amount) => sum + amount, 0),
            items: Object.values(claimedItems).reduce((sum, amount) => sum + amount, 0),
            gems: Object.values(claimedGems).reduce((sum, amount) => sum + amount, 0),
          },
        };
      } else if (envelope.command.type === "monster.level_up") {
        const owned = await client.query<{ level: number } & QueryResultRow>(
          `SELECT l.level FROM player_run_levels l
            JOIN monster_instances m ON m.player_id = l.player_id AND m.definition_id = l.monster_definition_id
           WHERE l.player_id = $1 AND l.monster_definition_id = $2`,
          [context.playerId, envelope.command.definitionId],
        );
        const currentLevel = owned.rows[0]?.level;
        if (!currentLevel) throw new RunDatabaseError("VALIDATION", "This monster does not belong to the player.");
        const cost = runLevelCost(currentLevel);
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
        await client.query(
          `UPDATE player_run_levels
              SET level = $3, updated_at = $4
            WHERE player_id = $1 AND monster_definition_id = $2`,
          [context.playerId, envelope.command.definitionId, currentLevel + 1, now],
        );
        if (envelope.command.definitionId === context.state.activeMonsterDefinitionId) {
          context.state.activeMonsterLevel = currentLevel + 1;
          context.state.progressionStatus = "fighting";
          context.state.nextCombatAtMs = resumeCombatAt(context.state, now.getTime());
        }
        await incrementActivity(client, context.playerId, "level_up");
        event = { type: "monster.level_up", payload: { definitionId: envelope.command.definitionId, level: currentLevel + 1, cost: cost.toString() } };
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
        const progressionContext: MutableProgressionCommandContext = {
          playerId: context.playerId,
          commandId: envelope.commandId,
          now,
          gold: context.gold,
          activeDefinitionId: context.state.activeMonsterDefinitionId,
          supportDefinitionId: context.supportMonsterDefinitionId,
          currentZoneId: context.state.currentZoneId,
          highestZoneNumber: context.state.highestZoneNumber,
          zoneProgress: context.state.zoneProgress,
          runVictories: context.state.runVictories,
          totalVictories: context.state.totalVictories,
          prestigeCount: context.prestigeCount,
          eggPity: context.eggPity,
          pendingEmpty: context.pending === null,
        };
        let result;
        try {
          result = await executeProgressionCommand(client, progressionContext, envelope.command);
        } catch (error) {
          if (error instanceof ProgressionCommandError) throw new RunDatabaseError(error.code, error.message);
          throw error;
        }
        if (!result) throw new RunDatabaseError("VALIDATION", "This run command is not available.");
        context.gold = progressionContext.gold;
        context.state.activeMonsterDefinitionId = progressionContext.activeDefinitionId;
        context.supportMonsterDefinitionId = progressionContext.supportDefinitionId;
        context.state.currentZoneId = progressionContext.currentZoneId;
        context.state.highestZoneNumber = progressionContext.highestZoneNumber;
        context.state.zoneProgress = progressionContext.zoneProgress;
        context.state.runVictories = progressionContext.runVictories;
        context.state.totalVictories = progressionContext.totalVictories;
        context.prestigeCount = progressionContext.prestigeCount;
        context.eggPity = progressionContext.eggPity;
        const activeLevel = await client.query<{ level: number } & QueryResultRow>(
          "SELECT level FROM player_run_levels WHERE player_id = $1 AND monster_definition_id = $2",
          [context.playerId, context.state.activeMonsterDefinitionId],
        );
        context.state.activeMonsterLevel = activeLevel.rows[0]?.level ?? 1;
        const extraction = await client.query<{ level: number } & QueryResultRow>(
          "SELECT level FROM research_levels WHERE player_id = $1 AND definition_id = 'extraction'",
          [context.playerId],
        );
        context.cacheCapacity = cacheCapacity(extraction.rows[0]?.level ?? 0);
        if (result.resetRun) {
          context.state.progressionStatus = "fighting";
          context.state.nextCombatAtMs = now.getTime() + 7_000;
        } else if (["monster.activate", "monster.support", "monster.evolve", "monster.hyper_up", "gem.equip", "gem.unequip", "research.buy"].includes(envelope.command.type)) {
          context.state.progressionStatus = "fighting";
          context.state.nextCombatAtMs = resumeCombatAt(context.state, now.getTime());
        }
        event = result.event;
      }

      context.revision += 1;
      await persistState(client, context, context.revision);
      const response: RunCommandResponse = {
        runContractVersion: RUN_CONTRACT_VERSION,
        accepted: true,
        replayed: false,
        snapshot: await snapshot(client, context, now),
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
