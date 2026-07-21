import { randomUUID } from "node:crypto";

import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { applyBalanceDelta, DatabaseCommandError, executePlayerCommand, hashCommand } from "./transaction";
import { createDatabasePool } from "./pool";
import { guardedTestDatabaseUrl } from "./test-database-guard";

const databaseUrl = guardedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const integration = databaseUrl ? describe : describe.skip;

const playerId = "01900000-0000-7000-8000-000000000102";
const userId = "01900000-0000-7000-8000-000000000101";

integration("PostgreSQL 18 command transaction", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createDatabasePool(databaseUrl as string);
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE economy_ledger, game_commands, item_balances, wallet_balances, player_profiles, users CASCADE");
    await pool.query(
      `INSERT INTO users (id, email_original, email_normalized)
       VALUES ($1, 'integration@idle-tamer.local', 'integration@idle-tamer.local')`,
      [userId],
    );
    await pool.query(
      `INSERT INTO player_profiles
         (id, user_id, display_name, display_name_normalized, content_release_id, balance_release_id)
       VALUES ($1, $2, 'Integration Tamer', 'integration tamer', 'foundation-1.0.0', 'low-numbers-1.0.0')`,
      [playerId, userId],
    );
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("rejects negative balances at the database boundary", async () => {
    await expect(pool.query(
      "INSERT INTO wallet_balances (player_id, definition_id, amount) VALUES ($1, 'gold', -1)",
      [playerId],
    )).rejects.toMatchObject({ code: "23514" });
  });

  it("books one ledger entry when the same command arrives in parallel", async () => {
    const commandId = randomUUID();
    const input = {
      playerId,
      commandId,
      clientInstanceId: randomUUID(),
      commandType: "cache.claim",
      expectedRevision: 0,
      requestHash: hashCommand({ type: "cache.claim" }),
    };
    const handler = vi.fn(async (client) => {
      const amount = await applyBalanceDelta(client, {
        kind: "wallet",
        playerId,
        commandId,
        definitionId: "gold",
        delta: 5n,
        reason: "cache.claim",
        contentReleaseId: "foundation-1.0.0",
        balanceReleaseId: "low-numbers-1.0.0",
      });
      return { gold: amount.toString() };
    });

    const results = await Promise.all([
      executePlayerCommand(pool, input, handler),
      executePlayerCommand(pool, input, handler),
    ]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.replayed).sort()).toEqual([false, true]);
    expect(results.every((result) => result.revision === 1 && result.value.gold === "5")).toBe(true);
    const balance = await pool.query("SELECT amount FROM wallet_balances WHERE player_id = $1 AND definition_id = 'gold'", [playerId]);
    const ledger = await pool.query("SELECT count(*)::int AS count FROM economy_ledger WHERE player_id = $1", [playerId]);
    expect(balance.rows[0].amount).toBe("5");
    expect(ledger.rows[0].count).toBe(1);
  });

  it("rejects stale revisions without partial writes", async () => {
    await pool.query("UPDATE player_profiles SET revision = 3 WHERE id = $1", [playerId]);
    const handler = vi.fn();
    await expect(executePlayerCommand(pool, {
      playerId,
      commandId: randomUUID(),
      clientInstanceId: randomUUID(),
      commandType: "monster.level_up",
      expectedRevision: 2,
      requestHash: hashCommand({ type: "monster.level_up" }),
    }, handler)).rejects.toMatchObject({ code: "CONFLICT", latestRevision: 3 } satisfies Partial<DatabaseCommandError>);
    expect(handler).not.toHaveBeenCalled();
    const commands = await pool.query("SELECT count(*)::int AS count FROM game_commands WHERE player_id = $1", [playerId]);
    expect(commands.rows[0].count).toBe(0);
  });

  it("rolls back command, balance and ledger together", async () => {
    const commandId = randomUUID();
    await expect(executePlayerCommand(pool, {
      playerId,
      commandId,
      clientInstanceId: randomUUID(),
      commandType: "cache.claim",
      expectedRevision: 0,
      requestHash: hashCommand({ type: "cache.claim" }),
    }, async (client) => {
      await applyBalanceDelta(client, {
        kind: "wallet",
        playerId,
        commandId,
        definitionId: "gold",
        delta: 7n,
        reason: "cache.claim",
        contentReleaseId: "foundation-1.0.0",
        balanceReleaseId: "low-numbers-1.0.0",
      });
      throw new Error("force rollback");
    })).rejects.toThrow("force rollback");

    const state = await pool.query(
      `SELECT
         (SELECT revision FROM player_profiles WHERE id = $1) AS revision,
         (SELECT count(*)::int FROM game_commands WHERE player_id = $1) AS commands,
         (SELECT count(*)::int FROM economy_ledger WHERE player_id = $1) AS ledger,
         (SELECT count(*)::int FROM wallet_balances WHERE player_id = $1) AS balances`,
      [playerId],
    );
    expect(state.rows[0]).toMatchObject({ revision: "0", commands: 0, ledger: 0, balances: 0 });
  });
});
