import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createDatabasePool } from "./pool";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for database seeding.");

const pool = createDatabasePool(databaseUrl);
try {
  const seedPath = fileURLToPath(new URL("../seeds/development.sql", import.meta.url));
  await pool.query(await readFile(seedPath, "utf8"));
  console.info("Idle Tamer development seed applied.");
} finally {
  await pool.end();
}
