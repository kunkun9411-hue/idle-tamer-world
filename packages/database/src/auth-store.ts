import type { Pool, PoolClient, QueryResultRow } from "pg";

import { executePlayerCommand, hashCommand, withTransaction } from "./transaction";

export type StoredAccountStatus = "pending_verification" | "active" | "locked" | "deletion_pending" | "deleted";

export interface CreatePendingAccountInput {
  emailOriginal: string;
  emailNormalized: string;
  displayName: string;
  displayNameNormalized: string;
  passwordHash: string;
  termsVersion: string;
  privacyVersion: string;
  verificationTokenHash: Buffer;
  verificationExpiresAt: Date;
  contentReleaseId: string;
  balanceReleaseId: string;
}

export type CreatePendingAccountResult =
  | { status: "created"; userId: string }
  | { status: "email_exists" | "display_name_taken" };

export interface CredentialRecord {
  userId: string;
  passwordHash: string;
  status: StoredAccountStatus;
  emailVerified: boolean;
}

export interface CreateSessionInput {
  userId: string;
  tokenHash: Buffer;
  csrfHash: Buffer;
  clientInstanceId: string;
  deviceName: string;
  userAgentSummary: string;
  rememberMe: boolean;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface SessionIdentity {
  sessionId: string;
  userId: string;
  csrfHash: Buffer;
  rememberMe: boolean;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface BootstrapRecord {
  sessionId: string;
  userId: string;
  accountStatus: "active" | "deletion_pending";
  emailNormalized: string;
  emailVerifiedAt: Date;
  accountCreatedAt: Date;
  roles: string[];
  deviceName: string;
  sessionCreatedAt: Date;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  reauthenticatedAt: Date;
  playerId: string;
  displayName: string;
  avatarId: string;
  frameId: string;
  revision: number;
  starterDefinitionId: string | null;
  localStorageNamespace: string;
}

export interface StoredSessionSummary {
  sessionId: string;
  deviceName: string;
  createdAt: Date;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface StarterCommandInput {
  userId: string;
  playerId: string;
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  definitionId: string;
}

export interface CosmeticCommandInput {
  userId: string;
  playerId: string;
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  kind: "avatar" | "frame";
  definitionId: string;
}

export interface ConsumeRateLimitInput {
  action: string;
  keyHash: Buffer;
  windowStarted: Date;
  limit: number;
  blockedUntil: Date;
}

export interface AuthStore {
  createPendingAccount(input: CreatePendingAccountInput): Promise<CreatePendingAccountResult>;
  verifyEmailToken(tokenHash: Buffer, now: Date): Promise<boolean>;
  issueAccountToken(emailNormalized: string, kind: "verify_email" | "reset_password", tokenHash: Buffer, expiresAt: Date): Promise<{ email: string; displayName: string } | null>;
  findCredential(emailNormalized: string): Promise<CredentialRecord | null>;
  findCredentialByUserId(userId: string): Promise<CredentialRecord | null>;
  resetPassword(tokenHash: Buffer, passwordHash: string, now: Date): Promise<boolean>;
  createSession(input: CreateSessionInput): Promise<string>;
  authenticateSession(tokenHash: Buffer, now: Date, normalIdleMs: number, rememberIdleMs: number): Promise<SessionIdentity | null>;
  rotateCsrf(userId: string, sessionId: string, csrfHash: Buffer): Promise<void>;
  rotateSession(userId: string, sessionId: string, tokenHash: Buffer, csrfHash: Buffer, now: Date): Promise<SessionIdentity | null>;
  getBootstrap(userId: string, sessionId: string): Promise<BootstrapRecord | null>;
  listSessions(userId: string): Promise<StoredSessionSummary[]>;
  revokeSession(userId: string, sessionId: string, reason: "manual" | "logout"): Promise<void>;
  revokeOtherSessions(userId: string, currentSessionId: string): Promise<void>;
  createExportJob(userId: string): Promise<{ exportId: string; status: "pending" | "ready" | "failed" | "expired"; requestedAt: Date }>;
  requestDeletion(userId: string, requestedAt: Date, deleteAfter: Date): Promise<void>;
  cancelDeletion(userId: string): Promise<boolean>;
  chooseStarter(input: StarterCommandInput): Promise<{ revision: number; replayed: boolean }>;
  updateCosmetic(input: CosmeticCommandInput): Promise<{ revision: number; replayed: boolean }>;
  consumeRateLimit(input: ConsumeRateLimitInput): Promise<{ allowed: boolean; attemptCount: number; blockedUntil: Date | null }>;
}

interface ConstraintError {
  code?: string;
  constraint?: string;
}

interface IdRow extends QueryResultRow { id: string }
interface CredentialRow extends QueryResultRow {
  user_id: string;
  password_hash: string;
  status: StoredAccountStatus;
  email_verified_at: Date | null;
}
interface SessionIdentityRow extends QueryResultRow {
  id: string;
  user_id: string;
  csrf_hash: Buffer;
  remember_me: boolean;
  idle_expires_at: Date;
  absolute_expires_at: Date;
  status: StoredAccountStatus;
}
interface BootstrapRow extends QueryResultRow {
  session_id: string;
  user_id: string;
  account_status: "active" | "deletion_pending";
  email_normalized: string;
  email_verified_at: Date;
  account_created_at: Date;
  roles: string[];
  device_name: string;
  session_created_at: Date;
  last_seen_at: Date;
  idle_expires_at: Date;
  absolute_expires_at: Date;
  reauthenticated_at: Date;
  player_id: string;
  display_name: string;
  avatar_id: string;
  frame_id: string;
  revision: string;
  starter_definition_id: string | null;
  local_storage_namespace: string;
}
interface SessionSummaryRow extends QueryResultRow {
  id: string;
  device_name: string;
  created_at: Date;
  last_seen_at: Date;
  idle_expires_at: Date;
  absolute_expires_at: Date;
}

const insertProfileDefaults = async (client: PoolClient, playerId: string): Promise<void> => {
  await client.query(
    `INSERT INTO cosmetic_entitlements (player_id, cosmetic_kind, definition_id, source)
     VALUES
       ($1, 'avatar', 'wanderer', 'registration'),
       ($1, 'avatar', 'keeper', 'registration'),
       ($1, 'frame', 'silver', 'registration'),
       ($1, 'frame', 'violet', 'registration')`,
    [playerId],
  );
};

export class PostgresAuthStore implements AuthStore {
  public constructor(private readonly pool: Pool) {}

  public async createPendingAccount(input: CreatePendingAccountInput): Promise<CreatePendingAccountResult> {
    try {
      return await withTransaction(this.pool, async (client) => {
        const user = await client.query<IdRow>(
          `INSERT INTO users (email_original, email_normalized, status)
           VALUES ($1, $2, 'pending_verification')
           RETURNING id`,
          [input.emailOriginal, input.emailNormalized],
        );
        const userId = user.rows[0].id;
        await client.query(
          `INSERT INTO user_credentials (user_id, password_hash)
           VALUES ($1, $2)`,
          [userId, input.passwordHash],
        );
        const profile = await client.query<IdRow>(
          `INSERT INTO player_profiles
             (user_id, display_name, display_name_normalized, content_release_id, balance_release_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [userId, input.displayName, input.displayNameNormalized, input.contentReleaseId, input.balanceReleaseId],
        );
        const playerId = profile.rows[0].id;
        await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'player')", [userId]);
        await client.query(
          `INSERT INTO policy_acceptances (user_id, policy_kind, version, source)
           VALUES ($1, 'terms', $2, 'registration'), ($1, 'privacy', $3, 'registration')`,
          [userId, input.termsVersion, input.privacyVersion],
        );
        await client.query(
          `INSERT INTO player_name_history
             (player_id, display_name, display_name_normalized, valid_from, reserved_until)
           VALUES ($1, $2, $3, clock_timestamp(), 'infinity'::timestamptz)`,
          [playerId, input.displayName, input.displayNameNormalized],
        );
        await client.query(
          `INSERT INTO player_name_reservations (display_name_normalized, player_id, reserved_until)
           VALUES ($1, $2, 'infinity'::timestamptz)`,
          [input.displayNameNormalized, playerId],
        );
        await insertProfileDefaults(client, playerId);
        await client.query(
          `INSERT INTO account_tokens (user_id, kind, token_hash, expires_at)
           VALUES ($1, 'verify_email', $2, $3)`,
          [userId, input.verificationTokenHash, input.verificationExpiresAt],
        );
        return { status: "created", userId } as const;
      });
    } catch (error) {
      const databaseError = error as ConstraintError;
      if (databaseError.code !== "23505") throw error;
      if (databaseError.constraint === "users_email_normalized_key") return { status: "email_exists" };
      if (databaseError.constraint === "player_profiles_display_name_normalized_key" || databaseError.constraint === "player_name_reservations_pkey") {
        return { status: "display_name_taken" };
      }
      throw error;
    }
  }

  public async verifyEmailToken(tokenHash: Buffer, now: Date): Promise<boolean> {
    return withTransaction(this.pool, async (client) => {
      const token = await client.query<{ id: string; user_id: string } & QueryResultRow>(
        `SELECT id, user_id
           FROM account_tokens
          WHERE kind = 'verify_email' AND token_hash = $1
            AND consumed_at IS NULL AND superseded_at IS NULL AND expires_at > $2
          FOR UPDATE`,
        [tokenHash, now],
      );
      if (token.rowCount !== 1) return false;
      await client.query("UPDATE account_tokens SET consumed_at = $2 WHERE id = $1", [token.rows[0].id, now]);
      const activated = await client.query(
        `UPDATE users
            SET status = 'active', email_verified_at = $2, updated_at = $2
          WHERE id = $1 AND status = 'pending_verification'`,
        [token.rows[0].user_id, now],
      );
      return activated.rowCount === 1;
    });
  }

  public async issueAccountToken(emailNormalized: string, kind: "verify_email" | "reset_password", tokenHash: Buffer, expiresAt: Date): Promise<{ email: string; displayName: string } | null> {
    return withTransaction(this.pool, async (client) => {
      const account = await client.query<{ user_id: string; email_normalized: string; display_name: string } & QueryResultRow>(
        `SELECT u.id AS user_id, u.email_normalized, p.display_name
           FROM users u JOIN player_profiles p ON p.user_id = u.id
          WHERE u.email_normalized = $1
            AND (($2 = 'verify_email' AND u.status = 'pending_verification')
              OR ($2 = 'reset_password' AND u.status IN ('active', 'deletion_pending')))
          FOR UPDATE OF u`,
        [emailNormalized, kind],
      );
      const row = account.rows[0];
      if (!row) return null;
      await client.query(
        `UPDATE account_tokens SET superseded_at = clock_timestamp()
          WHERE user_id = $1 AND kind = $2 AND consumed_at IS NULL AND superseded_at IS NULL`,
        [row.user_id, kind],
      );
      await client.query(
        `INSERT INTO account_tokens (user_id, kind, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [row.user_id, kind, tokenHash, expiresAt],
      );
      return { email: row.email_normalized, displayName: row.display_name };
    });
  }

  public async findCredential(emailNormalized: string): Promise<CredentialRecord | null> {
    const result = await this.pool.query<CredentialRow>(
      `SELECT c.user_id, c.password_hash, u.status, u.email_verified_at
         FROM user_credentials c
         JOIN users u ON u.id = c.user_id
        WHERE u.email_normalized = $1`,
      [emailNormalized],
    );
    const row = result.rows[0];
    return row ? { userId: row.user_id, passwordHash: row.password_hash, status: row.status, emailVerified: row.email_verified_at !== null } : null;
  }

  public async findCredentialByUserId(userId: string): Promise<CredentialRecord | null> {
    const result = await this.pool.query<CredentialRow>(
      `SELECT c.user_id, c.password_hash, u.status, u.email_verified_at
         FROM user_credentials c JOIN users u ON u.id = c.user_id
        WHERE u.id = $1`,
      [userId],
    );
    const row = result.rows[0];
    return row ? { userId: row.user_id, passwordHash: row.password_hash, status: row.status, emailVerified: row.email_verified_at !== null } : null;
  }

  public async resetPassword(tokenHash: Buffer, passwordHash: string, now: Date): Promise<boolean> {
    return withTransaction(this.pool, async (client) => {
      const token = await client.query<{ id: string; user_id: string } & QueryResultRow>(
        `SELECT id, user_id FROM account_tokens
          WHERE kind = 'reset_password' AND token_hash = $1
            AND consumed_at IS NULL AND superseded_at IS NULL AND expires_at > $2
          FOR UPDATE`,
        [tokenHash, now],
      );
      if (token.rowCount !== 1) return false;
      await client.query("UPDATE account_tokens SET consumed_at = $2 WHERE id = $1", [token.rows[0].id, now]);
      await client.query(
        `UPDATE user_credentials
            SET password_hash = $2, hash_version = 1, password_changed_at = $3, updated_at = $3
          WHERE user_id = $1`,
        [token.rows[0].user_id, passwordHash, now],
      );
      await client.query(
        `UPDATE user_sessions SET revoked_at = $2, revoke_reason = 'password_reset'
          WHERE user_id = $1 AND revoked_at IS NULL`,
        [token.rows[0].user_id, now],
      );
      return true;
    });
  }

  public async createSession(input: CreateSessionInput): Promise<string> {
    return withTransaction(this.pool, async (client) => {
      const inserted = await client.query<IdRow>(
        `INSERT INTO user_sessions
           (user_id, token_hash, csrf_hash, client_instance_id, device_name, user_agent_summary,
            remember_me, idle_expires_at, absolute_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [input.userId, input.tokenHash, input.csrfHash, input.clientInstanceId, input.deviceName, input.userAgentSummary, input.rememberMe, input.idleExpiresAt, input.absoluteExpiresAt],
      );
      await client.query(
        `WITH excess AS (
           SELECT id FROM user_sessions
            WHERE user_id = $1 AND revoked_at IS NULL
            ORDER BY last_seen_at DESC, created_at DESC
            OFFSET 10
         )
         UPDATE user_sessions
            SET revoked_at = clock_timestamp(), revoke_reason = 'session_limit'
          WHERE id IN (SELECT id FROM excess)`,
        [input.userId],
      );
      return inserted.rows[0].id;
    });
  }

  public async authenticateSession(tokenHash: Buffer, now: Date, normalIdleMs: number, rememberIdleMs: number): Promise<SessionIdentity | null> {
    return withTransaction(this.pool, async (client) => {
      const result = await client.query<SessionIdentityRow>(
        `SELECT s.id, s.user_id, s.csrf_hash, s.remember_me, s.idle_expires_at, s.absolute_expires_at, u.status
           FROM user_sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = $1 AND s.revoked_at IS NULL
          FOR UPDATE OF s`,
        [tokenHash],
      );
      const row = result.rows[0];
      if (!row) return null;
      if (row.idle_expires_at <= now || row.absolute_expires_at <= now || !["active", "deletion_pending"].includes(row.status)) {
        await client.query(
          `UPDATE user_sessions SET revoked_at = $2, revoke_reason = $3 WHERE id = $1`,
          [row.id, now, row.idle_expires_at <= now || row.absolute_expires_at <= now ? "expired" : "account_status"],
        );
        return null;
      }
      const requestedIdle = new Date(now.getTime() + (row.remember_me ? rememberIdleMs : normalIdleMs));
      const idleExpiresAt = requestedIdle < row.absolute_expires_at ? requestedIdle : row.absolute_expires_at;
      await client.query(
        `UPDATE user_sessions SET last_seen_at = $2, idle_expires_at = $3 WHERE id = $1`,
        [row.id, now, idleExpiresAt],
      );
      return {
        sessionId: row.id,
        userId: row.user_id,
        csrfHash: row.csrf_hash,
        rememberMe: row.remember_me,
        idleExpiresAt,
        absoluteExpiresAt: row.absolute_expires_at,
      };
    });
  }

  public async getBootstrap(userId: string, sessionId: string): Promise<BootstrapRecord | null> {
    const result = await this.pool.query<BootstrapRow>(
      `SELECT
         s.id AS session_id, u.id AS user_id, u.status AS account_status,
         u.email_normalized, u.email_verified_at, u.created_at AS account_created_at,
         ARRAY(SELECT role FROM user_roles WHERE user_id = u.id ORDER BY role) AS roles,
         s.device_name, s.created_at AS session_created_at, s.last_seen_at,
         s.idle_expires_at, s.absolute_expires_at, s.reauthenticated_at,
         p.id AS player_id, p.display_name, p.avatar_id, p.frame_id, p.revision,
         p.starter_definition_id, p.local_storage_namespace
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN player_profiles p ON p.user_id = u.id
       WHERE s.id = $1 AND u.id = $2 AND s.revoked_at IS NULL
         AND u.status IN ('active', 'deletion_pending')`,
      [sessionId, userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      accountStatus: row.account_status,
      emailNormalized: row.email_normalized,
      emailVerifiedAt: row.email_verified_at,
      accountCreatedAt: row.account_created_at,
      roles: row.roles,
      deviceName: row.device_name,
      sessionCreatedAt: row.session_created_at,
      lastSeenAt: row.last_seen_at,
      idleExpiresAt: row.idle_expires_at,
      absoluteExpiresAt: row.absolute_expires_at,
      reauthenticatedAt: row.reauthenticated_at,
      playerId: row.player_id,
      displayName: row.display_name,
      avatarId: row.avatar_id,
      frameId: row.frame_id,
      revision: Number(row.revision),
      starterDefinitionId: row.starter_definition_id,
      localStorageNamespace: row.local_storage_namespace,
    };
  }

  public async rotateCsrf(userId: string, sessionId: string, csrfHash: Buffer): Promise<void> {
    await this.pool.query(
      `UPDATE user_sessions SET csrf_hash = $3
        WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [sessionId, userId, csrfHash],
    );
  }

  public async rotateSession(userId: string, sessionId: string, tokenHash: Buffer, csrfHash: Buffer, now: Date): Promise<SessionIdentity | null> {
    return withTransaction(this.pool, async (client) => {
      const rotated = await client.query<SessionIdentityRow>(
        `INSERT INTO user_sessions
           (user_id, token_hash, csrf_hash, client_instance_id, device_name, user_agent_summary,
            remember_me, idle_expires_at, absolute_expires_at, reauthenticated_at, rotated_from_session_id)
         SELECT user_id, $3, $4, client_instance_id, device_name, user_agent_summary,
                remember_me, idle_expires_at, absolute_expires_at, $5, id
           FROM user_sessions
          WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
            AND idle_expires_at > $5 AND absolute_expires_at > $5
         RETURNING id, user_id, csrf_hash, remember_me, idle_expires_at, absolute_expires_at, 'active'::text AS status`,
        [sessionId, userId, tokenHash, csrfHash, now],
      );
      const row = rotated.rows[0];
      if (!row) return null;
      await client.query(
        `UPDATE user_sessions SET revoked_at = $2, revoke_reason = 'rotated'
          WHERE id = $1`,
        [sessionId, now],
      );
      return {
        sessionId: row.id,
        userId: row.user_id,
        csrfHash: row.csrf_hash,
        rememberMe: row.remember_me,
        idleExpiresAt: row.idle_expires_at,
        absoluteExpiresAt: row.absolute_expires_at,
      };
    });
  }

  public async listSessions(userId: string): Promise<StoredSessionSummary[]> {
    const result = await this.pool.query<SessionSummaryRow>(
      `SELECT id, device_name, created_at, last_seen_at, idle_expires_at, absolute_expires_at
         FROM user_sessions
        WHERE user_id = $1 AND revoked_at IS NULL
        ORDER BY last_seen_at DESC`,
      [userId],
    );
    return result.rows.map((row) => ({
      sessionId: row.id,
      deviceName: row.device_name,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      idleExpiresAt: row.idle_expires_at,
      absoluteExpiresAt: row.absolute_expires_at,
    }));
  }

  public async revokeSession(userId: string, sessionId: string, reason: "manual" | "logout"): Promise<void> {
    await this.pool.query(
      `UPDATE user_sessions
          SET revoked_at = clock_timestamp(), revoke_reason = $3
        WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [sessionId, userId, reason],
    );
  }

  public async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE user_sessions
          SET revoked_at = clock_timestamp(), revoke_reason = 'manual'
        WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL`,
      [userId, currentSessionId],
    );
  }

  public async createExportJob(userId: string): Promise<{ exportId: string; status: "pending" | "ready" | "failed" | "expired"; requestedAt: Date }> {
    const existing = await this.pool.query<{ id: string; status: "pending" | "ready" | "failed" | "expired"; requested_at: Date } & QueryResultRow>(
      `SELECT id, status, requested_at FROM account_export_jobs
        WHERE user_id = $1 AND status IN ('pending', 'ready')
        ORDER BY requested_at DESC LIMIT 1`,
      [userId],
    );
    const current = existing.rows[0];
    if (current) return { exportId: current.id, status: current.status, requestedAt: current.requested_at };
    const created = await this.pool.query<{ id: string; status: "pending"; requested_at: Date } & QueryResultRow>(
      `INSERT INTO account_export_jobs (user_id, status) VALUES ($1, 'pending')
       RETURNING id, status, requested_at`,
      [userId],
    );
    return { exportId: created.rows[0].id, status: created.rows[0].status, requestedAt: created.rows[0].requested_at };
  }

  public async requestDeletion(userId: string, requestedAt: Date, deleteAfter: Date): Promise<void> {
    await withTransaction(this.pool, async (client) => {
      const updated = await client.query(
        `UPDATE users SET status = 'deletion_pending', deletion_requested_at = $2, delete_after = $3, updated_at = $2
          WHERE id = $1 AND status = 'active'`,
        [userId, requestedAt, deleteAfter],
      );
      if (updated.rowCount !== 1) throw new Error("ACCOUNT_STATUS_INVALID");
      await client.query(
        `UPDATE user_sessions SET revoked_at = $2, revoke_reason = 'account_status'
          WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId, requestedAt],
      );
    });
  }

  public async cancelDeletion(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE users
          SET status = 'active', deletion_requested_at = NULL, delete_after = NULL, updated_at = clock_timestamp()
        WHERE id = $1 AND status = 'deletion_pending'`,
      [userId],
    );
    return result.rowCount === 1;
  }

  public async chooseStarter(input: StarterCommandInput): Promise<{ revision: number; replayed: boolean }> {
    const result = await executePlayerCommand(this.pool, {
      playerId: input.playerId,
      commandId: input.commandId,
      clientInstanceId: input.clientInstanceId,
      commandType: "starter.choose",
      expectedRevision: input.expectedRevision,
      requestHash: hashCommand({ type: "starter.choose", definitionId: input.definitionId }),
    }, async (client) => {
      const updated = await client.query(
        `UPDATE player_profiles
            SET starter_definition_id = $2, starter_chosen_at = clock_timestamp()
          WHERE id = $1 AND user_id = $3 AND starter_definition_id IS NULL`,
        [input.playerId, input.definitionId, input.userId],
      );
      if (updated.rowCount !== 1) throw new Error("STARTER_ALREADY_CHOSEN");
      await client.query(
        `INSERT INTO player_runs (player_id, active_monster_definition_id)
         VALUES ($1, $2)
         ON CONFLICT (player_id) DO NOTHING`,
        [input.playerId, input.definitionId],
      );
      await client.query(
        `INSERT INTO player_run_levels (player_id, monster_definition_id)
         VALUES ($1, $2)
         ON CONFLICT (player_id, monster_definition_id) DO NOTHING`,
        [input.playerId, input.definitionId],
      );
      await client.query(
        `INSERT INTO player_zone_progress (player_id, zone_id)
         VALUES ($1, 'violet-rim')
         ON CONFLICT (player_id, zone_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO wallet_balances (player_id, definition_id, amount)
         VALUES ($1, 'gold', 100)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO wallet_balances (player_id, definition_id, amount)
         VALUES ($1, 'ether_core', 0)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO monster_instances (player_id, definition_id)
         VALUES ($1, $2)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId, input.definitionId],
      );
      await client.query(
        `INSERT INTO item_balances (player_id, definition_id, amount)
         VALUES ($1, 'training_data', 2), ($1, 'incubator_charge', 1),
                ($1, 'evolution_core', 0), ($1, 'ether_dust', 0)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO egg_balances (player_id, definition_id, amount)
         VALUES ($1, 'mossbit', 1)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO gem_balances (player_id, definition_id, amount)
         VALUES ($1, 'common-crimson-triangle', 1), ($1, 'common-azure-square', 1), ($1, 'common-violet-diamond', 1)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO research_levels (player_id, definition_id, level)
         VALUES ($1, 'power', 0), ($1, 'vitality', 0), ($1, 'extraction', 0), ($1, 'incubation', 0)
         ON CONFLICT (player_id, definition_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO player_activity_counters (player_id, activity_id, amount)
         SELECT $1, activity_id, 0
           FROM unnest(ARRAY['victory','boss_victory','cache_claim','hatch','monster_discovery','level_up','hyper_up','evolution','gem_equip','prestige','expedition_start','expedition_complete']) AS activity_id
         ON CONFLICT (player_id, activity_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO player_objective_periods (player_id, daily_key, weekly_key)
         VALUES ($1, to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), to_char(clock_timestamp() AT TIME ZONE 'UTC', 'IYYY-"W"IW'))
         ON CONFLICT (player_id) DO NOTHING`,
        [input.playerId],
      );
      await client.query(
        `INSERT INTO player_settings (player_id) VALUES ($1) ON CONFLICT (player_id) DO NOTHING`,
        [input.playerId],
      );
      return { starterDefinitionId: input.definitionId };
    });
    return { revision: result.revision, replayed: result.replayed };
  }

  public async updateCosmetic(input: CosmeticCommandInput): Promise<{ revision: number; replayed: boolean }> {
    const commandType = input.kind === "avatar" ? "profile.avatar" : "profile.frame";
    const result = await executePlayerCommand(this.pool, {
      playerId: input.playerId,
      commandId: input.commandId,
      clientInstanceId: input.clientInstanceId,
      commandType,
      expectedRevision: input.expectedRevision,
      requestHash: hashCommand({ type: commandType, definitionId: input.definitionId }),
    }, async (client) => {
      const entitlement = await client.query(
        `SELECT 1 FROM cosmetic_entitlements
          WHERE player_id = $1 AND cosmetic_kind = $2 AND definition_id = $3`,
        [input.playerId, input.kind, input.definitionId],
      );
      if (entitlement.rowCount !== 1) throw new Error("COSMETIC_NOT_ENTITLED");
      const column = input.kind === "avatar" ? "avatar_id" : "frame_id";
      await client.query(
        `UPDATE player_profiles SET ${column} = $2 WHERE id = $1 AND user_id = $3`,
        [input.playerId, input.definitionId, input.userId],
      );
      return { definitionId: input.definitionId };
    });
    return { revision: result.revision, replayed: result.replayed };
  }

  public async consumeRateLimit(input: ConsumeRateLimitInput): Promise<{ allowed: boolean; attemptCount: number; blockedUntil: Date | null }> {
    const result = await this.pool.query<{ attempt_count: number; blocked_until: Date | null } & QueryResultRow>(
      `INSERT INTO auth_rate_limits
         (action, key_hash, window_started, attempt_count, blocked_until)
       VALUES ($1, $2, $3, 1, NULL)
       ON CONFLICT (action, key_hash, window_started)
       DO UPDATE SET
         attempt_count = auth_rate_limits.attempt_count + 1,
         blocked_until = CASE
           WHEN auth_rate_limits.attempt_count + 1 > $4 THEN $5
           ELSE auth_rate_limits.blocked_until
         END,
         updated_at = clock_timestamp()
       RETURNING attempt_count, blocked_until`,
      [input.action, input.keyHash, input.windowStarted, input.limit, input.blockedUntil],
    );
    const row = result.rows[0];
    return { allowed: row.attempt_count <= input.limit, attemptCount: row.attempt_count, blockedUntil: row.blocked_until };
  }
}
