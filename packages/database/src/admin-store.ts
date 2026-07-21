import type { Pool, QueryResultRow } from "pg";

import { withTransaction } from "./transaction";

export type InternalRole = "support" | "moderator" | "admin";
export type ModerationAction = "warn" | "mute" | "remove_message" | "lock_account" | "dismiss";

export class AdminDatabaseError extends Error {
  public constructor(public readonly code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION", message: string) {
    super(message);
    this.name = "AdminDatabaseError";
  }
}

export interface AdminStore {
  authorize(userId: string, roles: InternalRole[]): Promise<void>;
  contentOverview(): Promise<Record<string, unknown>>;
  previewContent(userId: string, contentReleaseId: string): Promise<Record<string, unknown>>;
  switchContent(userId: string, contentReleaseId: string, action: "activate" | "rollback"): Promise<Record<string, unknown>>;
  moderationQueue(): Promise<Record<string, unknown>>;
  moderate(userId: string, reportId: string, action: ModerationAction, reason: string, now: Date): Promise<Record<string, unknown>>;
  guildLedger(guildId: string): Promise<Record<string, unknown>>;
}

const releaseIdPattern = /^[a-z0-9][a-z0-9.-]{0,79}$/u;

export class PostgresAdminStore implements AdminStore {
  public constructor(private readonly pool: Pool) {}

  public async authorize(userId: string, roles: InternalRole[]): Promise<void> {
    const result = await this.pool.query<{ role: string } & QueryResultRow>("SELECT role FROM user_roles WHERE user_id = $1 AND role = ANY($2::text[]) LIMIT 1", [userId, roles]);
    if (!result.rowCount) throw new AdminDatabaseError("FORBIDDEN", "Diese interne Rolle ist für das Werkzeug erforderlich.");
  }

  public async contentOverview(): Promise<Record<string, unknown>> {
    const releases = await this.pool.query<{ content_release_id: string; balance_release_id: string; is_active: boolean; published_at: Date; metadata: Record<string, unknown> } & QueryResultRow>("SELECT content_release_id, balance_release_id, is_active, published_at, metadata FROM content_releases ORDER BY published_at DESC");
    const audit = await this.pool.query<{ id: string; content_release_id: string; action: string; actor_user_id: string | null; previous_content_release_id: string | null; created_at: Date } & QueryResultRow>("SELECT id, content_release_id, action, actor_user_id, previous_content_release_id, created_at FROM content_release_audit ORDER BY created_at DESC LIMIT 100");
    return {
      releases: releases.rows.map((entry) => ({ contentReleaseId: entry.content_release_id, balanceReleaseId: entry.balance_release_id, active: entry.is_active, publishedAt: entry.published_at.toISOString(), metadata: entry.metadata })),
      audit: audit.rows.map((entry) => ({ auditId: entry.id, contentReleaseId: entry.content_release_id, action: entry.action, actorUserId: entry.actor_user_id, previousContentReleaseId: entry.previous_content_release_id, createdAt: entry.created_at.toISOString() })),
    };
  }

  public async previewContent(userId: string, contentReleaseId: string): Promise<Record<string, unknown>> {
    if (!releaseIdPattern.test(contentReleaseId)) throw new AdminDatabaseError("VALIDATION", "Content-Release-ID ist ungültig.");
    return withTransaction(this.pool, async (client) => {
      const release = await client.query<{ content_release_id: string; balance_release_id: string; is_active: boolean; metadata: Record<string, unknown> } & QueryResultRow>("SELECT content_release_id, balance_release_id, is_active, metadata FROM content_releases WHERE content_release_id = $1", [contentReleaseId]);
      if (!release.rows[0]) throw new AdminDatabaseError("NOT_FOUND", "Dieses unveränderliche Content-Release existiert nicht.");
      await client.query("INSERT INTO content_release_audit (content_release_id, action, actor_user_id, metadata) VALUES ($1, 'preview', $2, $3::jsonb)", [contentReleaseId, userId, JSON.stringify({ source: "admin_api" })]);
      return { preview: release.rows[0], validation: { immutableRelease: true, referencesCheckedAtBuild: true, activationChanged: false } };
    });
  }

