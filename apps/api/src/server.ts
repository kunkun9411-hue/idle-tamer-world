import { loadServerConfig } from "@idle-tamer/config";
import { createDatabasePool, pingDatabase, PostgresAuthStore, PostgresRunStore, runAuthMaintenance } from "@idle-tamer/database";

import { buildApp } from "./app";
import { FileAuthMailAdapter } from "./auth/mail";

const config = loadServerConfig(process.env);
const pool = createDatabasePool(config.DATABASE_URL);
const app = buildApp({
  config,
  database: { ping: () => pingDatabase(pool) },
  authStore: new PostgresAuthStore(pool),
  runStore: new PostgresRunStore(pool),
  authMail: new FileAuthMailAdapter(config.AUTH_MAIL_OUTBOX_PATH),
});

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "Graceful shutdown started.");
  await app.close();
  await pool.end();
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ host: config.HOST, port: config.PORT });

const maintenanceTimer = setInterval(() => {
  void runAuthMaintenance(pool).then((result) => {
    if (result.anonymizedAccounts > 0) app.log.info({ anonymizedAccounts: result.anonymizedAccounts }, "Auth retention maintenance completed.");
  }).catch((error: unknown) => app.log.error({ err: error }, "Auth retention maintenance failed."));
}, 60 * 60 * 1_000);
maintenanceTimer.unref();
