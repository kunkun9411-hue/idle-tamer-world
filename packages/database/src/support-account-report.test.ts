import type { Pool, PoolClient, QueryResult } from "pg";
import { describe, expect, it, vi } from "vitest";

import { getSupportAccountReport, maskSupportEmail } from "./support-account-report";

const emptyResult = (): QueryResult => ({ command: "SELECT", rowCount: 0, oid: 0, fields: [], rows: [] });
const result = <T extends Record<string, unknown>>(rows: T[]): QueryResult<T> => ({ command: "SELECT", rowCount: rows.length, oid: 0, fields: [], rows });

describe("support account report", () => {
  it("runs only inside a read-only transaction and omits credentials and token material", async () => {
    const statements: string[] = [];
    const query = vi.fn(async (sql: string) => {
      statements.push(sql.trim());
      if (sql.includes("FROM users u")) return result([{
        user_id: "01900000-0000-7000-8000-000000000101",
        account_status: "active",
        email_normalized: "owner@example.test",
        email_verified_at: new Date("2026-07-21T20:00:00.000Z"),
        account_created_at: new Date("2026-07-21T19:00:00.000Z"),
        account_updated_at: new Date("2026-07-21T20:00:00.000Z"),
        deletion_requested_at: null,
        delete_after: null,
        deleted_at: null,
        player_id: "01900000-0000-7000-8000-000000000102",
        display_name: "Test Tamer",
        avatar_id: "wanderer",
        frame_id: "silver",
        revision: "1",
        starter_definition_id: "pyrook",
        content_release_id: "foundation-1.0.0",
        balance_release_id: "low-numbers-1.0.0",
        profile_created_at: new Date("2026-07-21T19:00:00.000Z"),
      }]);
      if (sql.includes("FROM user_roles")) return result([{ role: "player" }]);
      if (sql.includes("count(*) FILTER") && sql.includes("FROM user_sessions")) return result([{ active_count: 1, revoked_count: 2, latest_seen_at: new Date("2026-07-21T20:05:00.000Z") }]);
      if (sql.includes("FROM user_sessions")) return result([{
        device_name: "Chrome · Windows",
        remember_me: true,
        created_at: new Date("2026-07-21T20:00:00.000Z"),
        last_seen_at: new Date("2026-07-21T20:05:00.000Z"),
        idle_expires_at: new Date("2026-07-22T20:05:00.000Z"),
        absolute_expires_at: new Date("2026-08-20T20:00:00.000Z"),
      }]);
      if (sql.includes("FROM account_tokens")) return result([{ verification: 0, password_reset: 0, deletion_cancellation: 0 }]);
      if (sql.includes("FROM account_export_jobs")) return result([{ open_count: 0 }]);
      return emptyResult();
    });
    const client = { query, release: vi.fn() } as unknown as PoolClient;
    const pool = { connect: vi.fn(async () => client) } as unknown as Pick<Pool, "connect">;

    const report = await getSupportAccountReport(pool, { email: " OWNER@EXAMPLE.TEST " }, new Date("2026-07-21T21:00:00.000Z"));

    expect(statements[0]).toBe("BEGIN TRANSACTION READ ONLY");
    expect(statements.at(-1)).toBe("COMMIT");
    expect(statements.every((statement) => {
      const normalized = statement.replace(/\s+/gu, " ");
      return normalized === "BEGIN TRANSACTION READ ONLY"
        || normalized.startsWith("SET LOCAL ")
        || normalized.startsWith("SELECT ")
        || normalized === "COMMIT";
    })).toBe(true);
    expect(report).toMatchObject({
      account: { status: "active", emailMasked: "ow***@example.test", emailVerified: true, roles: ["player"] },
      profile: { starterDefinitionId: "pyrook", revision: 1 },
      sessions: { activeCount: 1, revokedCount: 2 },
    });
    expect(JSON.stringify(report)).not.toMatch(/password_hash|token_hash|csrf_hash|email_normalized/iu);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the connection when a lookup fails", async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        if (sql.includes("FROM users u")) throw new Error("query failed");
        return emptyResult();
      }),
      release: vi.fn(),
    } as unknown as PoolClient;
    const pool = { connect: vi.fn(async () => client) } as unknown as Pick<Pool, "connect">;

    await expect(getSupportAccountReport(pool, { userId: "01900000-0000-7000-8000-000000000101" })).rejects.toThrow("query failed");
    expect(statements).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("masks addresses without returning the original local part", () => {
    expect(maskSupportEmail("x@example.test")).toBe("x***@example.test");
    expect(maskSupportEmail("owner@example.test")).toBe("ow***@example.test");
    expect(maskSupportEmail(null)).toBeNull();
  });
});
