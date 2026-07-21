import { randomUUID } from "node:crypto";

import type { AccountBootstrapResponse } from "@idle-tamer/contracts";
import { createDatabasePool, guardedTestDatabaseUrl, PostgresAuthStore, PostgresRunStore } from "@idle-tamer/database";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../app";
import { MemoryAuthMailAdapter } from "./mail";
import { hashPassword, randomOpaqueToken, sha256 } from "./security";

const databaseUrl = guardedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const integration = databaseUrl ? describe : describe.skip;
const origin = "https://idle-tamer.test";
const password = "eine sichere PostgreSQL Testpassphrase";
const newPassword = "eine neue PostgreSQL Testpassphrase";
const config = {
  NODE_ENV: "test" as const,
  HOST: "127.0.0.1",
  PORT: 3_001,
  LOG_LEVEL: "silent" as const,
  DATABASE_URL: databaseUrl ?? "postgres://unused",
  PUBLIC_ORIGIN: origin,
  AUTH_TERMS_VERSION: "alpha-foundation-1",
  AUTH_PRIVACY_VERSION: "alpha-foundation-1",
  RATE_LIMIT_HMAC_SECRET: "test-rate-limit-secret-at-least-32-characters",
  AUTH_MAIL_OUTBOX_PATH: ".local/test-auth-outbox.jsonl",
  FEATURE_GUILDS: false,
  FEATURE_GUILD_DNA: false,
  FEATURE_LIVE_EVENTS: false,
  FEATURE_PVP: false,
};

const cookieFrom = (setCookie: string | string[] | number | undefined): string => {
  const value = Array.isArray(setCookie) ? setCookie[0] : String(setCookie ?? "");
  return value.split(";", 1)[0];
};

