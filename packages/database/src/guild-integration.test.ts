import { createHash, randomUUID } from "node:crypto";

import type { GuildCommand } from "@idle-tamer/contracts";
import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PostgresAuthStore } from "./auth-store";
import { PostgresGuildStore } from "./guild-store";
import { createDatabasePool } from "./pool";
import { PostgresRunStore } from "./run-store";
import { guardedTestDatabaseUrl } from "./test-database-guard";

const databaseUrl = guardedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const integration = databaseUrl ? describe : describe.skip;
const hash = (value: string): Buffer => createHash("sha256").update(value).digest();
const now = new Date("2026-07-22T01:00:00.000Z");

integration("PostgreSQL 18 guild and social store", () => {
  let pool: Pool;
  let authStore: PostgresAuthStore;
  let guildStore: PostgresGuildStore;
  let runStore: PostgresRunStore;

  beforeAll(() => {
    pool = createDatabasePool(databaseUrl as string);
    authStore = new PostgresAuthStore(pool);
    guildStore = new PostgresGuildStore(pool);
    runStore = new PostgresRunStore(pool);
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE users, auth_rate_limits CASCADE");
  });

  afterAll(async () => {
    await pool?.end();
  });

  const createPlayer = async (suffix: string) => {
    const verificationHash = hash(`verify-guild-${suffix}`);
    const account = await authStore.createPendingAccount({
      emailOriginal: `guild-${suffix}@example.test`,
      emailNormalized: `guild-${suffix}@example.test`,
      displayName: `Guild ${suffix}`,
      displayNameNormalized: `guild ${suffix}`,
      passwordHash: "$argon2id$test",
      termsVersion: "alpha-foundation-1",
      privacyVersion: "alpha-foundation-1",
      verificationTokenHash: verificationHash,
      verificationExpiresAt: new Date(now.getTime() + 60_000),
      contentReleaseId: "foundation-1.0.0",
      balanceReleaseId: "low-numbers-1.0.0",
    });
    if (account.status !== "created") throw new Error("guild test account setup failed");
    await authStore.verifyEmailToken(verificationHash, now);
    const profile = await pool.query<{ id: string }>("SELECT id FROM player_profiles WHERE user_id = $1", [account.userId]);
    const playerId = profile.rows[0].id;
    await authStore.chooseStarter({
      userId: account.userId,
      playerId,
      commandId: randomUUID(),
      clientInstanceId: randomUUID(),
      expectedRevision: 0,
      definitionId: "pyrook",
    });
    await runStore.bootstrap(account.userId, now);
    return { userId: account.userId, playerId, displayName: `Guild ${suffix}` };
  };

  const execute = async (userId: string, revision: number, command: GuildCommand, at = now, commandId = randomUUID()) => guildStore.executeCommand(userId, {
    commandId,
    clientInstanceId: randomUUID(),
    expectedRevision: revision,
    issuedAt: at.toISOString(),
    command,
  }, at);

  const createGuild = async (suffix: string) => {
    const leader = await createPlayer(`${suffix}-leader`);
    const created = await execute(leader.userId, 0, { type: "guild.create", name: `Ether ${suffix}`, tag: suffix.slice(0, 4).toUpperCase(), description: "Integration guild" });
    return { leader, snapshot: created.snapshot, guildId: created.snapshot.membership!.guildId };
  };

  it("creates, replays, joins, transfers leadership and enforces the hop cooldown", async () => {
    const leader = await createPlayer("membership-leader");
    const commandId = randomUUID();
    const created = await execute(leader.userId, 0, { type: "guild.create", name: "Etherwacht", tag: "ETW", description: "Wache" }, now, commandId);
    const replayed = await execute(leader.userId, 0, { type: "guild.create", name: "Etherwacht", tag: "ETW", description: "Wache" }, now, commandId);
    expect([created.replayed, replayed.replayed].sort()).toEqual([false, true]);

    const member = await createPlayer("membership-member");
    const joined = await execute(member.userId, 0, { type: "guild.join", guildId: created.snapshot.membership!.guildId });
    expect(joined.snapshot.membership?.memberCount).toBe(2);
    const transferred = await execute(leader.userId, 1, { type: "guild.leadership_transfer", playerId: member.playerId });
    expect(transferred.snapshot.membership?.role).toBe("officer");
    await expect(execute(leader.userId, 2, { type: "guild.leave" })).resolves.toMatchObject({ snapshot: { membership: null } });
    await expect(execute(leader.userId, 3, { type: "guild.join", guildId: created.snapshot.membership!.guildId })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("books donations and a single concurrent DNA upgrade exactly once", async () => {
    const { leader, snapshot, guildId } = await createGuild("dna");
    const donated = await execute(leader.userId, snapshot.revision, { type: "guild.donate", amount: 100 });
    expect(donated.snapshot.membership).toMatchObject({ dnaBalance: "100", personalDna: "0" });
    const revision = donated.snapshot.revision;
    const results = await Promise.allSettled([
      execute(leader.userId, revision, { type: "guild.gene_upgrade", geneId: "wealth-signal" }),
      execute(leader.userId, revision, { type: "guild.gene_upgrade", geneId: "wealth-signal" }),
    ]);
    expect(results.filter((entry) => entry.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((entry) => entry.status === "rejected")).toHaveLength(1);
    await expect(pool.query("SELECT count(*)::int AS count FROM guild_ledger WHERE guild_id = $1", [guildId])).resolves.toMatchObject({ rows: [{ count: 2 }] });
    await expect(pool.query("SELECT level FROM guild_dna_nodes WHERE guild_id = $1 AND gene_id = 'wealth-signal'", [guildId])).resolves.toMatchObject({ rows: [{ level: 1 }] });
  });

  it("supports invitations, majority votes and role permissions", async () => {
    const { leader, snapshot } = await createGuild("vote");
    const member = await createPlayer("vote-member");
    const invited = await execute(leader.userId, snapshot.revision, { type: "guild.invite", displayName: member.displayName });
    const incoming = await guildStore.bootstrap(member.userId, now);
    expect(incoming.snapshot.invitations).toHaveLength(1);
    const joined = await execute(member.userId, incoming.snapshot.revision, { type: "guild.invite_accept", inviteId: incoming.snapshot.invitations[0].inviteId });
    expect(joined.snapshot.membership?.memberCount).toBe(2);
    await expect(execute(member.userId, joined.snapshot.revision, { type: "guild.role_set", playerId: leader.playerId, role: "member" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const vote = await execute(member.userId, joined.snapshot.revision, { type: "guild.vote_create", kind: "policy_change", subject: "invite" });
    const leaderState = await guildStore.bootstrap(leader.userId, now);
    const cast = await execute(leader.userId, leaderState.snapshot.revision, { type: "guild.vote_cast", voteId: vote.event.payload.voteId as string, choice: "yes" });
    const resolved = await execute(leader.userId, cast.snapshot.revision, { type: "guild.vote_resolve", voteId: vote.event.payload.voteId as string });
    expect(resolved.event.payload).toMatchObject({ passed: true, yes: 2, eligible: 2 });
    expect(resolved.snapshot.membership?.joinPolicy).toBe("invite");
  });

  it("claims daily tasks and a timed guild expedition only once", async () => {
    const { leader, snapshot, guildId } = await createGuild("jobs");
    await pool.query("UPDATE guild_tasks SET progress = target WHERE guild_id = $1", [guildId]);
    const claimedTask = await execute(leader.userId, snapshot.revision, { type: "guild.task_claim", taskId: "daily-victories" });
    await expect(execute(leader.userId, claimedTask.snapshot.revision, { type: "guild.task_claim", taskId: "daily-victories" })).rejects.toMatchObject({ code: "VALIDATION" });
    const started = await execute(leader.userId, claimedTask.snapshot.revision, { type: "guild.expedition_start" });
    const expeditionId = started.snapshot.membership!.expedition!.expeditionId;
    await pool.query("UPDATE guild_expeditions SET completes_at = $2 WHERE id = $1", [expeditionId, new Date(now.getTime() - 1_000)]);
    const expeditionState = await guildStore.bootstrap(leader.userId, now);
    expect(expeditionState.snapshot.membership?.expedition?.status).toBe("claimable");
    const claimed = await execute(leader.userId, expeditionState.snapshot.revision, { type: "guild.expedition_claim", expeditionId });
    await expect(execute(leader.userId, claimed.snapshot.revision, { type: "guild.expedition_claim", expeditionId })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(pool.query("SELECT count(*)::int AS count FROM guild_ledger WHERE guild_id = $1 AND reason IN ('guild.task_claim', 'guild.expedition_claim')", [guildId])).resolves.toMatchObject({ rows: [{ count: 2 }] });
  });

  it("serializes boss damage from different members and rejects cooldown bypass", async () => {
    const { leader, snapshot, guildId } = await createGuild("boss");
    const member = await createPlayer("boss-member");
    const joined = await execute(member.userId, 0, { type: "guild.join", guildId });
    const attacks = await Promise.all([
      execute(leader.userId, snapshot.revision, { type: "guild.boss_attack" }),
      execute(member.userId, joined.snapshot.revision, { type: "guild.boss_attack" }),
    ]);
    expect(attacks.every((entry) => BigInt(entry.event.payload.damage as string) > 0n)).toBe(true);
    const leaderState = await guildStore.bootstrap(leader.userId, now);
    await expect(execute(leader.userId, leaderState.snapshot.revision, { type: "guild.boss_attack" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(pool.query("SELECT count(*)::int AS count FROM guild_boss_attacks WHERE guild_id = $1", [guildId])).resolves.toMatchObject({ rows: [{ count: 2 }] });
  });

  it("filters chat spam and applies friendship, block and report rules", async () => {
    const { leader, snapshot, guildId } = await createGuild("social");
    const member = await createPlayer("social-member");
    await execute(member.userId, 0, { type: "guild.join", guildId });
    const clean = await execute(leader.userId, snapshot.revision, { type: "guild.chat_send", body: "Willkommen in der Etherwacht" });
    const blockedChat = await execute(leader.userId, clean.snapshot.revision, { type: "guild.chat_send", body: "https://discord.gg/spam" });
    expect(blockedChat.event.payload.visible).toBe(false);
    await expect(pool.query("SELECT moderation_status FROM guild_chat_messages ORDER BY created_at", [])).resolves.toMatchObject({ rows: [{ moderation_status: "visible" }, { moderation_status: "blocked" }] });

    const requested = await execute(leader.userId, blockedChat.snapshot.revision, { type: "friend.request", displayName: member.displayName });
    const memberState = await guildStore.bootstrap(member.userId, now);
    const accepted = await execute(member.userId, memberState.snapshot.revision, { type: "friend.accept", playerId: leader.playerId });
    expect(accepted.snapshot.friends[0].status).toBe("accepted");
    const blocked = await execute(leader.userId, requested.snapshot.revision, { type: "player.block", playerId: member.playerId });
    expect(blocked.snapshot.blockedPlayerIds).toContain(member.playerId);
    await expect(execute(member.userId, accepted.snapshot.revision, { type: "friend.request", displayName: leader.displayName })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const memberLatest = await guildStore.bootstrap(member.userId, now);
    const report = await execute(member.userId, memberLatest.snapshot.revision, { type: "player.report", playerId: leader.playerId, reason: "harassment", details: "Integration proof" });
    expect(report.event.payload.reportId).toBeTypeOf("string");
  });
});
