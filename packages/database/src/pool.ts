import { Pool, types } from "pg";

// PostgreSQL numeric values must never be silently rounded into JavaScript numbers.
types.setTypeParser(1_700, (value) => value);

export const createDatabasePool = (connectionString: string): Pool =>
  new Pool({
    connectionString,
    application_name: "idle-tamer-api",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

export const pingDatabase = async (pool: Pick<Pool, "query">): Promise<void> => {
  await pool.query("SELECT 1 AS healthy");
};
