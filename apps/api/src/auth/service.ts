import { timingSafeEqual } from "node:crypto";

import { AVATARS, FRAMES, MONSTERS } from "@idle-tamer/content";
import {
  AUTH_CONTRACT_VERSION,
  BALANCE_RELEASE_ID,
  CONTENT_RELEASE_ID,
  type AccountBootstrapResponse,
  type AccountCommandEnvelope,
  type AccountRole,
  type LoginRequest,
  type RegisterRequest,
} from "@idle-tamer/contracts";
import { DatabaseCommandError, type AuthStore, type SessionIdentity } from "@idle-tamer/database";

import { AuthError } from "./errors";
import type { AuthMailPort } from "./mail";
import {
  hashPassword,
  maskEmail,
  normalizeDisplayName,
  normalizeEmail,
  passwordPolicyError,
  randomOpaqueToken,
  sha256,
  summarizeDevice,
  verifyPassword,
} from "./security";

const NORMAL_IDLE_MS = 24 * 60 * 60 * 1_000;
const NORMAL_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1_000;
const REMEMBER_IDLE_MS = 14 * 24 * 60 * 60 * 1_000;
const REMEMBER_ABSOLUTE_MS = 90 * 24 * 60 * 60 * 1_000;
const VERIFY_TOKEN_MS = 24 * 60 * 60 * 1_000;
const RESET_TOKEN_MS = 30 * 60 * 1_000;
const DELETION_DELAY_MS = 7 * 24 * 60 * 60 * 1_000;
const REAUTH_WINDOW_MS = 15 * 60 * 1_000;
const SESSION_COOKIE_NAME = "__Host-idle_tamer_session";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=1$aWRsZS10YW1lci1kZXYtMQ$UHxDteQvvLtY0rSPhbVmLzvjd5ehREn4XUPXJdOPYFw";

export interface AuthServiceConfig {
  publicOrigin: string;
  termsVersion: string;
  privacyVersion: string;
  features: AccountBootstrapResponse["features"];
}

export interface AuthenticatedSession {
  identity: SessionIdentity;
  csrfToken?: string;
}

export interface LoginResult {
  sessionToken: string;
  csrfToken: string;
  cookieMaxAgeSeconds: number;
  bootstrap: AccountBootstrapResponse;
}

const date = (value: Date): string => value.toISOString();

const assertObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AuthError(400, "VALIDATION", undefined, "Ungültige Anfrage.");
  return value as Record<string, unknown>;
};

const stringField = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  if (typeof value !== "string") throw new AuthError(400, "VALIDATION", undefined, "Bitte prüfe deine Eingaben.", { fieldErrors: { [key]: "Pflichtfeld" } });
  return value;
};

export class AuthService {
  public static readonly cookieName = SESSION_COOKIE_NAME;
  public readonly availableStarterDefinitionIds = MONSTERS.map((monster) => monster.id);

