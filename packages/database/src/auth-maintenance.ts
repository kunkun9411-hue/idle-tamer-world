import type { Pool, QueryResultRow } from "pg";

import { withTransaction } from "./transaction";

interface DueAccountRow extends QueryResultRow {
  user_id: string;
  player_id: string;
}

export interface AuthMaintenanceResult {
  anonymizedAccounts: number;
  deletedRateLimits: number;
  deletedTokens: number;
  deletedSessions: number;
  deletedSecurityEvents: number;
}

export const runAuthMaintenance = async (pool: Pool, now = new Date()): Promise<AuthMaintenanceResult> =>
  withTransaction(pool, async (client) => {
    const due = await client.query<DueAccountRow>(
      `SELECT u.id AS user_id, p.id AS player_id
         FROM users u JOIN player_profiles p ON p.user_id = u.id
        WHERE u.status = 'deletion_pending' AND u.delete_after <= $1
        ORDER BY u.delete_after
        LIMIT 25
        FOR UPDATE OF u, p SKIP LOCKED`,
      [now],
    );

    for (const account of due.rows) {
      await client.query("DELETE FROM player_name_reservations WHERE player_id = $1", [account.player_id]);
      await client.query("DELETE FROM player_name_history WHERE player_id = $1", [account.player_id]);
      await client.query("DELETE FROM cosmetic_entitlements WHERE player_id = $1", [account.player_id]);
      await client.query("DELETE FROM wallet_balances WHERE player_id = $1", [account.player_id]);
      await client.query("DELETE FROM item_balances WHERE player_id = $1", [account.player_id]);
      await client.query("DELETE FROM user_credentials WHERE user_id = $1", [account.user_id]);
      await client.query("DELETE FROM user_sessions WHERE user_id = $1", [account.user_id]);
      await client.query("DELETE FROM account_tokens WHERE user_id = $1", [account.user_id]);
      await client.query("DELETE FROM policy_acceptances WHERE user_id = $1", [account.user_id]);
      await client.query("DELETE FROM user_roles WHERE user_id = $1", [account.user_id]);
      await client.query("DELETE FROM account_export_jobs WHERE user_id = $1", [account.user_id]);
      const suffix = account.user_id.replace(/-/gu, "").slice(-12);
      await client.query(
        `UPDATE player_profiles
            SET display_name = $2,
                display_name_normalized = $3,
                avatar_id = 'wanderer', frame_id = 'silver',
                starter_definition_id = NULL, starter_chosen_at = NULL,
                local_storage_namespace = uuidv7(), updated_at = $4
          WHERE id = $1`,
        [account.player_id, `Gelöschter Tamer ${suffix}`, `deleted-tamer-${suffix}`, now],
      );
      await client.query(
        `UPDATE users
            SET email_original = NULL, email_normalized = NULL, status = 'deleted',
                deletion_requested_at = NULL, delete_after = NULL, deleted_at = $2, updated_at = $2
          WHERE id = $1`,
        [account.user_id, now],
      );
      await client.query(
        `INSERT INTO security_events (user_id, event_type, outcome, metadata, created_at)
         VALUES ($1, 'account.anonymized', 'success', '{}'::jsonb, $2)`,
        [account.user_id, now],
      );
    }

    const rateLimits = await client.query("DELETE FROM auth_rate_limits WHERE updated_at < $1::timestamptz - interval '48 hours'", [now]);
    const tokens = await client.query(
      `DELETE FROM account_tokens
        WHERE (consumed_at IS NOT NULL OR superseded_at IS NOT NULL OR expires_at < $1::timestamptz)
          AND created_at < $1::timestamptz - interval '7 days'`,
      [now],
    );
    const sessions = await client.query(
      `DELETE FROM user_sessions WHERE revoked_at IS NOT NULL AND revoked_at < $1::timestamptz - interval '90 days'`,
      [now],
    );
    const securityEvents = await client.query(
      `DELETE FROM security_events WHERE created_at < $1::timestamptz - interval '30 days'`,
      [now],
    );
    return {
      anonymizedAccounts: due.rowCount ?? 0,
      deletedRateLimits: rateLimits.rowCount ?? 0,
      deletedTokens: tokens.rowCount ?? 0,
      deletedSessions: sessions.rowCount ?? 0,
      deletedSecurityEvents: securityEvents.rowCount ?? 0,
    };
  });