  public async switchContent(userId: string, contentReleaseId: string, action: "activate" | "rollback"): Promise<Record<string, unknown>> {
    if (!releaseIdPattern.test(contentReleaseId)) throw new AdminDatabaseError("VALIDATION", "Content-Release-ID ist ungültig.");
    return withTransaction(this.pool, async (client) => {
      const target = await client.query("SELECT 1 FROM content_releases WHERE content_release_id = $1 FOR UPDATE", [contentReleaseId]);
      if (!target.rowCount) throw new AdminDatabaseError("NOT_FOUND", "Dieses unveränderliche Content-Release existiert nicht.");
      const active = await client.query<{ content_release_id: string } & QueryResultRow>("SELECT content_release_id FROM content_releases WHERE is_active FOR UPDATE");
      const previous = active.rows[0]?.content_release_id ?? null;
      if (previous !== contentReleaseId) {
        await client.query("UPDATE content_releases SET is_active = false WHERE is_active");
        await client.query("UPDATE content_releases SET is_active = true WHERE content_release_id = $1", [contentReleaseId]);
      }
      const audit = await client.query<{ id: string; created_at: Date } & QueryResultRow>(
        "INSERT INTO content_release_audit (content_release_id, action, actor_user_id, previous_content_release_id, metadata) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id, created_at",
        [contentReleaseId, action, userId, previous, JSON.stringify({ source: "admin_api", noOp: previous === contentReleaseId })],
      );
      return { activeContentReleaseId: contentReleaseId, previousContentReleaseId: previous, auditId: audit.rows[0].id, createdAt: audit.rows[0].created_at.toISOString() };
    });
  }

  public async moderationQueue(): Promise<Record<string, unknown>> {
    const reports = await this.pool.query<{
      id: string; reason: string; details: string; status: string; created_at: Date; reporter_name: string; reported_name: string; reported_player_id: string; guild_id: string | null; message_id: string | null; message_body: string | null;
    } & QueryResultRow>(
      `SELECT r.id, r.reason, r.details, r.status, r.created_at, reporter.display_name AS reporter_name,
              reported.display_name AS reported_name, r.reported_player_id, r.guild_id, r.message_id, message.body AS message_body
         FROM player_reports r JOIN player_profiles reporter ON reporter.id = r.reporter_player_id
         JOIN player_profiles reported ON reported.id = r.reported_player_id
         LEFT JOIN guild_chat_messages message ON message.id = r.message_id
        WHERE r.status IN ('open', 'reviewing') ORDER BY r.created_at LIMIT 200`,
    );
    const audit = await this.pool.query<{ id: string; moderator_user_id: string; target_player_id: string | null; report_id: string | null; action: string; reason: string; created_at: Date } & QueryResultRow>("SELECT id, moderator_user_id, target_player_id, report_id, action, reason, created_at FROM moderation_actions ORDER BY created_at DESC LIMIT 100");
    return {
      reports: reports.rows.map((entry) => ({ reportId: entry.id, reason: entry.reason, details: entry.details, status: entry.status, reporterName: entry.reporter_name, reportedName: entry.reported_name, reportedPlayerId: entry.reported_player_id, guildId: entry.guild_id, messageId: entry.message_id, messageBody: entry.message_body, createdAt: entry.created_at.toISOString() })),
      audit: audit.rows.map((entry) => ({ actionId: entry.id, moderatorUserId: entry.moderator_user_id, targetPlayerId: entry.target_player_id, reportId: entry.report_id, action: entry.action, reason: entry.reason, createdAt: entry.created_at.toISOString() })),
    };
  }