  public constructor(
    private readonly store: AuthStore,
    private readonly mail: AuthMailPort,
    private readonly config: AuthServiceConfig,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async register(payload: unknown): Promise<void> {
    const body = assertObject(payload);
    const request: RegisterRequest = {
      email: stringField(body, "email"),
      password: stringField(body, "password"),
      displayName: stringField(body, "displayName"),
      clientInstanceId: stringField(body, "clientInstanceId"),
      termsVersion: stringField(body, "termsVersion"),
      privacyVersion: stringField(body, "privacyVersion"),
    };
    const emailNormalized = normalizeEmail(request.email);
    const displayName = normalizeDisplayName(request.displayName);
    const passwordError = passwordPolicyError(request.password);
    if (!emailNormalized) throw new AuthError(400, "VALIDATION", undefined, "Bitte verwende eine gültige E-Mail-Adresse.", { fieldErrors: { email: "Ungültige E-Mail-Adresse" } });
    if (!displayName) throw new AuthError(400, "VALIDATION", undefined, "Der Tamer-Name erfüllt die Namensregeln nicht.", { fieldErrors: { displayName: "3 bis 20 erlaubte Zeichen" } });
    if (passwordError) throw new AuthError(400, "VALIDATION", undefined, passwordError, { fieldErrors: { password: passwordError } });
    if (!UUID_PATTERN.test(request.clientInstanceId)) throw new AuthError(400, "VALIDATION", undefined, "Die Browserkennung ist ungültig.");
    if (request.termsVersion !== this.config.termsVersion || request.privacyVersion !== this.config.privacyVersion) {
      throw new AuthError(400, "VALIDATION", undefined, "Die angezeigten Datenschutz- oder Nutzungsbedingungen sind veraltet.");
    }

    const token = randomOpaqueToken();
    const createdAt = this.now();
    const result = await this.store.createPendingAccount({
      emailOriginal: request.email.trim().normalize("NFC"),
      emailNormalized,
      displayName: displayName.display,
      displayNameNormalized: displayName.normalized,
      passwordHash: await hashPassword(request.password),
      termsVersion: request.termsVersion,
      privacyVersion: request.privacyVersion,
      verificationTokenHash: sha256(token),
      verificationExpiresAt: new Date(createdAt.getTime() + VERIFY_TOKEN_MS),
      contentReleaseId: CONTENT_RELEASE_ID,
      balanceReleaseId: BALANCE_RELEASE_ID,
    });
    if (result.status === "display_name_taken") throw new AuthError(409, "VALIDATION", "DISPLAY_NAME_TAKEN", "Dieser Tamer-Name ist bereits vergeben.");
    if (result.status !== "created") return;

    const verificationUrl = `${this.config.publicOrigin}/#verify-email=${encodeURIComponent(token)}`;
    await this.mail.sendVerification({
      recipient: emailNormalized,
      displayName: displayName.display,
      verificationUrl,
      expiresAt: new Date(createdAt.getTime() + VERIFY_TOKEN_MS).toISOString(),
    }).catch(() => undefined);
  }

  public async verifyEmail(payload: unknown): Promise<void> {
    const token = stringField(assertObject(payload), "token");
    if (token.length < 32 || !await this.store.verifyEmailToken(sha256(token), this.now())) {
      throw new AuthError(400, "VALIDATION", "TOKEN_INVALID", "Dieser Link ist ungültig oder abgelaufen.");
    }
  }

  public async resendVerification(payload: unknown): Promise<void> {
    const email = normalizeEmail(stringField(assertObject(payload), "email"));
    if (!email) return;
    const token = randomOpaqueToken();
    const now = this.now();
    const account = await this.store.issueAccountToken(email, "verify_email", sha256(token), new Date(now.getTime() + VERIFY_TOKEN_MS));
    if (!account) return;
    await this.mail.sendVerification({
      recipient: account.email,
      displayName: account.displayName,
      verificationUrl: `${this.config.publicOrigin}/#verify-email=${encodeURIComponent(token)}`,
      expiresAt: new Date(now.getTime() + VERIFY_TOKEN_MS).toISOString(),
    }).catch(() => undefined);
  }

  public async forgotPassword(payload: unknown): Promise<void> {
    const email = normalizeEmail(stringField(assertObject(payload), "email"));
    if (!email) return;
    const token = randomOpaqueToken();
    const now = this.now();
    const account = await this.store.issueAccountToken(email, "reset_password", sha256(token), new Date(now.getTime() + RESET_TOKEN_MS));
    if (!account) return;
    await this.mail.sendPasswordReset({
      recipient: account.email,
      displayName: account.displayName,
      resetUrl: `${this.config.publicOrigin}/#reset-password=${encodeURIComponent(token)}`,
      expiresAt: new Date(now.getTime() + RESET_TOKEN_MS).toISOString(),
    }).catch(() => undefined);
  }

  public async resetPassword(payload: unknown): Promise<void> {
    const body = assertObject(payload);
    const token = stringField(body, "token");
    const password = stringField(body, "password");
    const confirmation = stringField(body, "passwordConfirmation");
    if (password !== confirmation) throw new AuthError(400, "VALIDATION", undefined, "Die Passwortbestätigung stimmt nicht überein.");
    const policyError = passwordPolicyError(password);
    if (policyError) throw new AuthError(400, "VALIDATION", undefined, policyError, { fieldErrors: { password: policyError } });
    const changed = await this.store.resetPassword(sha256(token), await hashPassword(password), this.now());
    if (!changed) throw new AuthError(400, "VALIDATION", "TOKEN_INVALID", "Dieser Link ist ungültig oder abgelaufen.");
  }

  public async login(payload: unknown, userAgent?: string): Promise<LoginResult> {
    const body = assertObject(payload);
    const request: LoginRequest = {
      identifier: stringField(body, "identifier"),
      password: stringField(body, "password"),
      rememberMe: body.rememberMe === true,
      clientInstanceId: stringField(body, "clientInstanceId"),
    };
    if (!UUID_PATTERN.test(request.clientInstanceId)) throw new AuthError(400, "VALIDATION", undefined, "Die Browserkennung ist ungültig.");
    const identifier = normalizeEmail(request.identifier);
    const credential = identifier ? await this.store.findCredential(identifier) : null;
    const passwordValid = await verifyPassword(request.password, credential?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!credential || !passwordValid) throw new AuthError(401, "UNAUTHENTICATED", "AUTH_INVALID_CREDENTIALS", "E-Mail oder Passwort ist falsch.");
    if (credential.status === "pending_verification" || !credential.emailVerified) {
      throw new AuthError(403, "FORBIDDEN", "AUTH_EMAIL_UNVERIFIED", "Bitte bestätige zuerst deine E-Mail-Adresse.");
    }
    if (credential.status !== "active" && credential.status !== "deletion_pending") {
      throw new AuthError(403, "FORBIDDEN", "AUTH_ACCOUNT_UNAVAILABLE", "Dieser Account ist derzeit nicht verfügbar.");
    }

    const now = this.now();
    const idleMs = request.rememberMe ? REMEMBER_IDLE_MS : NORMAL_IDLE_MS;
    const absoluteMs = request.rememberMe ? REMEMBER_ABSOLUTE_MS : NORMAL_ABSOLUTE_MS;
    const sessionToken = randomOpaqueToken();
    const csrfToken = randomOpaqueToken();
    const device = summarizeDevice(userAgent);
    const sessionId = await this.store.createSession({
      userId: credential.userId,
      tokenHash: sha256(sessionToken),
      csrfHash: sha256(csrfToken),
      clientInstanceId: request.clientInstanceId,
      deviceName: device.deviceName,
      userAgentSummary: device.userAgentSummary,
      rememberMe: request.rememberMe,
      idleExpiresAt: new Date(now.getTime() + idleMs),
      absoluteExpiresAt: new Date(now.getTime() + absoluteMs),
    });
    const identity: SessionIdentity = {
      sessionId,
      userId: credential.userId,
      csrfHash: sha256(csrfToken),
      rememberMe: request.rememberMe,
      idleExpiresAt: new Date(now.getTime() + idleMs),
      absoluteExpiresAt: new Date(now.getTime() + absoluteMs),
    };
    return {
      sessionToken,
      csrfToken,
      cookieMaxAgeSeconds: Math.floor(absoluteMs / 1_000),
      bootstrap: await this.bootstrapFromIdentity(identity, csrfToken),
    };
  }

  public async authenticate(sessionToken: string | undefined, csrfToken?: string): Promise<AuthenticatedSession> {
    if (!sessionToken) throw new AuthError(401, "UNAUTHENTICATED", "SESSION_EXPIRED", "Bitte melde dich erneut an.");
    const now = this.now();
    const candidate = await this.store.authenticateSession(sha256(sessionToken), now, NORMAL_IDLE_MS, REMEMBER_IDLE_MS);
    if (!candidate) throw new AuthError(401, "UNAUTHENTICATED", "SESSION_EXPIRED", "Bitte melde dich erneut an.");
    if (csrfToken !== undefined) {
      const actual = sha256(csrfToken);
      if (actual.length !== candidate.csrfHash.length || !timingSafeEqual(actual, candidate.csrfHash)) {
        throw new AuthError(403, "FORBIDDEN", "CSRF_INVALID", "Die Sicherheitsprüfung ist abgelaufen. Bitte lade die Seite neu.");
      }
    }
    return { identity: candidate, csrfToken };
  }

  public authorizeCsrf(session: AuthenticatedSession, csrfToken: string | undefined): AuthenticatedSession {
    if (!csrfToken) throw new AuthError(403, "FORBIDDEN", "CSRF_INVALID", "Die Sicherheitsprüfung ist abgelaufen. Bitte lade die Seite neu.");
    const actual = sha256(csrfToken);
    if (actual.length !== session.identity.csrfHash.length || !timingSafeEqual(actual, session.identity.csrfHash)) {
      throw new AuthError(403, "FORBIDDEN", "CSRF_INVALID", "Die Sicherheitsprüfung ist abgelaufen. Bitte lade die Seite neu.");
    }
    return { identity: session.identity, csrfToken };
  }

  public async bootstrap(session: AuthenticatedSession, rotateCsrf = false): Promise<AccountBootstrapResponse> {
    let csrfToken = session.csrfToken;
    if (rotateCsrf || !csrfToken) {
      csrfToken = randomOpaqueToken();
      await this.store.rotateCsrf(session.identity.userId, session.identity.sessionId, sha256(csrfToken));
    }
    return this.bootstrapFromIdentity(session.identity, csrfToken);
  }

  public async listSessions(session: AuthenticatedSession): Promise<Array<Record<string, string | boolean>>> {
    const sessions = await this.store.listSessions(session.identity.userId);
    return sessions.map((entry) => ({
      sessionId: entry.sessionId,
      deviceName: entry.deviceName,
      createdAt: date(entry.createdAt),
      lastSeenAt: date(entry.lastSeenAt),
      idleExpiresAt: date(entry.idleExpiresAt),
      absoluteExpiresAt: date(entry.absoluteExpiresAt),
      current: entry.sessionId === session.identity.sessionId,
    }));
  }

  public async logout(session: AuthenticatedSession): Promise<void> {
    await this.store.revokeSession(session.identity.userId, session.identity.sessionId, "logout");
  }

  public async revokeSession(session: AuthenticatedSession, sessionId: string): Promise<void> {
    if (!UUID_PATTERN.test(sessionId) || sessionId === session.identity.sessionId) return;
    await this.store.revokeSession(session.identity.userId, sessionId, "manual");
  }

  public async logoutOthers(session: AuthenticatedSession): Promise<void> {
    await this.store.revokeOtherSessions(session.identity.userId, session.identity.sessionId);
  }

  public async reauthenticate(session: AuthenticatedSession, payload: unknown): Promise<LoginResult> {
    const password = stringField(assertObject(payload), "password");
    const credential = await this.store.findCredentialByUserId(session.identity.userId);
    if (!credential || !await verifyPassword(password, credential.passwordHash)) {
      throw new AuthError(401, "UNAUTHENTICATED", "AUTH_INVALID_CREDENTIALS", "Das Passwort ist falsch.");
    }
    const sessionToken = randomOpaqueToken();
    const csrfToken = randomOpaqueToken();
    const now = this.now();
    const rotated = await this.store.rotateSession(session.identity.userId, session.identity.sessionId, sha256(sessionToken), sha256(csrfToken), now);
    if (!rotated) throw new AuthError(401, "UNAUTHENTICATED", "SESSION_EXPIRED", "Bitte melde dich erneut an.");
    return {
      sessionToken,
      csrfToken,
      cookieMaxAgeSeconds: Math.max(1, Math.floor((rotated.absoluteExpiresAt.getTime() - now.getTime()) / 1_000)),
      bootstrap: await this.bootstrapFromIdentity(rotated, csrfToken),
    };
  }

  public async createExport(session: AuthenticatedSession): Promise<{ exportId: string; status: string; requestedAt: string }> {
    await this.requireFreshSession(session);
    const job = await this.store.createExportJob(session.identity.userId);
    return { exportId: job.exportId, status: job.status, requestedAt: job.requestedAt.toISOString() };
  }

  public async requestDeletion(session: AuthenticatedSession, payload: unknown): Promise<Date> {
    const body = assertObject(payload);
    if (stringField(body, "confirmation") !== "DELETE") throw new AuthError(400, "VALIDATION", undefined, "Die Löschbestätigung fehlt.");
    const password = stringField(body, "password");
    const credential = await this.store.findCredentialByUserId(session.identity.userId);
    if (!credential || !await verifyPassword(password, credential.passwordHash)) {
      throw new AuthError(401, "UNAUTHENTICATED", "AUTH_INVALID_CREDENTIALS", "Das Passwort ist falsch.");
    }
    const requestedAt = this.now();
    const deleteAfter = new Date(requestedAt.getTime() + DELETION_DELAY_MS);
    await this.store.requestDeletion(session.identity.userId, requestedAt, deleteAfter);
    return deleteAfter;
  }

  public async cancelDeletion(session: AuthenticatedSession): Promise<void> {
    if (!await this.store.cancelDeletion(session.identity.userId)) {
      throw new AuthError(409, "CONFLICT", "AUTH_ACCOUNT_UNAVAILABLE", "Für diesen Account ist keine Löschung vorgemerkt.");
    }
  }

  public async accountCommand(session: AuthenticatedSession, payload: unknown): Promise<{ revision: number; bootstrap: AccountBootstrapResponse }> {
    const body = assertObject(payload) as unknown as AccountCommandEnvelope;
    if (!UUID_PATTERN.test(body.commandId ?? "") || !UUID_PATTERN.test(body.clientInstanceId ?? "") || !Number.isSafeInteger(body.expectedRevision) || !body.command || typeof body.command !== "object") {
      throw new AuthError(400, "VALIDATION", undefined, "Das Accountkommando ist ungültig.");
    }
    const current = await this.store.getBootstrap(session.identity.userId, session.identity.sessionId);
    if (!current) throw new AuthError(401, "UNAUTHENTICATED", "SESSION_EXPIRED", "Bitte melde dich erneut an.");
    try {
      let result: { revision: number; replayed: boolean };
      if (body.command.type === "starter.choose") {
        if (!this.availableStarterDefinitionIds.includes(body.command.definitionId)) throw new AuthError(400, "VALIDATION", "STARTER_INVALID", "Dieser Starter ist nicht verfügbar.");
        result = await this.store.chooseStarter({
          userId: current.userId,
          playerId: current.playerId,
          commandId: body.commandId,
          clientInstanceId: body.clientInstanceId,
          expectedRevision: body.expectedRevision,
          definitionId: body.command.definitionId,
        });
      } else if (body.command.type === "profile.avatar") {
        const kind = "avatar" as const;
        const definitionId = body.command.avatarId;
        if (!AVATARS.some((entry) => entry.id === definitionId)) throw new AuthError(400, "VALIDATION", undefined, "Diese Kosmetik existiert nicht.");
        result = await this.store.updateCosmetic({
          userId: current.userId,
          playerId: current.playerId,
          commandId: body.commandId,
          clientInstanceId: body.clientInstanceId,
          expectedRevision: body.expectedRevision,
          kind,
          definitionId,
        });
      } else if (body.command.type === "profile.frame") {
        const kind = "frame" as const;
        const definitionId = body.command.frameId;
        const definitions = FRAMES;
        if (!definitions.some((entry) => entry.id === definitionId)) throw new AuthError(400, "VALIDATION", undefined, "Diese Kosmetik existiert nicht.");
        result = await this.store.updateCosmetic({
          userId: current.userId,
          playerId: current.playerId,
          commandId: body.commandId,
          clientInstanceId: body.clientInstanceId,
          expectedRevision: body.expectedRevision,
          kind,
          definitionId,
        });
      } else {
        throw new AuthError(400, "VALIDATION", undefined, "Dieses Accountkommando ist noch nicht aktiv.");
      }
      return { revision: result.revision, bootstrap: await this.bootstrap(session) };
    } catch (error) {
      if (error instanceof DatabaseCommandError) {
        if (error.code === "CONFLICT") throw new AuthError(409, "CONFLICT", "REVISION_MISMATCH", "Das Profil wurde bereits geändert.", { latestRevision: error.latestRevision });
        if (error.code === "VALIDATION") throw new AuthError(409, "VALIDATION", "IDEMPOTENCY_MISMATCH", "Diese Kommando-ID wurde bereits anders verwendet.");
      }
      if (error instanceof Error && error.message === "STARTER_ALREADY_CHOSEN") {
        throw new AuthError(409, "CONFLICT", "STARTER_ALREADY_CHOSEN", "Der Starter wurde bereits gewählt.");
      }
      if (error instanceof Error && error.message === "COSMETIC_NOT_ENTITLED") {
        throw new AuthError(403, "FORBIDDEN", undefined, "Diese Kosmetik ist für deinen Account noch nicht freigeschaltet.");
      }
      throw error;
    }
  }

  private async bootstrapFromIdentity(identity: SessionIdentity, csrfToken: string): Promise<AccountBootstrapResponse> {
    const record = await this.store.getBootstrap(identity.userId, identity.sessionId);
    if (!record) throw new AuthError(401, "UNAUTHENTICATED", "SESSION_EXPIRED", "Bitte melde dich erneut an.");
    if (!Number.isSafeInteger(record.revision)) throw new AuthError(500, "UNKNOWN", undefined, "Die Profilrevision liegt außerhalb des sicheren Bereichs.");
    return {
      authContractVersion: AUTH_CONTRACT_VERSION,
      serverTime: this.now().toISOString(),
      session: {
        sessionId: record.sessionId,
        deviceName: record.deviceName,
        createdAt: date(record.sessionCreatedAt),
        lastSeenAt: date(record.lastSeenAt),
        idleExpiresAt: date(record.idleExpiresAt),
        absoluteExpiresAt: date(record.absoluteExpiresAt),
        reauthenticatedAt: date(record.reauthenticatedAt),
      },
      account: {
        userId: record.userId,
        status: record.accountStatus,
        emailMasked: maskEmail(record.emailNormalized),
        emailVerified: true,
        roles: record.roles as AccountRole[],
        createdAt: date(record.accountCreatedAt),
      },
      profile: {
        playerId: record.playerId,
        displayName: record.displayName,
        avatarId: record.avatarId,
        frameId: record.frameId,
        revision: record.revision,
      },
      onboarding: {
        starterDefinitionId: record.starterDefinitionId,
        availableStarterDefinitionIds: this.availableStarterDefinitionIds,
        requiredAction: record.starterDefinitionId ? null : "starter_choice",
      },
      authority: {
        mode: "solo-online",
        server: ["account", "profile", "starter", "run", "economy", "collection", "incubation", "expeditions", "research", "prestige"],
        local: [],
        localStorageNamespace: record.localStorageNamespace,
      },
      features: this.config.features,
      csrfToken,
    };
  }

  private async requireFreshSession(session: AuthenticatedSession): Promise<void> {
    const record = await this.store.getBootstrap(session.identity.userId, session.identity.sessionId);
    if (!record) throw new AuthError(401, "UNAUTHENTICATED", "SESSION_EXPIRED", "Bitte melde dich erneut an.");
    if (this.now().getTime() - record.reauthenticatedAt.getTime() > REAUTH_WINDOW_MS) {
      throw new AuthError(403, "FORBIDDEN", "REAUTHENTICATION_REQUIRED", "Bitte bestätige zuerst erneut dein Passwort.");
    }
  }
}