integration("full auth HTTP lifecycle on PostgreSQL 18", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let store: PostgresAuthStore;
  let app: ReturnType<typeof buildApp>;

  beforeAll(() => {
    pool = createDatabasePool(databaseUrl as string);
    store = new PostgresAuthStore(pool);
    app = buildApp({
      config,
      database: { ping: async () => undefined },
      authStore: store,
      runStore: new PostgresRunStore(pool),
      authMail: new MemoryAuthMailAdapter(),
      authSleep: async () => undefined,
      logger: false,
    });
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE users, auth_rate_limits CASCADE");
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  const createActiveAccount = async (suffix: string): Promise<{ userId: string; email: string; displayName: string }> => {
    const email = `${suffix}@example.test`;
    const displayName = `Tamer ${suffix}`;
    const verificationToken = `verify-${suffix}`;
    const created = await store.createPendingAccount({
      emailOriginal: email,
      emailNormalized: email,
      displayName,
      displayNameNormalized: displayName.toLocaleLowerCase("und"),
      passwordHash: await hashPassword(password),
      termsVersion: "alpha-foundation-1",
      privacyVersion: "alpha-foundation-1",
      verificationTokenHash: sha256(verificationToken),
      verificationExpiresAt: new Date(Date.now() + 60_000),
      contentReleaseId: "foundation-1.0.0",
      balanceReleaseId: "low-numbers-1.0.0",
    });
    if (created.status !== "created") throw new Error(`account setup failed: ${created.status}`);
    await expect(store.verifyEmailToken(sha256(verificationToken), new Date())).resolves.toBe(true);
    return { userId: created.userId, email, displayName };
  };

  const login = async (email: string, userAgent: string): Promise<{ cookie: string; bootstrap: AccountBootstrapResponse }> => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin, "user-agent": userAgent },
      payload: { identifier: email, password, rememberMe: false, clientInstanceId: randomUUID() },
    });
    expect(response.statusCode).toBe(200);
    return { cookie: cookieFrom(response.headers["set-cookie"]), bootstrap: response.json().bootstrap as AccountBootstrapResponse };
  };

  it("loads one profile and starter in two independent browser sessions and revokes only the other one", async () => {
    const account = await createActiveAccount("dual-browser");
    const first = await login(account.email, "Mozilla/5.0 Windows Chrome/140");
    const second = await login(account.email, "Mozilla/5.0 Linux Firefox/141");

    expect(second.bootstrap.account.userId).toBe(first.bootstrap.account.userId);
    expect(second.bootstrap.profile).toEqual(first.bootstrap.profile);
    expect(second.bootstrap.authority.localStorageNamespace).toBe(first.bootstrap.authority.localStorageNamespace);
    expect(second.bootstrap.session.sessionId).not.toBe(first.bootstrap.session.sessionId);

    const choose = await app.inject({
      method: "POST",
      url: "/api/v1/account/commands",
      headers: { cookie: first.cookie, origin, "x-csrf-token": first.bootstrap.csrfToken },
      payload: {
        commandId: randomUUID(),
        clientInstanceId: randomUUID(),
        expectedRevision: 0,
        issuedAt: new Date().toISOString(),
        command: { type: "starter.choose", definitionId: "pyrook" },
      },
    });
    expect(choose.statusCode).toBe(200);

    const secondBootstrap = await app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: second.cookie } });
    expect(secondBootstrap.statusCode).toBe(200);
    expect(secondBootstrap.json()).toMatchObject({
      profile: { playerId: first.bootstrap.profile.playerId, revision: 1 },
      onboarding: { starterDefinitionId: "pyrook", requiredAction: null },
      authority: { localStorageNamespace: first.bootstrap.authority.localStorageNamespace },
    });

    const sessions = await app.inject({ method: "GET", url: "/api/v1/auth/sessions", headers: { cookie: first.cookie } });
    expect(sessions.statusCode).toBe(200);
    expect(sessions.json().sessions).toHaveLength(2);
    expect(sessions.json().sessions.filter((entry: { current: boolean }) => entry.current)).toHaveLength(1);

    const revokeOthers = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout-others",
      headers: { cookie: first.cookie, origin, "x-csrf-token": first.bootstrap.csrfToken },
      payload: {},
    });
    expect(revokeOthers.statusCode).toBe(204);
    await expect(app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: second.cookie } }))
      .resolves.toMatchObject({ statusCode: 401 });
    await expect(app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: first.cookie } }))
      .resolves.toMatchObject({ statusCode: 200 });
  }, 20_000);

  it("rotates the session on reauthentication and rejects fixed cookies plus stale CSRF tokens", async () => {
    const account = await createActiveAccount("rotation");
    const first = await login(account.email, "Mozilla/5.0 Windows Chrome/140");
    const rotated = await app.inject({
      method: "POST",
      url: "/api/v1/auth/reauthenticate",
      headers: { cookie: first.cookie, origin, "x-csrf-token": first.bootstrap.csrfToken },
      payload: { password },
    });
    expect(rotated.statusCode).toBe(200);
    const rotatedCookie = cookieFrom(rotated.headers["set-cookie"]);
    const rotatedBootstrap = rotated.json().bootstrap as AccountBootstrapResponse;
    expect(rotatedCookie).not.toBe(first.cookie);
    expect(rotatedBootstrap.session.sessionId).not.toBe(first.bootstrap.session.sessionId);

    const oldCookie = await app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: first.cookie } });
    expect(oldCookie.statusCode).toBe(401);
    const staleCsrf = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: rotatedCookie, origin, "x-csrf-token": first.bootstrap.csrfToken },
      payload: {},
    });
    expect(staleCsrf.statusCode).toBe(403);
    expect(staleCsrf.json()).toMatchObject({ reason: "CSRF_INVALID" });

    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: rotatedCookie, origin, "x-csrf-token": rotatedBootstrap.csrfToken },
      payload: {},
    });
    expect(logout.statusCode).toBe(204);
    await expect(app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: rotatedCookie } }))
      .resolves.toMatchObject({ statusCode: 401 });

    const reasons = await pool.query<{ revoke_reason: string }>(
      "SELECT revoke_reason FROM user_sessions WHERE user_id = $1 ORDER BY created_at",
      [account.userId],
    );
    expect(reasons.rows.map((row) => row.revoke_reason)).toEqual(["rotated", "logout"]);
  }, 20_000);

  it("expires idle sessions and blocks locked accounts", async () => {
    const account = await createActiveAccount("expiry");
    const expiredToken = randomOpaqueToken();
    const now = new Date();
    const sessionId = await store.createSession({
      userId: account.userId,
      tokenHash: sha256(expiredToken),
      csrfHash: sha256(randomOpaqueToken()),
      clientInstanceId: randomUUID(),
      deviceName: "Abgelaufenes Testgerät",
      userAgentSummary: "Test; expiry",
      rememberMe: false,
      idleExpiresAt: new Date(now.getTime() + 30_000),
      absoluteExpiresAt: new Date(now.getTime() + 60_000),
    });
    await pool.query(
      "UPDATE user_sessions SET created_at = $2, idle_expires_at = $3 WHERE id = $1",
      [sessionId, new Date(now.getTime() - 60_000), new Date(now.getTime() - 1_000)],
    );
    const expired = await app.inject({
      method: "GET",
      url: "/api/v1/bootstrap",
      headers: { cookie: `__Host-idle_tamer_session=${expiredToken}` },
    });
    expect(expired.statusCode).toBe(401);
    await expect(pool.query("SELECT revoke_reason FROM user_sessions WHERE id = $1", [sessionId]))
      .resolves.toMatchObject({ rows: [{ revoke_reason: "expired" }] });

    await pool.query("UPDATE users SET status = 'locked' WHERE id = $1", [account.userId]);
    const locked = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin },
      payload: { identifier: account.email, password, rememberMe: false, clientInstanceId: randomUUID() },
    });
    expect(locked.statusCode).toBe(403);
    expect(locked.json()).toMatchObject({ reason: "AUTH_ACCOUNT_UNAVAILABLE" });
  }, 20_000);

  it("consumes reset tokens once and revokes every existing session", async () => {
    const account = await createActiveAccount("reset");
    const first = await login(account.email, "Mozilla/5.0 Windows Chrome/140");
    const second = await login(account.email, "Mozilla/5.0 Linux Firefox/141");
    const resetToken = randomOpaqueToken();
    await store.issueAccountToken(account.email, "reset_password", sha256(resetToken), new Date(Date.now() + 60_000));

    const reset = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset",
      headers: { origin },
      payload: { token: resetToken, password: newPassword, passwordConfirmation: newPassword },
    });
    expect(reset.statusCode).toBe(204);
    await expect(app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: first.cookie } }))
      .resolves.toMatchObject({ statusCode: 401 });
    await expect(app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie: second.cookie } }))
      .resolves.toMatchObject({ statusCode: 401 });

    const revoked = await pool.query<{ revoke_reason: string }>("SELECT revoke_reason FROM user_sessions WHERE user_id = $1", [account.userId]);
    expect(revoked.rows).toHaveLength(2);
    expect(revoked.rows.every((row) => row.revoke_reason === "password_reset")).toBe(true);

    const reused = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset",
      headers: { origin },
      payload: { token: resetToken, password: newPassword, passwordConfirmation: newPassword },
    });
    expect(reused.statusCode).toBe(400);
    expect(reused.json()).toMatchObject({ reason: "TOKEN_INVALID" });

    const oldPassword = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin },
      payload: { identifier: account.email, password, rememberMe: false, clientInstanceId: randomUUID() },
    });
    expect(oldPassword.statusCode).toBe(401);
    const newPasswordLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin },
      payload: { identifier: account.email, password: newPassword, rememberMe: false, clientInstanceId: randomUUID() },
    });
    expect(newPasswordLogin.statusCode).toBe(200);
  }, 30_000);

  it("serves and claims the authoritative run without accepting client rewards", async () => {
    const account = await createActiveAccount("online-run");
    const session = await login(account.email, "Mozilla/5.0 Windows Chrome/140");
    const choose = await app.inject({
      method: "POST",
      url: "/api/v1/account/commands",
      headers: { cookie: session.cookie, origin, "x-csrf-token": session.bootstrap.csrfToken },
      payload: {
        commandId: randomUUID(),
        clientInstanceId: randomUUID(),
        expectedRevision: 0,
        issuedAt: new Date().toISOString(),
        command: { type: "starter.choose", definitionId: "pyrook" },
      },
    });
    expect(choose.statusCode).toBe(200);
    const playerId = choose.json().bootstrap.profile.playerId as string;
    await pool.query("UPDATE player_run_levels SET level = 100 WHERE player_id = $1", [playerId]);
    await pool.query("UPDATE player_runs SET next_combat_at = clock_timestamp() - interval '2 minutes' WHERE player_id = $1", [playerId]);

    const bootstrap = await app.inject({ method: "GET", url: "/api/v1/run", headers: { cookie: session.cookie } });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json()).toMatchObject({ runContractVersion: 2, snapshot: { gold: "100", cacheSlotsUsed: expect.any(Number), collection: { roster: expect.any(Array) } } });
    expect(bootstrap.json().snapshot.cacheSlotsUsed).toBeGreaterThan(0);

    const commandId = randomUUID();
    const payload = {
      commandId,
      clientInstanceId: randomUUID(),
      expectedRevision: bootstrap.json().snapshot.revision,
      issuedAt: new Date().toISOString(),
      command: { type: "cache.claim", gold: "999999999999999999", victories: 999 },
    };
    const claimed = await app.inject({
      method: "POST",
      url: "/api/v1/run/commands",
      headers: { cookie: session.cookie, origin, "x-csrf-token": session.bootstrap.csrfToken },
      payload,
    });
    expect(claimed.statusCode).toBe(200);
    expect(claimed.json()).toMatchObject({ accepted: true, replayed: false, event: { type: "cache.claimed" } });
    expect(BigInt(claimed.json().snapshot.gold)).toBe(100n + BigInt(claimed.json().event.payload.gold));

    const replayed = await app.inject({
      method: "POST",
      url: "/api/v1/run/commands",
      headers: { cookie: session.cookie, origin, "x-csrf-token": session.bootstrap.csrfToken },
      payload,
    });
    expect(replayed.statusCode).toBe(200);
    expect(replayed.json()).toMatchObject({ replayed: true, snapshot: { gold: claimed.json().snapshot.gold } });
    await expect(pool.query("SELECT count(*)::int AS count FROM economy_ledger WHERE player_id = $1 AND reason = 'cache.claim'", [playerId]))
      .resolves.toMatchObject({ rows: [{ count: 1 }] });
  }, 30_000);
});