  public async moderate(userId: string, reportId: string, action: ModerationAction, reason: string, now: Date): Promise<Record<string, unknown>> {
    return withTransaction(this.pool, async (client) => {
      const reportResult = await client.query<{ reported_player_id: string; message_id: string | null; status: string } & QueryResultRow>("SELECT reported_player_id, message_id, status FROM player_reports WHERE id = $1 FOR UPDATE", [reportId]);
      const report = reportResult.rows[0];
      if (!report) throw new AdminDatabaseError("NOT_FOUND", "Diese Meldung existiert nicht.");
      if (!['open', 'reviewing'].includes(report.status)) throw new AdminDatabaseError("VALIDATION", "Diese Meldung wurde bereits bearbeitet.");
      if (action === "remove_message") {
        if (!report.message_id) throw new AdminDatabaseError("VALIDATION", "Die Meldung verweist auf keine Chatnachricht.");
        await client.query("UPDATE guild_chat_messages SET moderation_status = 'removed', moderation_reason = $2, removed_at = $3 WHERE id = $1", [report.message_id, reason, now]);
      } else if (action === "warn") {
        await client.query("INSERT INTO player_moderation_state (player_id, warning_count, updated_at) VALUES ($1, 1, $2) ON CONFLICT (player_id) DO UPDATE SET warning_count = player_moderation_state.warning_count + 1, updated_at = EXCLUDED.updated_at", [report.reported_player_id, now]);
      } else if (action === "mute") {
        await client.query("INSERT INTO player_moderation_state (player_id, muted_until, updated_at) VALUES ($1, $2::timestamptz + interval '24 hours', $2) ON CONFLICT (player_id) DO UPDATE SET muted_until = GREATEST(COALESCE(player_moderation_state.muted_until, $2::timestamptz), $2::timestamptz + interval '24 hours'), updated_at = EXCLUDED.updated_at", [report.reported_player_id, now]);
      } else if (action === "lock_account") {
        await client.query("UPDATE users SET status = 'locked', locked_at = $2, updated_at = $2 WHERE id = (SELECT user_id FROM player_profiles WHERE id = $1)", [report.reported_player_id, now]);
        await client.query("UPDATE user_sessions SET revoked_at = $2, revoke_reason = 'account_status' WHERE user_id = (SELECT user_id FROM player_profiles WHERE id = $1) AND revoked_at IS NULL", [report.reported_player_id, now]);
      }
      const nextStatus = action === "dismiss" ? "dismissed" : "resolved";
      await client.query("UPDATE player_reports SET status = $2, resolved_at = $3 WHERE id = $1", [reportId, nextStatus, now]);
      const audit = await client.query<{ id: string } & QueryResultRow>("INSERT INTO moderation_actions (moderator_user_id, target_player_id, report_id, action, reason, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING id", [userId, report.reported_player_id, reportId, action, reason, JSON.stringify({ source: "admin_api" })]);
      return { reportId, status: nextStatus, action, actionId: audit.rows[0].id };
    });
  }

  public async guildLedger(guildId: string): Promise<Record<string, unknown>> {
    const guild = await this.pool.query<{ name: string; tag: string; dna_balance: string } & QueryResultRow>("SELECT name, tag, dna_balance::text FROM guilds WHERE id = $1", [guildId]);
    if (!guild.rows[0]) throw new AdminDatabaseError("NOT_FOUND", "Diese Gilde existiert nicht.");
    const ledger = await this.pool.query<{ id: string; player_id: string; command_id: string; delta: string; balance_before: string; balance_after: string; reason: string; created_at: Date } & QueryResultRow>("SELECT id, player_id, command_id, delta::text, balance_before::text, balance_after::text, reason, created_at FROM guild_ledger WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 500", [guildId]);
    return { guild: { name: guild.rows[0].name, tag: guild.rows[0].tag, dnaBalance: guild.rows[0].dna_balance }, ledger: ledger.rows.map((entry) => ({ ledgerId: entry.id, playerId: entry.player_id, commandId: entry.command_id, delta: entry.delta, balanceBefore: entry.balance_before, balanceAfter: entry.balance_after, reason: entry.reason, createdAt: entry.created_at.toISOString() })) };
  }
}
