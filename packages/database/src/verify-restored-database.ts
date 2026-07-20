import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { BALANCE_RELEASE_ID, CONTENT_RELEASE_ID } from "@idle-tamer/contracts";

import { createDatabasePool, pingDatabase } from "./pool";
import { applyBalanceDelta, executePlayerCommand, hashCommand } from "./transaction";

const databaseUrl = process.env.RESTORE_DATABASE_URL;
if (!databaseUrl) throw new Error("RESTORE_DATABASE_URL is required for restore verification.");

const pool = createDatabasePool(databaseUrl);
const userId = randomUUID();
const playerId = randomUUID();
const commandId = randomUUID();

try {
  await pingDatabase(pool);
  await pool.query(
    `INSERT INTO users (id, email_original, email_normalized)
     VALUES ($1, $2, $2)`,
    [userId, `restore-${userId}@idle-tamer.local`],
  );
  await pool.query(
    `INSERT INTO player_profiles
       (id, user_id, display_name, display_name_normalized, content_release_id, balance_release_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [playerId, userId, `Restore ${userId.slice(0, 8)}`, `restore ${userId}`, CONTENT_RELEASE_ID, BALANCE_RELEASE_ID],
  );

  const result = await executePlayerCommand(pool, {
    playerId,
    commandId,
    clientInstanceId: randomUUID(),
    commandType: "restore.verify",
    expectedRevision: 0,
    requestHash: hashCommand({ type: "restore.verify" }),
  }, async (client) => {
    const gold = await applyBalanceDelta(client, {
      kind: "wallet",
      playerId,
      commandId,
      definitionId: "gold",
      delta: 3n,
      reason: "restore.verify",
      contentReleaseId: CONTENT_RELEASE_ID,
      balanceReleaseId: BALANCE_RELEASE_ID,
    });
    return { gold: gold.toString() };
  });

  const proof = await pool.query(
    `SELECT p.revision, w.amount,
            (SELECT count(*)::int FROM economy_ledger e WHERE e.player_id = p.id) AS ledger_count
       FROM player_profiles p
       JOIN wallet_balances w ON w.player_id = p.id AND w.definition_id = 'gold'
      WHERE p.id = $1`,
    [playerId],
  );
  assert.equal(result.revision, 1);
  assert.deepEqual(result.value, { gold: "3" });
  assert.equal(proof.rows[0].revision, "1");
  assert.equal(proof.rows[0].amount, "3");
  assert.equal(proof.rows[0].ledger_count, 1);
  console.info("Restored database verified: health, revision, balance and ledger are consistent.");
} finally {
  await pool.end();
}
