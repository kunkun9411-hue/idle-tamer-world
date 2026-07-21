import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PostgresAuthStore } from "./auth-store";
import { runAuthMaintenance } from "./auth-maintenance";
import { createDatabasePool } from "./pool";
import { getSupportAccountReport } from "./support-account-report";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;
const hash = (value: string): Buffer => createHash("sha256").update(value).digest();

integration("PostgreSQL 18 auth store", () => {
  let pool: Pool;
  let store: PostgresAuthStore;

  beforeAll(() => {
    pool = createDatabasePool(databaseUrl as string);
    store = new PostgresAuthStore(pool);
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE users, auth_rate_limits CASCADE");
  });

  afterAll(async () => {
    await pool?.end();
  });

  const createAccount = async (suffix = "one") => store.createPendingAccount({
    emailOriginal: `${suffix}@example.test`,
    emailNormalized: `${suffix}@example.test`,
    displayName: `Tamer ${suffix}`,
    displayNameNormalized: `tamer ${suffix}`,
    passwordHash: "$argon2id$test",
    termsVersion: "alpha-foundation-1",
    privacyVersion: "alpha-foundation-1",
    verificationTokenHash: hash(`verify-${suffix}`),
    verificationExpiresAt: new Date(Date.now() + 60_000),
    contentReleaseId: "foundation-1.0.0",
    balanceReleaseId: "low-numbers-1.0.0",
  });

  it("creates the whole pending account atomically and activates only with the token", async () => {
    const created = await createAccount();
    expect(created.status).toBe("created");
    if (created.status !== "created") return;
    await expect(store.findCredential("one@example.test")).resolves.toMatchObject({ status: "pending_verification", emailVerified: false });
    await expect(store.verifyEmailToken(hash("wrong"), new Date())).resolves.toBe(false);
    await expect(store.verifyEmailToken(hash("verify-one"), new Date())).resolves.toBe(true);
    await expect(store.findCredential("one@example.test")).resolves.toMatchObject({ status: "active", emailVerified: true });
    const counts = await pool.query(`SELECT
      (SELECT count(*)::int FROM player_profiles) AS profiles,
      (SELECT count(*)::int FROM user_roles) AS roles,
      (SELECT count(*)::int FROM policy_acceptances) AS policies,
      (SELECT count(*)::int FROM cosmetic_entitlements) AS cosmetics,
      (SELECT count(*)::int FROM player_name_reservations) AS names`);
    expect(counts.rows[0]).toMatchObject({ profiles: 1, roles: 1, policies: 2, cosmetics: 4, names: 1 });
  });

  it("lets only one concurrent email and name registration win", async () => {
    const [first, second] = await Promise.all([createAccount("race"), createAccount("race")]);
    expect([first.status, second.status].sort()).toEqual(["created", "email_exists"]);
  });

  it("rejects a duplicate display name without leaving a partial second account", async () => {
    const first = await createAccount("name-owner");
    expect(first.status).toBe("created");
    const duplicate = await store.createPendingAccount({
      emailOriginal: "different@example.test",
      emailNormalized: "different@example.test",
      displayName: "Tamer name-owner",
      displayNameNormalized: "tamer name-owner",
      passwordHash: "$argon2id$test",
      termsVersion: "alpha-foundation-1",
      privacyVersion: "alpha-foundation-1",
      verificationTokenHash: hash("verify-different"),
      verificationExpiresAt: new Date(Date.now() + 60_000),
      contentReleaseId: "foundation-1.0.0",
      balanceReleaseId: "low-numbers-1.0.0",
    });
    expect(duplicate.status).toBe("display_name_taken");
    await expect(pool.query("SELECT count(*)::int AS count FROM users")).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it("counts parallel rate-limit attempts atomically", async () => {
    const windowStarted = new Date("2026-07-21T20:00:00.000Z");
    const blockedUntil = new Date("2026-07-21T20:15:00.000Z");
    const attempts = await Promise.all(Array.from({ length: 6 }, () => store.consumeRateLimit({
      action: "integration.login",
      keyHash: hash("private-rate-key"),
      windowStarted,
      limit: 5,
      blockedUntil,
    })));
    expect(attempts.filter((attempt) => attempt.allowed)).toHaveLength(5);
    expect(attempts.filter((attempt) => !attempt.allowed)).toHaveLength(1);
    expect(attempts.map((attempt) => attempt.attemptCount).sort((left, right) => left - right)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(attempts.find((attempt) => !attempt.allowed)?.blockedUntil).toEqual(blockedUntil);
  });

  it("keeps at most ten active sessions and chooses a starter idempotently", async () => {
    const created = await createAccount("sessions");
    if (created.status !== "created") throw new Error("account setup failed");
    await store.verifyEmailToken(hash("verify-sessions"), new Date());
    let latestToken = Buffer.alloc(32);
    let latestSessionId = "";
    for (let index = 0; index < 11; index += 1) {
      latestToken = randomBytes(32);
      latestSessionId = await store.createSession({
        userId: created.userId,
        tokenHash: latestToken,
        csrfHash: randomBytes(32),
        clientInstanceId: randomUUID(),
        deviceName: `Testgerät ${index}`,
        userAgentSummary: "Test; Integration",
        rememberMe: false,
        idleExpiresAt: new Date(Date.now() + 60_000),
        absoluteExpiresAt: new Date(Date.now() + 120_000),
      });
    }
    const sessions = await store.listSessions(created.userId);
    expect(sessions).toHaveLength(10);
    const identity = await store.authenticateSession(latestToken, new Date(), 60_000, 120_000);
    expect(identity?.sessionId).toBe(latestSessionId);
    const bootstrap = await store.getBootstrap(created.userId, latestSessionId);
    if (!bootstrap) throw new Error("bootstrap setup failed");
    const commandId = randomUUID();
    const command = {
      userId: created.userId,
      playerId: bootstrap.playerId,
      commandId,
      clientInstanceId: randomUUID(),
      expectedRevision: 0,
      definitionId: "pyrook",
    };
    await expect(store.chooseStarter(command)).resolves.toEqual({ revision: 1, replayed: false });
    await expect(store.chooseStarter(command)).resolves.toEqual({ revision: 1, replayed: true });
    await expect(store.getBootstrap(created.userId, latestSessionId)).resolves.toMatchObject({ starterDefinitionId: "pyrook", revision: 1 });
  });

  it("returns a masked read-only support report without credential or token material", async () => {
    const created = await createAccount("support-report");
    if (created.status !== "created") throw new Error("account setup failed");
    await store.verifyEmailToken(hash("verify-support-report"), new Date());
    await store.createSession({
      userId: created.userId,
      tokenHash: randomBytes(32),
      csrfHash: randomBytes(32),
      clientInstanceId: randomUUID(),
      deviceName: "Integration Browser",
      userAgentSummary: "Test; Integration",
      rememberMe: true,
      idleExpiresAt: new Date(Date.now() + 60_000),
      absoluteExpiresAt: new Date(Date.now() + 120_000),
    });

    const report = await getSupportAccountReport(pool, { email: "support-report@example.test" });

    expect(report).toMatchObject({
      account: { status: "active", emailMasked: "su***@example.test", emailVerified: true, roles: ["player"] },
      profile: { displayName: "Tamer support-report", starterDefinitionId: null, revision: 0 },
      sessions: { activeCount: 1, revokedCount: 0, active: [{ deviceName: "Integration Browser", rememberMe: true }] },
      openTokens: { verification: 0, passwordReset: 0, deletionCancellation: 0 },
      openExportJobs: 0,
    });
    expect(JSON.stringify(report)).not.toMatch(/password_hash|token_hash|csrf_hash|email_normalized/iu);
  });

  it("anonymizes accounts only after the deletion grace period has elapsed", async () => {
    const created = await createAccount("deletion");
    if (created.status !== "created") throw new Error("account setup failed");
    await store.verifyEmailToken(hash("verify-deletion"), new Date());

    const before = await pool.query<{ local_storage_namespace: string }>(
      "SELECT local_storage_namespace::text FROM player_profiles WHERE user_id = $1",
      [created.userId],
    );
    const now = new Date("2026-07-21T12:00:00.000Z");
    await store.requestDeletion(
      created.userId,
      new Date("2026-07-13T12:00:00.000Z"),
      new Date("2026-07-20T12:00:00.000Z"),
    );

    await expect(runAuthMaintenance(pool, new Date("2026-07-19T12:00:00.000Z"))).resolves.toMatchObject({ anonymizedAccounts: 0 });
    await expect(store.findCredential("deletion@example.test")).resolves.not.toBeNull();
    await expect(runAuthMaintenance(pool, now)).resolves.toMatchObject({ anonymizedAccounts: 1 });
    await expect(store.findCredential("deletion@example.test")).resolves.toBeNull();

    const account = await pool.query<{
      status: string;
      email_original: string | null;
      deleted_at: Date | null;
      display_name_normalized: string;
      starter_definition_id: string | null;
      local_storage_namespace: string;
    }>(
      `SELECT u.status, u.email_original, u.deleted_at,
              p.display_name_normalized, p.starter_definition_id,
              p.local_storage_namespace::text
         FROM users u JOIN player_profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [created.userId],
    );
    expect(account.rows[0]).toMatchObject({
      status: "deleted",
      email_original: null,
      starter_definition_id: null,
    });
    expect(account.rows[0]?.deleted_at).not.toBeNull();
    expect(account.rows[0]?.display_name_normalized).toMatch(/^deleted-tamer-/u);
    expect(account.rows[0]?.local_storage_namespace).not.toBe(before.rows[0]?.local_storage_namespace);
  });
});
