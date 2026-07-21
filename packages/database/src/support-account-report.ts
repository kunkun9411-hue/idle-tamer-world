import type { Pool, PoolClient, QueryResultRow } from "pg";

export type SupportAccountLocator =
  | { email: string; userId?: never }
  | { email?: never; userId: string };

export interface SupportAccountReport {
  supportReportVersion: 1;
  generatedAt: string;
  account: {
    userId: string;
    status: string;
    emailMasked: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    deletionRequestedAt: string | null;
    deleteAfter: string | null;
    deletedAt: string | null;
    roles: string[];
  };
  profile: {
    playerId: string;
    displayName: string;
    avatarId: string;
    frameId: string;
    revision: number;
    starterDefinitionId: string | null;
    contentReleaseId: string;
    balanceReleaseId: string;
    createdAt: string;
  };
  sessions: {
    activeCount: number;
    revokedCount: number;
    latestSeenAt: string | null;
    active: Array<{
      deviceName: string;
      rememberMe: boolean;
      createdAt: string;
      lastSeenAt: string;
      idleExpiresAt: string;
      absoluteExpiresAt: string;
    }>;
  };
  openTokens: {
    verification: number;
    passwordReset: number;
    deletionCancellation: number;
  };
  openExportJobs: number;
}

interface AccountRow extends QueryResultRow {
  user_id: string;
  account_status: string;
  email_normalized: string | null;
  email_verified_at: Date | null;
  account_created_at: Date;
  account_updated_at: Date;
  deletion_requested_at: Date | null;
  delete_after: Date | null;
  deleted_at: Date | null;
  player_id: string;
  display_name: string;
  avatar_id: string;
  frame_id: string;
  revision: string;
  starter_definition_id: string | null;
  content_release_id: string;
  balance_release_id: string;
  profile_created_at: Date;
}

interface RoleRow extends QueryResultRow { role: string }
interface SessionCountRow extends QueryResultRow {
  active_count: number;
  revoked_count: number;
  latest_seen_at: Date | null;
}
interface ActiveSessionRow extends QueryResultRow {
  device_name: string;
  remember_me: boolean;
  created_at: Date;
  last_seen_at: Date;
  idle_expires_at: Date;
  absolute_expires_at: Date;
}
interface TokenCountRow extends QueryResultRow {
  verification: number;
  password_reset: number;
  deletion_cancellation: number;
}
interface ExportCountRow extends QueryResultRow { open_count: number }

const asIso = (value: Date | null): string | null => value ? new Date(value).toISOString() : null;

const safeRevision = (value: string): number => {
  const revision = Number(value);
  if (!Number.isSafeInteger(revision)) throw new Error("Support report revision exceeds the safe-integer contract.");
  return revision;
};

export const maskSupportEmail = (email: string | null): string | null => {
  if (!email) return null;
  const separator = email.lastIndexOf("@");
  if (separator <= 0) return "***";
  const local = email.slice(0, separator);
  const domain = email.slice(separator + 1);
  return `${local.slice(0, Math.min(2, local.length))}***@${domain}`;
};

const queryAccount = async (client: PoolClient, locator: SupportAccountLocator): Promise<AccountRow | null> => {
  const byEmail = locator.email !== undefined;
  const value = byEmail ? locator.email.trim().normalize("NFC").toLowerCase() : locator.userId.trim();
  if (!value) throw new Error("Support lookup requires one exact email or user ID.");
  const result = await client.query<AccountRow>(
    `SELECT u.id::text AS user_id, u.status AS account_status, u.email_normalized,
            u.email_verified_at, u.created_at AS account_created_at, u.updated_at AS account_updated_at,
            u.deletion_requested_at, u.delete_after, u.deleted_at,
            p.id::text AS player_id, p.display_name, p.avatar_id, p.frame_id, p.revision,
            p.starter_definition_id, p.content_release_id, p.balance_release_id,
            p.created_at AS profile_created_at
       FROM users u
       JOIN player_profiles p ON p.user_id = u.id
      WHERE ${byEmail ? "u.email_normalized = $1" : "u.id = $1::uuid"}
      LIMIT 1`,
    [value],
  );
  return result.rows[0] ?? null;
};

