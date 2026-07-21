import { BALANCE_RELEASE_ID, CONTENT_RELEASE_ID, GUILD_CONTRACT_VERSION, type GuildCommandEnvelope, type GuildCommandResponse, type GuildRole, type GuildSnapshot } from "@idle-tamer/contracts";
import { GUILD_BOSS, GUILD_EXPEDITION, GUILD_GENES, GUILD_TASKS, guildGeneCost } from "@idle-tamer/content";
import { dailyPeriodKey, weeklyPeriodKey } from "@idle-tamer/game-core";
import type { Pool, PoolClient, QueryResultRow } from "pg";

import { applyBalanceDelta, hashCommand, withTransaction } from "./transaction";

export class GuildDatabaseError extends Error {
  public constructor(
    public readonly code: "CONFLICT" | "FORBIDDEN" | "INSUFFICIENT_BALANCE" | "NOT_FOUND" | "VALIDATION",
    message: string,
    public readonly latestRevision?: number,
  ) {
    super(message);
    this.name = "GuildDatabaseError";
  }
}

export interface GuildStore {
  bootstrap(userId: string, now: Date): Promise<{ snapshot: GuildSnapshot }>;
  executeCommand(userId: string, envelope: GuildCommandEnvelope, now: Date): Promise<GuildCommandResponse>;
}

interface PlayerRow extends QueryResultRow {
  player_id: string;
  revision: string;
  guild_join_available_at: Date;
}

interface MembershipRow extends QueryResultRow {
  guild_id: string;
  name: string;
  tag: string;
  description: string;
  join_policy: "open" | "invite";
  member_limit: number;
  dna_balance: string;
  role: GuildRole;
  personal_dna: string;
}

interface ExistingCommandRow extends QueryResultRow { request_hash: Buffer; response_snapshot: GuildCommandResponse }

const safeRevision = (value: string): number => {
  const revision = Number(value);
  if (!Number.isSafeInteger(revision)) throw new Error("Social revision exceeded the safe API range.");
  return revision;
};

const playerForUser = async (client: PoolClient, userId: string, lock = false): Promise<PlayerRow> => {
  const profile = await client.query<{ player_id: string } & QueryResultRow>(
    `SELECT p.id AS player_id FROM player_profiles p
       JOIN users u ON u.id = p.user_id AND u.status = 'active'
      WHERE p.user_id = $1`,
    [userId],
  );
  const playerId = profile.rows[0]?.player_id;
  if (!playerId) throw new GuildDatabaseError("NOT_FOUND", "Das Spielerprofil existiert nicht.");
  await client.query("INSERT INTO player_social_state (player_id) VALUES ($1) ON CONFLICT DO NOTHING", [playerId]);
  await client.query("INSERT INTO wallet_balances (player_id, definition_id, amount) VALUES ($1, 'guild_dna', 100) ON CONFLICT DO NOTHING", [playerId]);
  const result = await client.query<PlayerRow>(
    `SELECT player_id, revision::text, guild_join_available_at FROM player_social_state
      WHERE player_id = $1${lock ? " FOR UPDATE" : ""}`,
    [playerId],
  );
  return result.rows[0];
};

const membership = async (client: PoolClient, playerId: string, lock = false): Promise<MembershipRow | null> => {
  const result = await client.query<MembershipRow>(
    `SELECT g.id AS guild_id, g.name, g.tag, g.description, g.join_policy, g.member_limit,
            g.dna_balance::text, gm.role, COALESCE(w.amount, 0)::text AS personal_dna
       FROM guild_members gm
       JOIN guilds g ON g.id = gm.guild_id AND g.status = 'active'
       LEFT JOIN wallet_balances w ON w.player_id = gm.player_id AND w.definition_id = 'guild_dna'
      WHERE gm.player_id = $1${lock ? " FOR UPDATE OF g, gm" : ""}`,
    [playerId],
  );
  return result.rows[0] ?? null;
};

const ensureGuildPeriod = async (client: PoolClient, guildId: string, now: Date): Promise<void> => {
  const memberCountResult = await client.query<{ count: string } & QueryResultRow>("SELECT count(*)::text AS count FROM guild_members WHERE guild_id = $1", [guildId]);
  const memberCount = Math.max(1, Number(memberCountResult.rows[0]?.count ?? 1));
  const scale = Math.max(1, Math.sqrt(memberCount / 3));
  const dailyKey = dailyPeriodKey(now.getTime());
  for (const task of GUILD_TASKS) {
    await client.query(
      `INSERT INTO guild_tasks (guild_id, period_key, definition_id, progress, target, reward_dna)
       VALUES ($1, $2, $3, 0, $4, $5) ON CONFLICT DO NOTHING`,
      [guildId, dailyKey, task.id, Math.ceil(task.target * scale), Math.ceil(task.rewardDna * scale)],
    );
  }
  const weekKey = weeklyPeriodKey(now.getTime());
  const maxHp = BigInt(Math.ceil(GUILD_BOSS.baseHp * Math.max(1, Math.sqrt(memberCount))));
  await client.query(
    `INSERT INTO guild_bosses (guild_id, period_key, definition_id, hp, max_hp)
     VALUES ($1, $2, $3, $4, $4) ON CONFLICT DO NOTHING`,
    [guildId, weekKey, GUILD_BOSS.definitionId, maxHp.toString()],
  );
};

