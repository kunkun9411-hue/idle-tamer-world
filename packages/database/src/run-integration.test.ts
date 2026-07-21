import { createHash, randomUUID } from "node:crypto";

import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PostgresAuthStore } from "./auth-store";
import { createDatabasePool } from "./pool";
import { PostgresRunStore, RunDatabaseError } from "./run-store";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;
const hash = (value: string): Buffer => createHash("sha256").update(value).digest();
const now = new Date("2026-07-21T20:00:00.000Z");

integration("PostgreSQL 18 authoritative run store", () => {
  let pool: Pool;
  let authStore: PostgresAuthStore;
  let runStore: PostgresRunStore;

  beforeAll(() => {
    pool = createDatabasePool(databaseUrl as string);
    authStore = new PostgresAuthStore(pool);
    runStore = new PostgresRunStore(pool);
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE users, auth_rate_limits CASCADE");
  });

  afterAll(async () => {
    await pool?.end();
  });

  const createRun = async (suffix: string) => {
    const verificationHash = hash(`verify-${suffix}`);
    const account = await authStore.createPendingAccount({
      emailOriginal: `${suffix}@example.test`,
      emailNormalized: `${suffix}@example.test`,
      displayName: `Run ${suffix}`,
      displayNameNormalized: `run ${suffix}`,
      passwordHash: "$argon2id$test",
      termsVersion: "alpha-foundation-1",
      privacyVersion: "alpha-foundation-1",
      verificationTokenHash: verificationHash,
      verificationExpiresAt: new Date(now.getTime() + 60_000),
      contentReleaseId: "foundation-1.0.0",
      balanceReleaseId: "low-numbers-1.0.0",
    });
    if (account.status !== "created") throw new Error("run test account setup failed");
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
    return { userId: account.userId, playerId };
  };

  const command = (expectedRevision: number, type: "cache.claim" | "monster.level_up" | "zone.select", values: Record<string, string> = {}, commandId = randomUUID()) => ({
    commandId,
    clientInstanceId: randomUUID(),
    expectedRevision,
    issuedAt: now.toISOString(),
    command: { type, ...values } as { type: "cache.claim" } | { type: "monster.level_up"; definitionId: string } | { type: "zone.select"; zoneId: string },
  });

  it("settles elapsed battles from server time and stops exactly at cache capacity", async () => {
    const account = await createRun("settlement");
    await pool.query("UPDATE player_run_levels SET level = 100 WHERE player_id = $1", [account.playerId]);
    await pool.query("UPDATE player_runs SET next_combat_at = $2 WHERE player_id = $1", [account.playerId, new Date(now.getTime() - 24 * 60 * 60 * 1_000)]);

    const result = await runStore.bootstrap(account.userId, now);

    expect(result.snapshot).toMatchObject({ revision: 1, cacheSlotsUsed: 90, cacheCapacity: 90, progressionStatus: "cache_full", runVictories: "90" });
    expect(result.settlement.victoriesAdded).toBe(90);
    expect(BigInt(result.settlement.goldAdded)).toBeGreaterThan(0n);
    await expect(runStore.bootstrap(account.userId, new Date(now.getTime() + 1_000))).resolves.toMatchObject({ snapshot: { revision: 1 }, settlement: { victoriesAdded: 0, goldAdded: "0" } });
    await expect(pool.query("SELECT count(*)::int AS count FROM pending_reward_batches WHERE player_id = $1 AND claimed_at IS NULL", [account.playerId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it("books one cache claim when the identical command arrives in parallel", async () => {
    const account = await createRun("parallel-claim");
    await pool.query("UPDATE player_run_levels SET level = 100 WHERE player_id = $1", [account.playerId]);
    await pool.query("UPDATE player_runs SET next_combat_at = $2 WHERE player_id = $1", [account.playerId, new Date(now.getTime() - 60_000)]);
    const bootstrap = await runStore.bootstrap(account.userId, now);
    const commandId = randomUUID();
    const payload = command(bootstrap.snapshot.revision, "cache.claim", {}, commandId);

    const results = await Promise.all([
      runStore.executeCommand(account.userId, payload, now),
      runStore.executeCommand(account.userId, payload, now),
    ]);

    expect(results.map((entry) => entry.replayed).sort()).toEqual([false, true]);
    expect(results[0].snapshot.gold).toBe(results[1].snapshot.gold);
    const proof = await pool.query(
      `SELECT
         (SELECT count(*)::int FROM economy_ledger WHERE player_id = $1 AND reason = 'cache.claim') AS ledger,
         (SELECT count(*)::int FROM pending_reward_batches WHERE player_id = $1 AND claimed_at IS NOT NULL) AS claimed`,
      [account.playerId],
    );
    expect(proof.rows[0]).toMatchObject({ ledger: 1, claimed: 1 });
  });

  it("allows only one of two different commands with the same revision", async () => {
    const account = await createRun("parallel-level");
    await pool.query("UPDATE wallet_balances SET amount = 10000 WHERE player_id = $1 AND definition_id = 'gold'", [account.playerId]);
    const first = command(0, "monster.level_up", { definitionId: "pyrook" });
    const second = command(0, "monster.level_up", { definitionId: "pyrook" });

    const results = await Promise.allSettled([
      runStore.executeCommand(account.userId, first, now),
      runStore.executeCommand(account.userId, second, now),
    ]);

    expect(results.filter((entry) => entry.status === "fulfilled")).toHaveLength(1);
    const rejection = results.find((entry): entry is PromiseRejectedResult => entry.status === "rejected");
    expect(rejection?.reason).toMatchObject({ code: "CONFLICT", latestRevision: 1 } satisfies Partial<RunDatabaseError>);
    await expect(pool.query("SELECT level FROM player_run_levels WHERE player_id = $1", [account.playerId])).resolves.toMatchObject({ rows: [{ level: 2 }] });
    await expect(pool.query("SELECT count(*)::int AS count FROM economy_ledger WHERE player_id = $1 AND reason = 'monster.level_up'", [account.playerId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it("keeps very large PostgreSQL numeric gold exact through a claim", async () => {
    const account = await createRun("large-number");
    const before = 999_999_999_999_999_999_999_999_999_999_999_999_999_999_999_999n;
    await pool.query("UPDATE wallet_balances SET amount = $2 WHERE player_id = $1 AND definition_id = 'gold'", [account.playerId, before.toString()]);
    await pool.query(
      `INSERT INTO pending_reward_batches
         (player_id, source, gold, slot_count, victory_count, content_release_id, balance_release_id, created_at, updated_at)
       VALUES ($1, 'combat', 13, 1, 1, 'foundation-1.0.0', 'low-numbers-1.0.0', $2, $2)`,
      [account.playerId, now],
    );
    const result = await runStore.executeCommand(account.userId, command(0, "cache.claim"), now);
    expect(result.snapshot.gold).toBe((before + 13n).toString());
    expect(result.event.payload.gold).toBe("13");
  });

  it("rejects locked zones and a second claim without partial writes", async () => {
    const account = await createRun("rollback");
    await expect(runStore.executeCommand(account.userId, command(0, "zone.select", { zoneId: "glass-gardens" }), now)).rejects.toMatchObject({ code: "VALIDATION" });
    await pool.query(
      `INSERT INTO pending_reward_batches
         (player_id, source, gold, slot_count, victory_count, content_release_id, balance_release_id, created_at, updated_at)
       VALUES ($1, 'combat', 13, 1, 1, 'foundation-1.0.0', 'low-numbers-1.0.0', $2, $2)`,
      [account.playerId, now],
    );
    await runStore.executeCommand(account.userId, command(0, "cache.claim"), now);
    await expect(runStore.executeCommand(account.userId, command(1, "cache.claim"), now)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(pool.query("SELECT count(*)::int AS count FROM economy_ledger WHERE player_id = $1 AND reason = 'cache.claim'", [account.playerId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query("SELECT count(*)::int AS count FROM game_commands WHERE player_id = $1 AND command_type = 'zone.select'", [account.playerId])).resolves.toMatchObject({ rows: [{ count: 0 }] });
  });
});