export const getSupportAccountReport = async (
  pool: Pick<Pool, "connect">,
  locator: SupportAccountLocator,
  generatedAt = new Date(),
): Promise<SupportAccountReport | null> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '5s'");
    const account = await queryAccount(client, locator);
    if (!account) {
      await client.query("COMMIT");
      return null;
    }

    const roles = await client.query<RoleRow>("SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role", [account.user_id]);
    const sessionCounts = await client.query<SessionCountRow>(
        `SELECT count(*) FILTER (WHERE revoked_at IS NULL)::int AS active_count,
                count(*) FILTER (WHERE revoked_at IS NOT NULL)::int AS revoked_count,
                max(last_seen_at) AS latest_seen_at
           FROM user_sessions
          WHERE user_id = $1`,
        [account.user_id],
      );
    const activeSessions = await client.query<ActiveSessionRow>(
        `SELECT device_name, remember_me, created_at, last_seen_at, idle_expires_at, absolute_expires_at
           FROM user_sessions
          WHERE user_id = $1 AND revoked_at IS NULL
          ORDER BY last_seen_at DESC
          LIMIT 10`,
        [account.user_id],
      );
    const tokenCounts = await client.query<TokenCountRow>(
        `SELECT count(*) FILTER (WHERE kind = 'verify_email' AND consumed_at IS NULL AND superseded_at IS NULL AND expires_at > clock_timestamp())::int AS verification,
                count(*) FILTER (WHERE kind = 'reset_password' AND consumed_at IS NULL AND superseded_at IS NULL AND expires_at > clock_timestamp())::int AS password_reset,
                count(*) FILTER (WHERE kind = 'cancel_deletion' AND consumed_at IS NULL AND superseded_at IS NULL AND expires_at > clock_timestamp())::int AS deletion_cancellation
           FROM account_tokens
          WHERE user_id = $1`,
        [account.user_id],
      );
    const exportCounts = await client.query<ExportCountRow>(
        "SELECT count(*)::int AS open_count FROM account_export_jobs WHERE user_id = $1 AND status IN ('pending', 'ready')",
        [account.user_id],
      );
    await client.query("COMMIT");

    const sessionCount = sessionCounts.rows[0] ?? { active_count: 0, revoked_count: 0, latest_seen_at: null };
    const tokenCount = tokenCounts.rows[0] ?? { verification: 0, password_reset: 0, deletion_cancellation: 0 };
    return {
      supportReportVersion: 1,
      generatedAt: generatedAt.toISOString(),
      account: {
        userId: account.user_id,
        status: account.account_status,
        emailMasked: maskSupportEmail(account.email_normalized),
        emailVerified: Boolean(account.email_verified_at),
        createdAt: asIso(account.account_created_at) as string,
        updatedAt: asIso(account.account_updated_at) as string,
        deletionRequestedAt: asIso(account.deletion_requested_at),
        deleteAfter: asIso(account.delete_after),
        deletedAt: asIso(account.deleted_at),
        roles: roles.rows.map((row) => row.role),
      },
      profile: {
        playerId: account.player_id,
        displayName: account.display_name,
        avatarId: account.avatar_id,
        frameId: account.frame_id,
        revision: safeRevision(account.revision),
        starterDefinitionId: account.starter_definition_id,
        contentReleaseId: account.content_release_id,
        balanceReleaseId: account.balance_release_id,
        createdAt: asIso(account.profile_created_at) as string,
      },
      sessions: {
        activeCount: sessionCount.active_count,
        revokedCount: sessionCount.revoked_count,
        latestSeenAt: asIso(sessionCount.latest_seen_at),
        active: activeSessions.rows.map((session) => ({
          deviceName: session.device_name,
          rememberMe: session.remember_me,
          createdAt: asIso(session.created_at) as string,
          lastSeenAt: asIso(session.last_seen_at) as string,
          idleExpiresAt: asIso(session.idle_expires_at) as string,
          absoluteExpiresAt: asIso(session.absolute_expires_at) as string,
        })),
      },
      openTokens: {
        verification: tokenCount.verification,
        passwordReset: tokenCount.password_reset,
        deletionCancellation: tokenCount.deletion_cancellation,
      },
      openExportJobs: exportCounts.rows[0]?.open_count ?? 0,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
};