const guildBalanceDelta = async (
  client: PoolClient,
  input: { guildId: string; playerId: string; commandId: string; delta: bigint; reason: string; metadata?: Record<string, unknown> },
): Promise<bigint> => {
  const locked = await client.query<{ dna_balance: string } & QueryResultRow>("SELECT dna_balance::text FROM guilds WHERE id = $1 AND status = 'active' FOR UPDATE", [input.guildId]);
  if (!locked.rows[0]) throw new GuildDatabaseError("NOT_FOUND", "Die Gilde existiert nicht mehr.");
  const before = BigInt(locked.rows[0].dna_balance);
  const after = before + input.delta;
  if (after < 0n) throw new GuildDatabaseError("INSUFFICIENT_BALANCE", "Der Gilden-DNA fehlen Ressourcen.");
  await client.query("UPDATE guilds SET dna_balance = $2, revision = revision + 1, updated_at = clock_timestamp() WHERE id = $1", [input.guildId, after.toString()]);
  await client.query(
    `INSERT INTO guild_ledger (guild_id, player_id, command_id, delta, balance_before, balance_after, reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [input.guildId, input.playerId, input.commandId, input.delta.toString(), before.toString(), after.toString(), input.reason, JSON.stringify(input.metadata ?? {})],
  );
  return after;
};

const snapshot = async (client: PoolClient, player: PlayerRow, now: Date): Promise<GuildSnapshot> => {
  const ownMembership = await membership(client, player.player_id);
  const directoryResult = await client.query<{
    guild_id: string; name: string; tag: string; member_count: string; member_limit: number; dna_level: string; join_policy: "open" | "invite";
  } & QueryResultRow>(
    `SELECT g.id AS guild_id, g.name, g.tag,
            (SELECT count(*)::text FROM guild_members gm WHERE gm.guild_id = g.id) AS member_count,
            g.member_limit,
            (SELECT COALESCE(sum(nodes.level), 0)::text FROM guild_dna_nodes nodes WHERE nodes.guild_id = g.id) AS dna_level,
            g.join_policy
       FROM guilds g
      WHERE g.status = 'active'
      ORDER BY (SELECT count(*) FROM guild_members gm WHERE gm.guild_id = g.id) DESC, g.created_at
      LIMIT 20`,
  );
  const friendships = await client.query<{
    other_id: string; display_name: string; avatar_id: string; frame_id: string; status: "pending" | "accepted"; requested_by_player_id: string;
  } & QueryResultRow>(
    `SELECT CASE WHEN f.player_low_id = $1 THEN f.player_high_id ELSE f.player_low_id END AS other_id,
            p.display_name, p.avatar_id, p.frame_id, f.status, f.requested_by_player_id
       FROM player_friendships f
       JOIN player_profiles p ON p.id = CASE WHEN f.player_low_id = $1 THEN f.player_high_id ELSE f.player_low_id END
      WHERE $1 IN (f.player_low_id, f.player_high_id)
      ORDER BY f.status DESC, p.display_name_normalized`,
    [player.player_id],
  );
  const blocks = await client.query<{ blocked_player_id: string } & QueryResultRow>("SELECT blocked_player_id FROM player_blocks WHERE blocker_player_id = $1 ORDER BY created_at", [player.player_id]);
  const invitations = await client.query<{
    id: string; guild_id: string; guild_name: string; guild_tag: string; invited_by_display_name: string; expires_at: Date;
  } & QueryResultRow>(
    `SELECT i.id, i.guild_id, g.name AS guild_name, g.tag AS guild_tag,
            COALESCE(inviter.display_name, 'Unbekannter Tamer') AS invited_by_display_name, i.expires_at
       FROM guild_invites i JOIN guilds g ON g.id = i.guild_id AND g.status = 'active'
       LEFT JOIN player_profiles inviter ON inviter.id = i.invited_by_player_id
      WHERE i.player_id = $1 AND i.status = 'pending' AND i.expires_at > $2
      ORDER BY i.created_at DESC`,
    [player.player_id, now],
  );
  let guildSnapshot: GuildSnapshot["membership"] = null;

  if (ownMembership) {
    await ensureGuildPeriod(client, ownMembership.guild_id, now);
    const members = await client.query<{
      player_id: string; display_name: string; avatar_id: string; frame_id: string; role: GuildRole; contribution: string; joined_at: Date;
    } & QueryResultRow>(
      `SELECT p.id AS player_id, p.display_name, p.avatar_id, p.frame_id, gm.role, gm.contribution::text, gm.joined_at
         FROM guild_members gm JOIN player_profiles p ON p.id = gm.player_id
        WHERE gm.guild_id = $1
        ORDER BY CASE gm.role WHEN 'leader' THEN 1 WHEN 'officer' THEN 2 ELSE 3 END, gm.contribution DESC, gm.joined_at`,
      [ownMembership.guild_id],
    );
    const nodes = await client.query<{ gene_id: string; level: number } & QueryResultRow>("SELECT gene_id, level FROM guild_dna_nodes WHERE guild_id = $1", [ownMembership.guild_id]);
    const nodeMap = new Map(nodes.rows.map((entry) => [entry.gene_id, entry.level]));
    const tasks = await client.query<{ definition_id: string; period_key: string; progress: string; target: string; reward_dna: string; claimed_at: Date | null } & QueryResultRow>(
      "SELECT definition_id, period_key, progress::text, target::text, reward_dna::text, claimed_at FROM guild_tasks WHERE guild_id = $1 AND period_key = $2 ORDER BY definition_id",
      [ownMembership.guild_id, dailyPeriodKey(now.getTime())],
    );
    const bossResult = await client.query<{ period_key: string; definition_id: string; hp: string; max_hp: string; defeated_at: Date | null } & QueryResultRow>(
      "SELECT period_key, definition_id, hp::text, max_hp::text, defeated_at FROM guild_bosses WHERE guild_id = $1 AND period_key = $2",
      [ownMembership.guild_id, weeklyPeriodKey(now.getTime())],
    );
    const attackResult = await client.query<{ last_attack_at: Date | null; personal_damage: string } & QueryResultRow>(
      `SELECT max(created_at) AS last_attack_at, COALESCE(sum(damage), 0)::text AS personal_damage
         FROM guild_boss_attacks WHERE guild_id = $1 AND period_key = $2 AND player_id = $3`,
      [ownMembership.guild_id, weeklyPeriodKey(now.getTime()), player.player_id],
    );
    const chat = await client.query<{ id: string; player_id: string; display_name: string; role: GuildRole; body: string; created_at: Date } & QueryResultRow>(
      `SELECT c.id, c.player_id, p.display_name, gm.role, c.body, c.created_at
         FROM guild_chat_messages c
         JOIN player_profiles p ON p.id = c.player_id
         JOIN guild_members gm ON gm.guild_id = c.guild_id AND gm.player_id = c.player_id
        WHERE c.guild_id = $1 AND c.moderation_status = 'visible'
          AND NOT EXISTS (SELECT 1 FROM player_blocks b WHERE b.blocker_player_id = $2 AND b.blocked_player_id = c.player_id)
        ORDER BY c.created_at DESC LIMIT 50`,
      [ownMembership.guild_id, player.player_id],
    );
    const votes = await client.query<{
      id: string; kind: "gene_upgrade" | "policy_change"; payload: { subject?: string }; closes_at: Date;
      yes_count: string; no_count: string; my_choice: "yes" | "no" | null;
    } & QueryResultRow>(
      `SELECT v.id, v.kind, v.payload, v.closes_at,
              count(*) FILTER (WHERE b.choice = 'yes')::text AS yes_count,
              count(*) FILTER (WHERE b.choice = 'no')::text AS no_count,
              max(b.choice) FILTER (WHERE b.player_id = $2) AS my_choice
         FROM guild_votes v LEFT JOIN guild_vote_ballots b ON b.vote_id = v.id
        WHERE v.guild_id = $1 AND v.status = 'open' AND v.closes_at > $3
        GROUP BY v.id ORDER BY v.created_at DESC`,
      [ownMembership.guild_id, player.player_id, now],
    );
    const expeditionResult = await client.query<{
      id: string; definition_id: string; started_at: Date; completes_at: Date; reward_dna: string; claimed_at: Date | null;
    } & QueryResultRow>(
      `SELECT id, definition_id, started_at, completes_at, reward_dna::text, claimed_at
         FROM guild_expeditions WHERE guild_id = $1 ORDER BY started_at DESC LIMIT 1`,
      [ownMembership.guild_id],
    );
    const boss = bossResult.rows[0];
    const attack = attackResult.rows[0];
    const nextAttackAt = attack?.last_attack_at ? new Date(attack.last_attack_at.getTime() + GUILD_BOSS.attackCooldownMs) : null;
    guildSnapshot = {
      guildId: ownMembership.guild_id,
      name: ownMembership.name,
      tag: ownMembership.tag,
      description: ownMembership.description,
      joinPolicy: ownMembership.join_policy,
      memberLimit: ownMembership.member_limit,
      memberCount: members.rows.length,
      role: ownMembership.role,
      dnaBalance: ownMembership.dna_balance,
      personalDna: ownMembership.personal_dna,
      genes: GUILD_GENES.map((gene) => {
        const level = nodeMap.get(gene.id) ?? 0;
        const cost = guildGeneCost(gene.id, level);
        return { geneId: gene.id, level, maxLevel: gene.maxLevel, nextCost: cost > 0 ? String(cost) : null };
      }),
      members: members.rows.map((entry) => ({ playerId: entry.player_id, displayName: entry.display_name, avatarId: entry.avatar_id, frameId: entry.frame_id, role: entry.role, contribution: entry.contribution, joinedAt: entry.joined_at.toISOString() })),
      tasks: tasks.rows.map((entry) => ({ taskId: entry.definition_id, periodKey: entry.period_key, progress: entry.progress, target: entry.target, rewardDna: entry.reward_dna, completed: BigInt(entry.progress) >= BigInt(entry.target), claimed: entry.claimed_at !== null })),
      boss: {
        periodKey: boss.period_key, definitionId: boss.definition_id, hp: boss.hp, maxHp: boss.max_hp,
        defeated: boss.defeated_at !== null,
        nextAttackAt: nextAttackAt && nextAttackAt > now ? nextAttackAt.toISOString() : null,
        personalDamage: attack?.personal_damage ?? "0",
      },
      votes: votes.rows.map((entry) => ({
        voteId: entry.id,
        kind: entry.kind,
        subject: entry.payload.subject ?? "",
        yes: Number(entry.yes_count),
        no: Number(entry.no_count),
        eligibleVoters: members.rows.length,
        myChoice: entry.my_choice,
        closesAt: entry.closes_at.toISOString(),
      })),
      expedition: expeditionResult.rows[0] ? {
        expeditionId: expeditionResult.rows[0].id,
        definitionId: expeditionResult.rows[0].definition_id,
        status: expeditionResult.rows[0].claimed_at ? "claimed" : expeditionResult.rows[0].completes_at <= now ? "claimable" : "active",
        startedAt: expeditionResult.rows[0].started_at.toISOString(),
        completesAt: expeditionResult.rows[0].completes_at.toISOString(),
        rewardDna: expeditionResult.rows[0].reward_dna,
      } : null,
      chat: [...chat.rows].reverse().map((entry) => ({ messageId: entry.id, playerId: entry.player_id, displayName: entry.display_name, role: entry.role, body: entry.body, createdAt: entry.created_at.toISOString() })),
    };
  }

  return {
    revision: safeRevision(player.revision),
    serverTime: now.toISOString(),
    membership: guildSnapshot,
    directory: directoryResult.rows.map((entry) => ({ guildId: entry.guild_id, name: entry.name, tag: entry.tag, memberCount: Number(entry.member_count), memberLimit: entry.member_limit, dnaLevel: Number(entry.dna_level), joinPolicy: entry.join_policy })),
    friends: friendships.rows.map((entry) => ({
      playerId: entry.other_id, displayName: entry.display_name, avatarId: entry.avatar_id, frameId: entry.frame_id,
      status: entry.status === "accepted" ? "accepted" : entry.requested_by_player_id === player.player_id ? "pending_outgoing" : "pending_incoming",
    })),
    blockedPlayerIds: blocks.rows.map((entry) => entry.blocked_player_id),
    invitations: invitations.rows.map((entry) => ({ inviteId: entry.id, guildId: entry.guild_id, guildName: entry.guild_name, guildTag: entry.guild_tag, invitedByDisplayName: entry.invited_by_display_name, expiresAt: entry.expires_at.toISOString() })),
    joinAvailableAt: player.guild_join_available_at.toISOString(),
  };
};

const memberRole = async (client: PoolClient, guildId: string, playerId: string): Promise<GuildRole | null> => {
  const result = await client.query<{ role: GuildRole } & QueryResultRow>("SELECT role FROM guild_members WHERE guild_id = $1 AND player_id = $2", [guildId, playerId]);
  return result.rows[0]?.role ?? null;
};

const requireRole = (actual: GuildRole, allowed: GuildRole[]): void => {
  if (!allowed.includes(actual)) throw new GuildDatabaseError("FORBIDDEN", "Deine Gildenrolle erlaubt diese Aktion nicht.");
};

const normalizedName = (value: string): string => value.trim().normalize("NFKC").toLocaleLowerCase("de-DE");
const pair = (left: string, right: string): [string, string] => left < right ? [left, right] : [right, left];
const chatBlocked = (body: string): boolean => /(?:https?:\/\/|discord\.gg|(.)\1{9,})/iu.test(body);

export class PostgresGuildStore implements GuildStore {
  public constructor(private readonly pool: Pool) {}

  public bootstrap(userId: string, now: Date): Promise<{ snapshot: GuildSnapshot }> {
    return withTransaction(this.pool, async (client) => {
      const player = await playerForUser(client, userId);
      return { snapshot: await snapshot(client, player, now) };
    });
  }

  public executeCommand(userId: string, envelope: GuildCommandEnvelope, now: Date): Promise<GuildCommandResponse> {
    return withTransaction(this.pool, async (client) => {
      const player = await playerForUser(client, userId, true);
      const requestHash = hashCommand(envelope.command);
      const existing = await client.query<ExistingCommandRow>("SELECT request_hash, response_snapshot FROM game_commands WHERE player_id = $1 AND command_id = $2", [player.player_id, envelope.commandId]);
      if (existing.rows[0]) {
        if (!existing.rows[0].request_hash.equals(requestHash)) throw new GuildDatabaseError("VALIDATION", "Diese Kommando-ID wurde bereits anders verwendet.");
        return { ...existing.rows[0].response_snapshot, replayed: true };
      }
      const revision = safeRevision(player.revision);
      if (revision !== envelope.expectedRevision) throw new GuildDatabaseError("CONFLICT", "Der Sozialstatus wurde bereits geändert.", revision);
      await client.query(
        `INSERT INTO game_commands (player_id, command_id, client_instance_id, request_hash, command_type, expected_revision, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
        [player.player_id, envelope.commandId, envelope.clientInstanceId, requestHash, envelope.command.type, revision],
      );

      const current = await membership(client, player.player_id, true);
      let event: GuildCommandResponse["event"];
      const command = envelope.command;

      if (command.type === "guild.create") {
        if (current) throw new GuildDatabaseError("VALIDATION", "Du bist bereits Mitglied einer Gilde.");
        if (player.guild_join_available_at > now) throw new GuildDatabaseError("VALIDATION", "Die Gildenwechsel-Sperre ist noch aktiv.");
        const created = await client.query<{ id: string } & QueryResultRow>(
          `INSERT INTO guilds (name, name_normalized, tag, tag_normalized, description, created_by_player_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [command.name.trim(), normalizedName(command.name), command.tag.trim().toUpperCase(), normalizedName(command.tag), command.description.trim(), player.player_id],
        ).catch((error: unknown) => {
          if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505") throw new GuildDatabaseError("VALIDATION", "Gildenname oder Tag ist bereits vergeben.");
          throw error;
        });
        const guildId = created.rows[0].id;
        await client.query("INSERT INTO guild_members (guild_id, player_id, role) VALUES ($1, $2, 'leader')", [guildId, player.player_id]);
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id) VALUES ($1, $2, 'create', $2)", [guildId, player.player_id]);
        event = { type: "guild.created", payload: { guildId, name: command.name.trim() } };
      } else if (command.type === "guild.join") {
        if (current) throw new GuildDatabaseError("VALIDATION", "Du bist bereits Mitglied einer Gilde.");
        if (player.guild_join_available_at > now) throw new GuildDatabaseError("VALIDATION", "Die Gildenwechsel-Sperre ist noch aktiv.");
        const guild = await client.query<{ member_limit: number; join_policy: "open" | "invite" } & QueryResultRow>(
          "SELECT member_limit, join_policy FROM guilds WHERE id = $1 AND status = 'active' FOR UPDATE",
          [command.guildId],
        );
        const target = guild.rows[0];
        if (!target) throw new GuildDatabaseError("NOT_FOUND", "Diese Gilde existiert nicht.");
        const members = await client.query<{ member_count: string } & QueryResultRow>("SELECT count(*)::text AS member_count FROM guild_members WHERE guild_id = $1", [command.guildId]);
        if (Number(members.rows[0].member_count) >= target.member_limit) throw new GuildDatabaseError("VALIDATION", "Diese Gilde ist voll.");
        if (target.join_policy !== "open") throw new GuildDatabaseError("FORBIDDEN", "Diese Gilde nimmt nur Einladungen an.");
        await client.query("INSERT INTO guild_members (guild_id, player_id) VALUES ($1, $2)", [command.guildId, player.player_id]);
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id) VALUES ($1, $2, 'join', $2)", [command.guildId, player.player_id]);
        event = { type: "guild.joined", payload: { guildId: command.guildId } };
      } else if (command.type === "guild.leave") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        if (current.role === "leader") {
          const count = await client.query<{ count: string } & QueryResultRow>("SELECT count(*)::text AS count FROM guild_members WHERE guild_id = $1", [current.guild_id]);
          if (Number(count.rows[0].count) > 1) throw new GuildDatabaseError("VALIDATION", "Übertrage zuerst die Gildenleitung.");
          await client.query("UPDATE guilds SET status = 'disbanded', disbanded_at = $2, updated_at = $2 WHERE id = $1", [current.guild_id, now]);
        }
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id) VALUES ($1, $2, 'leave', $2)", [current.guild_id, player.player_id]);
        await client.query("DELETE FROM guild_members WHERE guild_id = $1 AND player_id = $2", [current.guild_id, player.player_id]);
        await client.query("UPDATE player_social_state SET guild_join_available_at = $2::timestamptz + interval '24 hours' WHERE player_id = $1", [player.player_id, now]);
        player.guild_join_available_at = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
        event = { type: "guild.left", payload: { guildId: current.guild_id, joinAvailableAt: player.guild_join_available_at.toISOString() } };
      } else if (command.type === "guild.leadership_transfer") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader"]);
        if (command.playerId === player.player_id) throw new GuildDatabaseError("VALIDATION", "Du leitest die Gilde bereits.");
        const targetRole = await memberRole(client, current.guild_id, command.playerId);
        if (!targetRole) throw new GuildDatabaseError("NOT_FOUND", "Dieses Mitglied existiert nicht.");
        await client.query("UPDATE guild_members SET role = 'officer', updated_at = $3 WHERE guild_id = $1 AND player_id = $2", [current.guild_id, player.player_id, now]);
        await client.query("UPDATE guild_members SET role = 'leader', updated_at = $3 WHERE guild_id = $1 AND player_id = $2", [current.guild_id, command.playerId, now]);
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id, metadata) VALUES ($1, $2, 'role_change', $3, $4::jsonb), ($1, $3, 'role_change', $3, $5::jsonb)", [current.guild_id, command.playerId, player.player_id, JSON.stringify({ role: "leader", previousRole: targetRole }), JSON.stringify({ role: "officer", transferredLeadership: true })]);
        event = { type: "guild.leadership_transferred", payload: { playerId: command.playerId } };
      } else if (command.type === "guild.role_set") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader"]);
        if (command.playerId === player.player_id) throw new GuildDatabaseError("VALIDATION", "Die eigene Leitung kann hier nicht geändert werden.");
        const updated = await client.query("UPDATE guild_members SET role = $3, updated_at = $4 WHERE guild_id = $1 AND player_id = $2 AND role <> 'leader'", [current.guild_id, command.playerId, command.role, now]);
        if (!updated.rowCount) throw new GuildDatabaseError("NOT_FOUND", "Dieses Mitglied existiert nicht.");
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id, metadata) VALUES ($1, $2, 'role_change', $3, $4::jsonb)", [current.guild_id, command.playerId, player.player_id, JSON.stringify({ role: command.role })]);
        event = { type: "guild.role_changed", payload: { playerId: command.playerId, role: command.role } };
      } else if (command.type === "guild.kick") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader", "officer"]);
        const targetRole = await memberRole(client, current.guild_id, command.playerId);
        if (!targetRole || targetRole === "leader" || (current.role === "officer" && targetRole !== "member")) throw new GuildDatabaseError("FORBIDDEN", "Dieses Mitglied kannst du nicht entfernen.");
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id) VALUES ($1, $2, 'kick', $3)", [current.guild_id, command.playerId, player.player_id]);
        await client.query("DELETE FROM guild_members WHERE guild_id = $1 AND player_id = $2", [current.guild_id, command.playerId]);
        await client.query("UPDATE player_social_state SET guild_join_available_at = $2::timestamptz + interval '24 hours', revision = revision + 1 WHERE player_id = $1", [command.playerId, now]);
        event = { type: "guild.member_kicked", payload: { playerId: command.playerId } };
      } else if (command.type === "guild.policy_set") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader"]);
        await client.query("UPDATE guilds SET join_policy = $2, revision = revision + 1, updated_at = $3 WHERE id = $1", [current.guild_id, command.joinPolicy, now]);
        event = { type: "guild.policy_changed", payload: { joinPolicy: command.joinPolicy } };
      } else if (command.type === "guild.invite") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader", "officer"]);
        const targetResult = await client.query<{ id: string } & QueryResultRow>(
          `SELECT p.id FROM player_profiles p JOIN users u ON u.id = p.user_id AND u.status = 'active'
            WHERE p.display_name_normalized = $1`,
          [normalizedName(command.displayName)],
        );
        const targetId = targetResult.rows[0]?.id;
        if (!targetId || targetId === player.player_id) throw new GuildDatabaseError("VALIDATION", "Dieser Tamer kann nicht eingeladen werden.");
        if (await membership(client, targetId)) throw new GuildDatabaseError("VALIDATION", "Dieser Tamer ist bereits in einer Gilde.");
        const blocked = await client.query("SELECT 1 FROM player_blocks WHERE (blocker_player_id = $1 AND blocked_player_id = $2) OR (blocker_player_id = $2 AND blocked_player_id = $1)", [player.player_id, targetId]);
        if (blocked.rowCount) throw new GuildDatabaseError("FORBIDDEN", "Zwischen diesen Accounts ist keine Einladung möglich.");
        await client.query("UPDATE guild_invites SET status = 'expired', responded_at = $4 WHERE guild_id = $1 AND player_id = $2 AND status = 'pending' AND expires_at <= $3", [current.guild_id, targetId, now, now]);
        const invite = await client.query<{ id: string } & QueryResultRow>(
          `INSERT INTO guild_invites (guild_id, player_id, invited_by_player_id, expires_at)
           VALUES ($1, $2, $3, $4::timestamptz + interval '7 days') ON CONFLICT (guild_id, player_id) WHERE status = 'pending'
           DO UPDATE SET invited_by_player_id = EXCLUDED.invited_by_player_id, expires_at = EXCLUDED.expires_at
           RETURNING id`,
          [current.guild_id, targetId, player.player_id, now],
        );
        await client.query("INSERT INTO player_social_state (player_id) VALUES ($1) ON CONFLICT DO NOTHING", [targetId]);
        await client.query("UPDATE player_social_state SET revision = revision + 1, updated_at = $2 WHERE player_id = $1", [targetId, now]);
        event = { type: "guild.invited", payload: { playerId: targetId, inviteId: invite.rows[0].id } };
      } else if (command.type === "guild.invite_accept") {
        if (current) throw new GuildDatabaseError("VALIDATION", "Du bist bereits Mitglied einer Gilde.");
        if (player.guild_join_available_at > now) throw new GuildDatabaseError("VALIDATION", "Die Gildenwechsel-Sperre ist noch aktiv.");
        const invite = await client.query<{ guild_id: string; member_limit: number } & QueryResultRow>(
          `SELECT i.guild_id, g.member_limit FROM guild_invites i JOIN guilds g ON g.id = i.guild_id AND g.status = 'active'
            WHERE i.id = $1 AND i.player_id = $2 AND i.status = 'pending' AND i.expires_at > $3 FOR UPDATE OF i, g`,
          [command.inviteId, player.player_id, now],
        );
        const acceptedInvite = invite.rows[0];
        if (!acceptedInvite) throw new GuildDatabaseError("VALIDATION", "Diese Einladung ist nicht mehr gültig.");
        const count = await client.query<{ count: string } & QueryResultRow>("SELECT count(*)::text AS count FROM guild_members WHERE guild_id = $1", [acceptedInvite.guild_id]);
        if (Number(count.rows[0].count) >= acceptedInvite.member_limit) throw new GuildDatabaseError("VALIDATION", "Diese Gilde ist inzwischen voll.");
        await client.query("INSERT INTO guild_members (guild_id, player_id) VALUES ($1, $2)", [acceptedInvite.guild_id, player.player_id]);
        await client.query("UPDATE guild_invites SET status = 'accepted', responded_at = $3 WHERE id = $1 AND player_id = $2", [command.inviteId, player.player_id, now]);
        await client.query("UPDATE guild_invites SET status = 'declined', responded_at = $2 WHERE player_id = $1 AND status = 'pending' AND id <> $3", [player.player_id, now, command.inviteId]);
        await client.query("INSERT INTO guild_membership_history (guild_id, player_id, action, actor_player_id, metadata) VALUES ($1, $2, 'join', $2, $3::jsonb)", [acceptedInvite.guild_id, player.player_id, JSON.stringify({ via: "invite" })]);
        event = { type: "guild.invite_accepted", payload: { guildId: acceptedInvite.guild_id } };
      } else if (command.type === "guild.invite_decline") {
        const declined = await client.query("UPDATE guild_invites SET status = 'declined', responded_at = $3 WHERE id = $1 AND player_id = $2 AND status = 'pending'", [command.inviteId, player.player_id, now]);
        if (!declined.rowCount) throw new GuildDatabaseError("VALIDATION", "Diese Einladung ist nicht offen.");
        event = { type: "guild.invite_declined", payload: { inviteId: command.inviteId } };
      } else if (command.type === "guild.donate") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        try {
          await applyBalanceDelta(client, { kind: "wallet", playerId: player.player_id, commandId: envelope.commandId, definitionId: "guild_dna", delta: -BigInt(command.amount), reason: command.type, contentReleaseId: CONTENT_RELEASE_ID, balanceReleaseId: BALANCE_RELEASE_ID });
        } catch (error) {
          if (error instanceof Error && /balance is too low/iu.test(error.message)) throw new GuildDatabaseError("INSUFFICIENT_BALANCE", "Dir fehlen persönliche DNA-Fragmente.");
          throw error;
        }
        await guildBalanceDelta(client, { guildId: current.guild_id, playerId: player.player_id, commandId: envelope.commandId, delta: BigInt(command.amount), reason: command.type });
        await client.query("UPDATE guild_members SET contribution = contribution + $3, updated_at = $4 WHERE guild_id = $1 AND player_id = $2", [current.guild_id, player.player_id, command.amount, now]);
        event = { type: "guild.donated", payload: { amount: command.amount } };
      } else if (command.type === "guild.gene_upgrade") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader", "officer"]);
        const gene = GUILD_GENES.find((entry) => entry.id === command.geneId);
        if (!gene) throw new GuildDatabaseError("VALIDATION", "Dieses Gen existiert nicht.");
        const locked = await client.query<{ level: number } & QueryResultRow>("SELECT level FROM guild_dna_nodes WHERE guild_id = $1 AND gene_id = $2 FOR UPDATE", [current.guild_id, gene.id]);
        const level = locked.rows[0]?.level ?? 0;
        const cost = guildGeneCost(gene.id, level);
        if (cost <= 0) throw new GuildDatabaseError("VALIDATION", "Dieses Gen ist bereits maximal.");
        await guildBalanceDelta(client, { guildId: current.guild_id, playerId: player.player_id, commandId: envelope.commandId, delta: -BigInt(cost), reason: command.type, metadata: { geneId: gene.id, fromLevel: level, toLevel: level + 1 } });
        await client.query(
          `INSERT INTO guild_dna_nodes (guild_id, gene_id, level, updated_by_player_id, updated_at) VALUES ($1, $2, 1, $3, $4)
           ON CONFLICT (guild_id, gene_id) DO UPDATE SET level = guild_dna_nodes.level + 1, updated_by_player_id = EXCLUDED.updated_by_player_id, updated_at = EXCLUDED.updated_at`,
          [current.guild_id, gene.id, player.player_id, now],
        );
        event = { type: "guild.gene_upgraded", payload: { geneId: gene.id, level: level + 1, cost } };
      } else if (command.type === "guild.vote_create") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        if (command.kind === "gene_upgrade" && !GUILD_GENES.some((gene) => gene.id === command.subject)) throw new GuildDatabaseError("VALIDATION", "Dieses Gen existiert nicht.");
        if (command.kind === "policy_change" && !["open", "invite"].includes(command.subject)) throw new GuildDatabaseError("VALIDATION", "Diese Beitrittsregel existiert nicht.");
        const duplicate = await client.query("SELECT 1 FROM guild_votes WHERE guild_id = $1 AND kind = $2 AND payload->>'subject' = $3 AND status = 'open' AND closes_at > $4", [current.guild_id, command.kind, command.subject, now]);
        if (duplicate.rowCount) throw new GuildDatabaseError("VALIDATION", "Zu diesem Thema läuft bereits eine Abstimmung.");
        const vote = await client.query<{ id: string } & QueryResultRow>(
          "INSERT INTO guild_votes (guild_id, kind, payload, created_by_player_id, closes_at) VALUES ($1, $2, $3::jsonb, $4, $5::timestamptz + interval '24 hours') RETURNING id",
          [current.guild_id, command.kind, JSON.stringify({ subject: command.subject }), player.player_id, now],
        );
        await client.query("INSERT INTO guild_vote_ballots (vote_id, player_id, choice) VALUES ($1, $2, 'yes')", [vote.rows[0].id, player.player_id]);
        event = { type: "guild.vote_created", payload: { voteId: vote.rows[0].id, kind: command.kind, subject: command.subject } };
      } else if (command.type === "guild.vote_cast") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        const vote = await client.query("SELECT 1 FROM guild_votes WHERE id = $1 AND guild_id = $2 AND status = 'open' AND closes_at > $3", [command.voteId, current.guild_id, now]);
        if (!vote.rowCount) throw new GuildDatabaseError("VALIDATION", "Diese Abstimmung ist nicht offen.");
        await client.query("INSERT INTO guild_vote_ballots (vote_id, player_id, choice) VALUES ($1, $2, $3) ON CONFLICT (vote_id, player_id) DO UPDATE SET choice = EXCLUDED.choice, created_at = $4", [command.voteId, player.player_id, command.choice, now]);
        event = { type: "guild.vote_cast", payload: { voteId: command.voteId, choice: command.choice } };
      } else if (command.type === "guild.vote_resolve") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader", "officer"]);
        const voteResult = await client.query<{ kind: "gene_upgrade" | "policy_change"; payload: { subject?: string } } & QueryResultRow>("SELECT kind, payload FROM guild_votes WHERE id = $1 AND guild_id = $2 AND status = 'open' FOR UPDATE", [command.voteId, current.guild_id]);
        const vote = voteResult.rows[0];
        if (!vote) throw new GuildDatabaseError("VALIDATION", "Diese Abstimmung ist nicht offen.");
        const tally = await client.query<{ yes_count: string; no_count: string; member_count: string } & QueryResultRow>(
          `SELECT count(*) FILTER (WHERE b.choice = 'yes')::text AS yes_count,
                  count(*) FILTER (WHERE b.choice = 'no')::text AS no_count,
                  (SELECT count(*)::text FROM guild_members WHERE guild_id = $2) AS member_count
             FROM guild_vote_ballots b WHERE b.vote_id = $1`,
          [command.voteId, current.guild_id],
        );
        const yes = Number(tally.rows[0].yes_count);
        const no = Number(tally.rows[0].no_count);
        const eligible = Number(tally.rows[0].member_count);
        const passed = yes > no && yes * 2 > eligible;
        const subject = vote.payload.subject ?? "";
        if (passed && vote.kind === "gene_upgrade") {
          const gene = GUILD_GENES.find((entry) => entry.id === subject);
          if (!gene) throw new GuildDatabaseError("VALIDATION", "Das Abstimmungsgen existiert nicht mehr.");
          const locked = await client.query<{ level: number } & QueryResultRow>("SELECT level FROM guild_dna_nodes WHERE guild_id = $1 AND gene_id = $2 FOR UPDATE", [current.guild_id, gene.id]);
          const level = locked.rows[0]?.level ?? 0;
          const cost = guildGeneCost(gene.id, level);
          if (cost <= 0) throw new GuildDatabaseError("VALIDATION", "Dieses Gen ist bereits maximal.");
          await guildBalanceDelta(client, { guildId: current.guild_id, playerId: player.player_id, commandId: envelope.commandId, delta: -BigInt(cost), reason: "guild.vote_gene_upgrade", metadata: { voteId: command.voteId, geneId: gene.id } });
          await client.query("INSERT INTO guild_dna_nodes (guild_id, gene_id, level, updated_by_player_id, updated_at) VALUES ($1, $2, 1, $3, $4) ON CONFLICT (guild_id, gene_id) DO UPDATE SET level = guild_dna_nodes.level + 1, updated_by_player_id = EXCLUDED.updated_by_player_id, updated_at = EXCLUDED.updated_at", [current.guild_id, gene.id, player.player_id, now]);
        } else if (passed && vote.kind === "policy_change") {
          await client.query("UPDATE guilds SET join_policy = $2, revision = revision + 1, updated_at = $3 WHERE id = $1", [current.guild_id, subject, now]);
        }
        await client.query("UPDATE guild_votes SET status = $2, resolved_at = $3 WHERE id = $1", [command.voteId, passed ? "passed" : "rejected", now]);
        event = { type: "guild.vote_resolved", payload: { voteId: command.voteId, passed, yes, no, eligible } };
      } else if (command.type === "guild.task_claim") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        const task = await client.query<{ progress: string; target: string; reward_dna: string } & QueryResultRow>(
          `UPDATE guild_tasks SET claimed_at = $4, claimed_by_player_id = $3, claimed_by_command_id = $5, updated_at = $4
            WHERE guild_id = $1 AND period_key = $2 AND definition_id = $6 AND claimed_at IS NULL AND progress >= target
          RETURNING progress::text, target::text, reward_dna::text`,
          [current.guild_id, dailyPeriodKey(now.getTime()), player.player_id, now, envelope.commandId, command.taskId],
        );
        if (!task.rows[0]) throw new GuildDatabaseError("VALIDATION", "Diese Gildenaufgabe ist noch nicht bereit oder bereits beansprucht.");
        await guildBalanceDelta(client, { guildId: current.guild_id, playerId: player.player_id, commandId: envelope.commandId, delta: BigInt(task.rows[0].reward_dna), reason: command.type, metadata: { taskId: command.taskId } });
        await applyBalanceDelta(client, { kind: "wallet", playerId: player.player_id, commandId: envelope.commandId, definitionId: "guild_dna", delta: 10n, reason: command.type, contentReleaseId: CONTENT_RELEASE_ID, balanceReleaseId: BALANCE_RELEASE_ID });
        event = { type: "guild.task_claimed", payload: { taskId: command.taskId, guildDna: task.rows[0].reward_dna, personalDna: 10 } };
      } else if (command.type === "guild.boss_attack") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        await ensureGuildPeriod(client, current.guild_id, now);
        const weekKey = weeklyPeriodKey(now.getTime());
        const last = await client.query<{ created_at: Date } & QueryResultRow>("SELECT created_at FROM guild_boss_attacks WHERE guild_id = $1 AND period_key = $2 AND player_id = $3 ORDER BY created_at DESC LIMIT 1", [current.guild_id, weekKey, player.player_id]);
        if (last.rows[0] && now.getTime() - last.rows[0].created_at.getTime() < GUILD_BOSS.attackCooldownMs) throw new GuildDatabaseError("VALIDATION", "Dein Bossangriff lädt noch.");
        const monster = await client.query<{ level: number; hyper_level: number; evolution: string } & QueryResultRow>(
          `SELECT l.level, m.hyper_level, m.evolution FROM player_runs r
           JOIN player_run_levels l ON l.player_id = r.player_id AND l.monster_definition_id = r.active_monster_definition_id
           JOIN monster_instances m ON m.player_id = r.player_id AND m.definition_id = r.active_monster_definition_id
           WHERE r.player_id = $1`,
          [player.player_id],
        );
        const active = monster.rows[0];
        if (!active) throw new GuildDatabaseError("VALIDATION", "Wähle zuerst ein aktives Monster.");
        const bossGene = await client.query<{ level: number } & QueryResultRow>("SELECT level FROM guild_dna_nodes WHERE guild_id = $1 AND gene_id = 'boss-resonance'", [current.guild_id]);
        const damage = BigInt(Math.round((25 + active.level * 3 + active.hyper_level * 5 + (active.evolution === "evolved" ? 30 : 0)) * (1 + (bossGene.rows[0]?.level ?? 0) * 0.005)));
        const boss = await client.query<{ hp: string; max_hp: string } & QueryResultRow>("SELECT hp::text, max_hp::text FROM guild_bosses WHERE guild_id = $1 AND period_key = $2 FOR UPDATE", [current.guild_id, weekKey]);
        const before = BigInt(boss.rows[0].hp);
        if (before <= 0n) throw new GuildDatabaseError("VALIDATION", "Der Wochenboss ist bereits besiegt.");
        const dealt = damage > before ? before : damage;
        const after = before - dealt;
        await client.query("INSERT INTO guild_boss_attacks (guild_id, period_key, player_id, command_id, damage, created_at) VALUES ($1, $2, $3, $4, $5, $6)", [current.guild_id, weekKey, player.player_id, envelope.commandId, dealt.toString(), now]);
        await client.query("UPDATE guild_bosses SET hp = $3::numeric, defeated_at = CASE WHEN $3::numeric = 0 THEN $4::timestamptz ELSE NULL END, rewarded_by_command_id = CASE WHEN $3::numeric = 0 THEN $5::uuid ELSE NULL END, updated_at = $4::timestamptz WHERE guild_id = $1 AND period_key = $2", [current.guild_id, weekKey, after.toString(), now, envelope.commandId]);
        if (after === 0n) await guildBalanceDelta(client, { guildId: current.guild_id, playerId: player.player_id, commandId: envelope.commandId, delta: BigInt(GUILD_BOSS.defeatRewardDna), reason: "guild.boss_defeated" });
        event = { type: "guild.boss_attacked", payload: { damage: dealt.toString(), remainingHp: after.toString(), defeated: after === 0n } };
      } else if (command.type === "guild.expedition_start") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        requireRole(current.role, ["leader", "officer"]);
        const alreadyToday = await client.query("SELECT 1 FROM guild_expeditions WHERE guild_id = $1 AND started_at >= date_trunc('day', $2::timestamptz)", [current.guild_id, now]);
        if (alreadyToday.rowCount) throw new GuildDatabaseError("VALIDATION", "Die heutige Gildenexpedition wurde bereits gestartet.");
        const expedition = await client.query<{ id: string } & QueryResultRow>(
          `INSERT INTO guild_expeditions (guild_id, definition_id, started_by_player_id, started_by_command_id, started_at, completes_at, reward_dna)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [current.guild_id, GUILD_EXPEDITION.definitionId, player.player_id, envelope.commandId, now, new Date(now.getTime() + GUILD_EXPEDITION.durationMs), GUILD_EXPEDITION.rewardDna],
        );
        event = { type: "guild.expedition_started", payload: { expeditionId: expedition.rows[0].id, completesAt: new Date(now.getTime() + GUILD_EXPEDITION.durationMs).toISOString() } };
      } else if (command.type === "guild.expedition_claim") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        const claimed = await client.query<{ reward_dna: string } & QueryResultRow>(
          `UPDATE guild_expeditions SET claimed_at = $4, claimed_by_player_id = $3, claimed_by_command_id = $5
            WHERE id = $1 AND guild_id = $2 AND claimed_at IS NULL AND completes_at <= $4 RETURNING reward_dna::text`,
          [command.expeditionId, current.guild_id, player.player_id, now, envelope.commandId],
        );
        if (!claimed.rows[0]) throw new GuildDatabaseError("VALIDATION", "Diese Expedition ist noch nicht bereit oder bereits geborgen.");
        await guildBalanceDelta(client, { guildId: current.guild_id, playerId: player.player_id, commandId: envelope.commandId, delta: BigInt(claimed.rows[0].reward_dna), reason: command.type, metadata: { expeditionId: command.expeditionId } });
        event = { type: "guild.expedition_claimed", payload: { expeditionId: command.expeditionId, guildDna: claimed.rows[0].reward_dna } };
      } else if (command.type === "guild.chat_send") {
        if (!current) throw new GuildDatabaseError("VALIDATION", "Du bist in keiner Gilde.");
        const moderation = await client.query<{ muted_until: Date | null } & QueryResultRow>("SELECT muted_until FROM player_moderation_state WHERE player_id = $1", [player.player_id]);
        if (moderation.rows[0]?.muted_until && moderation.rows[0].muted_until > now) throw new GuildDatabaseError("FORBIDDEN", `Du kannst bis ${moderation.rows[0].muted_until.toISOString()} keine Chatnachrichten senden.`);
        const recent = await client.query<{ count: string } & QueryResultRow>("SELECT count(*)::text AS count FROM guild_chat_messages WHERE player_id = $1 AND created_at > $2::timestamptz - interval '10 seconds'", [player.player_id, now]);
        if (Number(recent.rows[0].count) >= 4) throw new GuildDatabaseError("VALIDATION", "Bitte sende Nachrichten etwas langsamer.");
        const moderated = chatBlocked(command.body);
        const inserted = await client.query<{ id: string } & QueryResultRow>(
          "INSERT INTO guild_chat_messages (guild_id, player_id, body, moderation_status, moderation_reason, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
          [current.guild_id, player.player_id, command.body.trim(), moderated ? "blocked" : "visible", moderated ? "automatic_spam_filter" : null, now],
        );
        event = { type: "guild.chat_sent", payload: { messageId: inserted.rows[0].id, visible: !moderated } };
      } else if (command.type === "friend.request") {
        const target = await client.query<{ id: string } & QueryResultRow>("SELECT id FROM player_profiles WHERE display_name_normalized = $1", [normalizedName(command.displayName)]);
        const targetId = target.rows[0]?.id;
        if (!targetId || targetId === player.player_id) throw new GuildDatabaseError("VALIDATION", "Dieser Tamer wurde nicht gefunden.");
        const blocked = await client.query("SELECT 1 FROM player_blocks WHERE (blocker_player_id = $1 AND blocked_player_id = $2) OR (blocker_player_id = $2 AND blocked_player_id = $1)", [player.player_id, targetId]);
        if (blocked.rowCount) throw new GuildDatabaseError("FORBIDDEN", "Zwischen diesen Accounts ist keine Kontaktanfrage möglich.");
        const [low, high] = pair(player.player_id, targetId);
        await client.query("INSERT INTO player_friendships (player_low_id, player_high_id, requested_by_player_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [low, high, player.player_id]);
        await client.query("UPDATE player_social_state SET revision = revision + 1 WHERE player_id = $1", [targetId]);
        event = { type: "friend.requested", payload: { playerId: targetId } };
      } else if (command.type === "friend.accept") {
        const [low, high] = pair(player.player_id, command.playerId);
        const accepted = await client.query("UPDATE player_friendships SET status = 'accepted', accepted_at = $3, updated_at = $3 WHERE player_low_id = $1 AND player_high_id = $2 AND status = 'pending' AND requested_by_player_id = $4", [low, high, now, command.playerId]);
        if (!accepted.rowCount) throw new GuildDatabaseError("VALIDATION", "Diese Freundschaftsanfrage ist nicht offen.");
        await client.query("UPDATE player_social_state SET revision = revision + 1 WHERE player_id = $1", [command.playerId]);
        event = { type: "friend.accepted", payload: { playerId: command.playerId } };
      } else if (command.type === "friend.remove") {
        const [low, high] = pair(player.player_id, command.playerId);
        await client.query("DELETE FROM player_friendships WHERE player_low_id = $1 AND player_high_id = $2", [low, high]);
        await client.query("UPDATE player_social_state SET revision = revision + 1 WHERE player_id = $1", [command.playerId]);
        event = { type: "friend.removed", payload: { playerId: command.playerId } };
      } else if (command.type === "player.block") {
        if (command.playerId === player.player_id) throw new GuildDatabaseError("VALIDATION", "Du kannst dich nicht selbst blockieren.");
        await client.query("INSERT INTO player_blocks (blocker_player_id, blocked_player_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [player.player_id, command.playerId]);
        const [low, high] = pair(player.player_id, command.playerId);
        await client.query("DELETE FROM player_friendships WHERE player_low_id = $1 AND player_high_id = $2", [low, high]);
        event = { type: "player.blocked", payload: { playerId: command.playerId } };
      } else if (command.type === "player.unblock") {
        await client.query("DELETE FROM player_blocks WHERE blocker_player_id = $1 AND blocked_player_id = $2", [player.player_id, command.playerId]);
        event = { type: "player.unblocked", payload: { playerId: command.playerId } };
      } else if (command.type === "player.report") {
        if (command.playerId === player.player_id) throw new GuildDatabaseError("VALIDATION", "Du kannst dich nicht selbst melden.");
        const report = await client.query<{ id: string } & QueryResultRow>("INSERT INTO player_reports (reporter_player_id, reported_player_id, guild_id, reason, details) VALUES ($1, $2, $3, $4, $5) RETURNING id", [player.player_id, command.playerId, current?.guild_id ?? null, command.reason, command.details.trim()]);
        event = { type: "player.reported", payload: { reportId: report.rows[0].id } };
      } else {
        throw new GuildDatabaseError("VALIDATION", "Dieses Gildenkommando ist nicht verfügbar.");
      }

      const nextRevision = revision + 1;
      await client.query("UPDATE player_social_state SET revision = $2, updated_at = $3 WHERE player_id = $1", [player.player_id, nextRevision, now]);
      player.revision = String(nextRevision);
      const response: GuildCommandResponse = { guildContractVersion: GUILD_CONTRACT_VERSION, accepted: true, replayed: false, snapshot: await snapshot(client, player, now), event };
      await client.query("UPDATE game_commands SET status = 'accepted', resulting_revision = $3, response_snapshot = $4::jsonb, completed_at = $5 WHERE player_id = $1 AND command_id = $2", [player.player_id, envelope.commandId, nextRevision, JSON.stringify(response), now]);
      return response;
    });
  }
}

