import { randomUUID } from "node:crypto";

import type {
  AuthStore,
  BootstrapRecord,
  ConsumeRateLimitInput,
  CreatePendingAccountInput,
  CreatePendingAccountResult,
  CreateSessionInput,
  CredentialRecord,
  SessionIdentity,
  StarterCommandInput,
  StoredSessionSummary,
} from "@idle-tamer/database";
import { describe, expect, it } from "vitest";

import { buildApp } from "../app";
import { MemoryAuthMailAdapter } from "./mail";

const origin = "https://idle-tamer.test";
const userId = "01900000-0000-7000-8000-000000000201";
const playerId = "01900000-0000-7000-8000-000000000202";

const testConfig = {
  NODE_ENV: "test" as const,
  HOST: "127.0.0.1",
  PORT: 3_001,
  LOG_LEVEL: "silent" as const,
  DATABASE_URL: "postgres://unused",
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

class MemoryAuthStore implements AuthStore {
  private credential: CredentialRecord | null = null;
  private verificationHash: Buffer | null = null;
  private resetHash: Buffer | null = null;
  private session: (SessionIdentity & { tokenHash: Buffer; createdAt: Date; lastSeenAt: Date; deviceName: string }) | null = null;
  private displayName = "Test Tamer";
  private revision = 0;
  private starter: string | null = null;
  private command: { id: string; definitionId: string; revision: number } | null = null;
  private readonly rateLimits = new Map<string, number>();

  public async createPendingAccount(input: CreatePendingAccountInput): Promise<CreatePendingAccountResult> {
    this.credential = { userId, passwordHash: input.passwordHash, status: "pending_verification", emailVerified: false };
    this.verificationHash = input.verificationTokenHash;
    this.displayName = input.displayName;
    return { status: "created", userId };
  }

  public async verifyEmailToken(tokenHash: Buffer): Promise<boolean> {
    if (!this.verificationHash?.equals(tokenHash) || !this.credential) return false;
    this.credential = { ...this.credential, status: "active", emailVerified: true };
    this.verificationHash = null;
    return true;
  }

  public async issueAccountToken(email: string, kind: "verify_email" | "reset_password", tokenHash: Buffer): Promise<{ email: string; displayName: string } | null> {
    if (email !== "test@example.com") return null;
    if (kind === "reset_password") this.resetHash = tokenHash;
    else this.verificationHash = tokenHash;
    return this.credential ? { email: "test@example.com", displayName: this.displayName } : null;
  }

  public async findCredential(): Promise<CredentialRecord | null> { return this.credential; }
  public async findCredentialByUserId(): Promise<CredentialRecord | null> { return this.credential; }
  public async resetPassword(tokenHash: Buffer, passwordHash: string): Promise<boolean> {
    if (!this.resetHash?.equals(tokenHash) || !this.credential) return false;
    this.credential = { ...this.credential, passwordHash };
    this.resetHash = null;
    return true;
  }

  public async createSession(input: CreateSessionInput): Promise<string> {
    const sessionId = "01900000-0000-7000-8000-000000000203";
    const now = new Date();
    this.session = {
      sessionId,
      userId,
      csrfHash: input.csrfHash,
      rememberMe: input.rememberMe,
      idleExpiresAt: input.idleExpiresAt,
      absoluteExpiresAt: input.absoluteExpiresAt,
      tokenHash: input.tokenHash,
      createdAt: now,
      lastSeenAt: now,
      deviceName: input.deviceName,
    };
    return sessionId;
  }

  public async authenticateSession(tokenHash: Buffer): Promise<SessionIdentity | null> {
    return this.session?.tokenHash.equals(tokenHash) ? this.session : null;
  }

  public async rotateCsrf(_userId: string, _sessionId: string, csrfHash: Buffer): Promise<void> {
    if (this.session) this.session.csrfHash = csrfHash;
  }

  public async rotateSession(_userId: string, _sessionId: string, tokenHash: Buffer, csrfHash: Buffer): Promise<SessionIdentity | null> {
    if (!this.session) return null;
    this.session = { ...this.session, sessionId: randomUUID(), tokenHash, csrfHash };
    return this.session;
  }

  public async getBootstrap(): Promise<BootstrapRecord | null> {
    if (!this.session) return null;
    return {
      sessionId: this.session.sessionId,
      userId,
      accountStatus: "active",
      emailNormalized: "test@example.com",
      emailVerifiedAt: new Date("2026-07-21T20:00:00.000Z"),
      accountCreatedAt: new Date("2026-07-21T19:00:00.000Z"),
      roles: ["player"],
      deviceName: this.session.deviceName,
      sessionCreatedAt: this.session.createdAt,
      lastSeenAt: this.session.lastSeenAt,
      idleExpiresAt: this.session.idleExpiresAt,
      absoluteExpiresAt: this.session.absoluteExpiresAt,
      reauthenticatedAt: this.session.createdAt,
      playerId,
      displayName: this.displayName,
      avatarId: "wanderer",
      frameId: "silver",
      revision: this.revision,
      starterDefinitionId: this.starter,
      localStorageNamespace: "01900000-0000-7000-8000-000000000204",
    };
  }

  public async listSessions(): Promise<StoredSessionSummary[]> {
    return this.session ? [{
      sessionId: this.session.sessionId,
      deviceName: this.session.deviceName,
      createdAt: this.session.createdAt,
      lastSeenAt: this.session.lastSeenAt,
      idleExpiresAt: this.session.idleExpiresAt,
      absoluteExpiresAt: this.session.absoluteExpiresAt,
    }] : [];
  }

  public async revokeSession(): Promise<void> { this.session = null; }
  public async revokeOtherSessions(): Promise<void> {}
  public async createExportJob(): Promise<{ exportId: string; status: "pending"; requestedAt: Date }> {
    return { exportId: randomUUID(), status: "pending", requestedAt: new Date() };
  }
  public async requestDeletion(): Promise<void> {}
  public async cancelDeletion(): Promise<boolean> { return true; }

  public async chooseStarter(input: StarterCommandInput): Promise<{ revision: number; replayed: boolean }> {
    if (this.command?.id === input.commandId) return { revision: this.command.revision, replayed: true };
    this.starter = input.definitionId;
    this.revision += 1;
    this.command = { id: input.commandId, definitionId: input.definitionId, revision: this.revision };
    return { revision: this.revision, replayed: false };
  }
  public async updateCosmetic(): Promise<{ revision: number; replayed: boolean }> {
    this.revision += 1;
    return { revision: this.revision, replayed: false };
  }

  public async consumeRateLimit(_input: ConsumeRateLimitInput): Promise<{ allowed: boolean; attemptCount: number; blockedUntil: Date | null }> {
    const key = `${_input.action}:${_input.keyHash.toString("hex")}:${_input.windowStarted.toISOString()}`;
    const attemptCount = (this.rateLimits.get(key) ?? 0) + 1;
    this.rateLimits.set(key, attemptCount);
    return {
      allowed: attemptCount <= _input.limit,
      attemptCount,
      blockedUntil: attemptCount > _input.limit ? _input.blockedUntil : null,
    };
  }
}

describe("account HTTP flow", () => {
  it("registers, verifies, logs in, bootstraps and chooses one starter", async () => {
    const authStore = new MemoryAuthStore();
    const authMail = new MemoryAuthMailAdapter();
    const loginFailureDelays: number[] = [];
    const app = buildApp({
      config: testConfig,
      database: { ping: async () => undefined },
      authStore,
      authMail,
      authSleep: async (milliseconds) => { loginFailureDelays.push(milliseconds); },
      logger: false,
    });
    const clientInstanceId = randomUUID();

    const register = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin },
      payload: {
        email: "test@example.com",
        password: "eine wirklich sichere test passphrase",
        displayName: "Test Tamer",
        clientInstanceId,
        termsVersion: "alpha-foundation-1",
        privacyVersion: "alpha-foundation-1",
      },
    });
    expect(register.statusCode).toBe(202);
    expect(authMail.verificationMessages).toHaveLength(1);

    const token = new URL(authMail.verificationMessages[0].verificationUrl).hash.split("=")[1];
    const verify = await app.inject({ method: "POST", url: "/api/v1/auth/verify-email", headers: { origin }, payload: { token } });
    expect(verify.statusCode).toBe(204);

    const forgot = await app.inject({ method: "POST", url: "/api/v1/auth/password/forgot", headers: { origin }, payload: { email: "test@example.com" } });
    expect(forgot.statusCode).toBe(202);
    const forgotUnknown = await app.inject({ method: "POST", url: "/api/v1/auth/password/forgot", headers: { origin }, payload: { email: "unknown@example.com" } });
    expect(forgotUnknown.statusCode).toBe(202);
    expect(forgotUnknown.json()).toMatchObject({
      authContractVersion: forgot.json().authContractVersion,
      accepted: forgot.json().accepted,
      message: forgot.json().message,
    });
    const resetToken = new URL(authMail.passwordResetMessages[0].resetUrl).hash.split("=")[1];
    const reset = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset",
      headers: { origin },
      payload: { token: resetToken, password: "eine neue sichere test passphrase", passwordConfirmation: "eine neue sichere test passphrase" },
    });
    expect(reset.statusCode).toBe(204);

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin, "user-agent": "Mozilla/5.0 Windows Chrome/140" },
      payload: { identifier: "test@example.com", password: "eine neue sichere test passphrase", rememberMe: true, clientInstanceId },
    });
    expect(login.statusCode).toBe(200);
    expect(login.headers["set-cookie"]).toContain("__Host-idle_tamer_session=");
    expect(login.headers["set-cookie"]).toContain("HttpOnly");
    expect(login.headers["set-cookie"]).toContain("Secure");
    expect(login.headers["set-cookie"]).toContain("SameSite=Strict");
    expect(login.headers["set-cookie"]).toContain("Path=/");
    expect(login.headers["set-cookie"]).toContain("Max-Age=7776000");
    expect(login.headers["set-cookie"]).not.toMatch(/(?:^|;)\s*Domain=/iu);
    const invalidAfterSuccess = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin },
      payload: { identifier: "test@example.com", password: "eine falsche aber lange passphrase", rememberMe: false, clientInstanceId: randomUUID() },
    });
    expect(invalidAfterSuccess.statusCode).toBe(401);
    expect(loginFailureDelays).toEqual([250]);
    const setCookie = login.headers["set-cookie"];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(";")[0] ?? "";

    const loginCsrfToken = login.json().bootstrap.csrfToken as string;
    const bootstrap = await app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie } });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json()).toMatchObject({
      authority: { mode: "solo-online" },
      onboarding: { requiredAction: "starter_choice" },
      profile: { avatarId: "wanderer", frameId: "silver" },
    });
    const csrfToken = bootstrap.json().csrfToken as string;

    const staleCsrf = await app.inject({
      method: "POST",
      url: "/api/v1/account/commands",
      headers: { cookie, origin, "x-csrf-token": loginCsrfToken },
      payload: {
        commandId: randomUUID(),
        clientInstanceId,
        expectedRevision: 0,
        issuedAt: new Date().toISOString(),
        command: { type: "starter.choose", definitionId: "pyrook" },
      },
    });
    expect(staleCsrf.statusCode).toBe(403);
    expect(staleCsrf.json()).toMatchObject({ reason: "CSRF_INVALID" });

    const choose = await app.inject({
      method: "POST",
      url: "/api/v1/account/commands",
      headers: { cookie, origin, "x-csrf-token": csrfToken },
      payload: {
        commandId: randomUUID(),
        clientInstanceId,
        expectedRevision: 0,
        issuedAt: new Date().toISOString(),
        command: { type: "starter.choose", definitionId: "pyrook" },
      },
    });
    expect(choose.statusCode).toBe(200);
    expect(choose.json()).toMatchObject({ resultingRevision: 1, bootstrap: { onboarding: { starterDefinitionId: "pyrook", requiredAction: null } } });

    let revision = 1;
    for (let commandNumber = 2; commandNumber <= 30; commandNumber += 1) {
      const cosmetic = await app.inject({
        method: "POST",
        url: "/api/v1/account/commands",
        headers: { cookie, origin, "x-csrf-token": csrfToken },
        payload: {
          commandId: randomUUID(),
          clientInstanceId,
          expectedRevision: revision,
          issuedAt: new Date().toISOString(),
          command: { type: "profile.avatar", avatarId: "wanderer" },
        },
      });
      expect(cosmetic.statusCode).toBe(200);
      revision = cosmetic.json().resultingRevision as number;
    }
    const commandCeiling = await app.inject({
      method: "POST",
      url: "/api/v1/account/commands",
      headers: { cookie, origin, "x-csrf-token": csrfToken },
      payload: {
        commandId: randomUUID(),
        clientInstanceId,
        expectedRevision: revision,
        issuedAt: new Date().toISOString(),
        command: { type: "profile.avatar", avatarId: "wanderer" },
      },
    });
    expect(commandCeiling.statusCode).toBe(429);
    expect(commandCeiling.json()).toMatchObject({ code: "RATE_LIMITED" });

    const accountExport = await app.inject({ method: "POST", url: "/api/v1/account/export", headers: { cookie, origin, "x-csrf-token": csrfToken }, payload: {} });
    expect(accountExport.statusCode).toBe(202);
    expect(accountExport.json()).toMatchObject({ status: "pending" });

    for (let authenticatedAttempt = 35; authenticatedAttempt <= 120; authenticatedAttempt += 1) {
      const sessions = await app.inject({ method: "GET", url: "/api/v1/auth/sessions", headers: { cookie } });
      expect(sessions.statusCode).toBe(200);
    }
    const authenticatedCeiling = await app.inject({ method: "GET", url: "/api/v1/auth/sessions", headers: { cookie } });
    expect(authenticatedCeiling.statusCode).toBe(429);
    expect(authenticatedCeiling.json()).toMatchObject({ code: "RATE_LIMITED" });
    await app.close();
  }, 10_000);

  it("rejects mutations from another origin before touching auth state", async () => {
    const app = buildApp({ config: testConfig, database: { ping: async () => undefined }, authStore: new MemoryAuthStore(), authMail: new MemoryAuthMailAdapter(), logger: false });
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { origin: "https://evil.test" }, payload: {} });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ errorContractVersion: 2, reason: "ORIGIN_INVALID" });
    await app.close();
  });

  it("requires JSON for unauthenticated state changes", async () => {
    const app = buildApp({ config: testConfig, database: { ping: async () => undefined }, authStore: new MemoryAuthStore(), authMail: new MemoryAuthMailAdapter(), logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin, "content-type": "text/plain" },
      payload: "{}",
    });
    expect(response.statusCode).toBe(415);
    expect(response.json()).toMatchObject({ errorContractVersion: 2, code: "VALIDATION" });
    await app.close();
  });

  it("applies the progressive delay only after invalid credentials", async () => {
    const delays: number[] = [];
    const app = buildApp({
      config: testConfig,
      database: { ping: async () => undefined },
      authStore: new MemoryAuthStore(),
      authMail: new MemoryAuthMailAdapter(),
      authSleep: async (milliseconds) => { delays.push(milliseconds); },
      logger: false,
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin },
      payload: { identifier: "unknown@example.com", password: "eine falsche aber lange passphrase", rememberMe: false, clientInstanceId: randomUUID() },
    });
    expect(response.statusCode).toBe(401);
    expect(delays).toEqual([250]);
    await app.close();
  }, 10_000);

  it("returns 429 with Retry-After after the configured login ceiling", async () => {
    const app = buildApp({
      config: testConfig,
      database: { ping: async () => undefined },
      authStore: new MemoryAuthStore(),
      authMail: new MemoryAuthMailAdapter(),
      authSleep: async () => undefined,
      logger: false,
    });
    let response;
    for (let attempt = 1; attempt <= 11; attempt += 1) {
      response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        headers: { origin },
        payload: { identifier: "limited@example.com", password: "eine falsche aber lange passphrase", rememberMe: false, clientInstanceId: randomUUID() },
      });
      expect(response.statusCode).toBe(attempt <= 10 ? 401 : 429);
    }
    expect(response?.headers["retry-after"]).toBeTruthy();
    expect(response?.json()).toMatchObject({ code: "RATE_LIMITED" });
    expect(response?.json()).not.toHaveProperty("attemptCount");
    await app.close();
  }, 20_000);

  it("blocks the sixth failed use of one reset token", async () => {
    const app = buildApp({
      config: testConfig,
      database: { ping: async () => undefined },
      authStore: new MemoryAuthStore(),
      authMail: new MemoryAuthMailAdapter(),
      logger: false,
    });
    const token = "one-invalid-reset-token-with-enough-entropy-shape";
    let response;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/password/reset",
        headers: { origin },
        payload: {
          token,
          password: "eine neue sichere Testpassphrase",
          passwordConfirmation: "eine neue sichere Testpassphrase",
        },
      });
      expect(response.statusCode).toBe(attempt <= 5 ? 400 : 429);
    }
    expect(response?.headers["retry-after"]).toBeTruthy();
    expect(response?.json()).toMatchObject({ code: "RATE_LIMITED" });
    await app.close();
  }, 20_000);
});
