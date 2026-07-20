import { createHash } from "node:crypto";

import type { Pool, PoolClient, QueryResultRow } from "pg";

export class DatabaseCommandError extends Error {
  public constructor(
    public readonly code: "CONFLICT" | "VALIDATION" | "INSUFFICIENT_BALANCE" | "NOT_FOUND",
    message: string,
    public readonly latestRevision?: number,
  ) {
    super(message);
    this.name = "DatabaseCommandError";
  }
}

export const withTransaction = async <T>(
  pool: Pick<Pool, "connect">,
  task: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await task(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

export const hashCommand = (command: unknown): Buffer =>
  createHash("sha256").update(JSON.stringify(canonicalize(command))).digest();

interface ProfileRevisionRow extends QueryResultRow {
  revision: string;
}

interface ExistingCommandRow extends QueryResultRow {
  request_hash: Buffer;
  resulting_revision: string;
  response_snapshot: unknown;
}

export interface CommandTransactionInput {
  playerId: string;
  commandId: string;
  clientInstanceId: string;
  commandType: string;
  expectedRevision: number;
  requestHash: Buffer;
}

export interface CommandTransactionResult<T> {
  revision: number;
  replayed: boolean;
  value: T;
}

const safeRevision = (value: string): number => {
  const revision = Number(value);
  if (!Number.isSafeInteger(revision)) throw new Error("Player revision exceeded the API safe-integer contract.");
  return revision;
};

export const executePlayerCommand = async <T>(
  pool: Pick<Pool, "connect">,
  input: CommandTransactionInput,
  handler: (client: PoolClient) => Promise<T>,
): Promise<CommandTransactionResult<T>> =>
  withTransaction(pool, async (client) => {
    const profile = await client.query<ProfileRevisionRow>(
      "SELECT revision FROM player_profiles WHERE id = $1 FOR UPDATE",
      [input.playerId],
    );
    if (profile.rowCount !== 1) throw new DatabaseCommandError("NOT_FOUND", "Player profile does not exist.");

    const existing = await client.query<ExistingCommandRow>(
      `SELECT request_hash, resulting_revision, response_snapshot
         FROM game_commands
        WHERE player_id = $1 AND command_id = $2`,
      [input.playerId, input.commandId],
    );
    if (existing.rowCount === 1) {
      const row = existing.rows[0];
      if (!row.request_hash.equals(input.requestHash)) {
        throw new DatabaseCommandError("VALIDATION", "commandId was already used for a different payload.");
      }
      return { revision: safeRevision(row.resulting_revision), replayed: true, value: row.response_snapshot as T };
    }

    const currentRevision = safeRevision(profile.rows[0].revision);
    if (currentRevision !== input.expectedRevision) {
      throw new DatabaseCommandError("CONFLICT", "The client revision is stale.", currentRevision);
    }

    await client.query(
      `INSERT INTO game_commands
         (player_id, command_id, client_instance_id, request_hash, command_type, expected_revision, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
      [input.playerId, input.commandId, input.clientInstanceId, input.requestHash, input.commandType, input.expectedRevision],
    );

    const value = await handler(client);
    const updated = await client.query<ProfileRevisionRow>(
      `UPDATE player_profiles
          SET revision = revision + 1, updated_at = clock_timestamp()
        WHERE id = $1 AND revision = $2
      RETURNING revision`,
      [input.playerId, input.expectedRevision],
    );
    if (updated.rowCount !== 1) throw new DatabaseCommandError("CONFLICT", "Player revision changed during the command.");

    const revision = safeRevision(updated.rows[0].revision);
    await client.query(
      `UPDATE game_commands
          SET status = 'accepted', resulting_revision = $3, response_snapshot = $4::jsonb, completed_at = clock_timestamp()
        WHERE player_id = $1 AND command_id = $2`,
      [input.playerId, input.commandId, revision, JSON.stringify(value)],
    );
    return { revision, replayed: false, value };
  });

type BalanceKind = "item" | "wallet";

const balanceTable: Record<BalanceKind, string> = {
  item: "item_balances",
  wallet: "wallet_balances",
};

interface BalanceRow extends QueryResultRow {
  amount: string;
}

export interface BalanceDeltaInput {
  kind: BalanceKind;
  playerId: string;
  commandId: string;
  definitionId: string;
  delta: bigint;
  reason: string;
  contentReleaseId: string;
  balanceReleaseId: string;
}

export const applyBalanceDelta = async (client: PoolClient, input: BalanceDeltaInput): Promise<bigint> => {
  const table = balanceTable[input.kind];
  await client.query(
    `INSERT INTO ${table} (player_id, definition_id, amount)
     VALUES ($1, $2, 0)
     ON CONFLICT (player_id, definition_id) DO NOTHING`,
    [input.playerId, input.definitionId],
  );
  const locked = await client.query<BalanceRow>(
    `SELECT amount FROM ${table} WHERE player_id = $1 AND definition_id = $2 FOR UPDATE`,
    [input.playerId, input.definitionId],
  );
  if (locked.rowCount !== 1) throw new DatabaseCommandError("NOT_FOUND", "Balance row could not be locked.");

  const before = BigInt(locked.rows[0].amount);
  const after = before + input.delta;
  if (after < 0n) throw new DatabaseCommandError("INSUFFICIENT_BALANCE", "The balance is too low.");

  await client.query(
    `UPDATE ${table} SET amount = $3, updated_at = clock_timestamp()
      WHERE player_id = $1 AND definition_id = $2`,
    [input.playerId, input.definitionId, after.toString()],
  );
  await client.query(
    `INSERT INTO economy_ledger
       (player_id, command_id, asset_kind, definition_id, delta, balance_before, balance_after, reason, content_release_id, balance_release_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      input.playerId,
      input.commandId,
      input.kind,
      input.definitionId,
      input.delta.toString(),
      before.toString(),
      after.toString(),
      input.reason,
      input.contentReleaseId,
      input.balanceReleaseId,
    ],
  );
  return after;
};