export const loadGuildBonuses = async (client: PoolClient, playerId: string): Promise<{ goldMultiplier: number; bossDamageMultiplier: number; incubationReduction: number }> => {
  const result = await client.query<{ gene_id: string; level: number } & QueryResultRow>(
    `SELECT n.gene_id, n.level FROM guild_members m JOIN guild_dna_nodes n ON n.guild_id = m.guild_id WHERE m.player_id = $1`,
    [playerId],
  );
  const levels = new Map(result.rows.map((entry) => [entry.gene_id, entry.level]));
  return {
    goldMultiplier: 1 + (levels.get("wealth-signal") ?? 0) * 0.0025,
    bossDamageMultiplier: 1 + (levels.get("boss-resonance") ?? 0) * 0.005,
    incubationReduction: (levels.get("incubation-spiral") ?? 0) * 0.0025,
  };
};

export const incrementGuildTaskProgress = async (client: PoolClient, playerId: string, activity: string, amount: number, now: Date): Promise<void> => {
  if (amount <= 0) return;
  const task = GUILD_TASKS.find((entry) => entry.activity === activity);
  if (!task) return;
  await client.query(
    `UPDATE guild_tasks SET progress = LEAST(target, progress + $3), updated_at = $4
      WHERE guild_id = (SELECT guild_id FROM guild_members WHERE player_id = $1)
        AND period_key = $2 AND definition_id = $5 AND claimed_at IS NULL`,
    [playerId, dailyPeriodKey(now.getTime()), amount, now, task.id],
  );
};
