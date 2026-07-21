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

  public async issueAccountToken(_email: string, kind: "verify_email" | "reset_password", tokenHash: Buffer): Promise<{ email: string; displayName: string } | null> {
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

  public async consumeRateLimit(_input: ConsumeRateLimitInput): Promise<{ allowed: boolean; blockedUntil: Date | null }> {
    return { allowed: true, blockedUntil: null };
  }
}

describe("account HTTP flow", () => {
  it("registers, verifies, logs in, bootstraps and chooses one starter", async () => {
    const authStore = new MemoryAuthStore();
    const authMail = new MemoryAuthMailAdapter();
    const app = buildApp({ config: testConfig, database: { ping: async () => undefined }, authStore, authMail, logger: false });
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
    expect(login.headers["set-cookie"]).toContain("SameSite=Strict");
    const setCookie = login.headers["set-cookie"];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(";")[0] ?? "";

    const bootstrap = await app.inject({ method: "GET", url: "/api/v1/bootstrap", headers: { cookie } });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json()).toMatchObject({
      authority: { mode: "account-online-game-local" },
      onboarding: { requiredAction: "starter_choice" },
      profile: { avatarId: "wanderer", frameId: "silver" },
    });
    const csrfToken = bootstrap.json().csrfToken as string;

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

    const accountExport = await app.inject({ method: "POST", url: "/api/v1/account/export", headers: { cookie, origin, "x-csrf-token": csrfToken }, payload: {} });
    expect(accountExport.statusCode).toBe(202);
    expect(accountExport.json()).toMatchObject({ status: "pending" });
    await app.close();
  }, 10_000);

  it("rejects mutations from another origin before touching auth state", async () => {
    const app = buildApp({ config: testConfig, database: { ping: async () => undefined }, authStore: new MemoryAuthStore(), authMail: new MemoryAuthMailAdapter(), logger: false });
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", headers: { origin: "https://evil.test" }, payload: {} });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ errorContractVersion: 2, reason: "ORIGIN_INVALID" });
    await app.close();
  });
});
