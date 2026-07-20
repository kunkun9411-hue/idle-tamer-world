import { loadServerConfig } from "@idle-tamer/config";
import { createDatabasePool, pingDatabase } from "@idle-tamer/database";

import { buildApp } from "./app";

const config = loadServerConfig(process.env);
const pool = createDatabasePool(config.DATABASE_URL);
const app = buildApp({
  config,
  database: { ping: () => pingDatabase(pool) },
});

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "Graceful shutdown started.");
  await app.close();
  await pool.end();
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ host: config.HOST, port: config.PORT });
