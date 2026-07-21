import { Pool } from "pg";

import { getSupportAccountReport, type SupportAccountLocator } from "./support-account-report";

const usage = "Nutzung: pnpm support:account -- --email name@example.de | --user-id UUID";

const parseLocator = (arguments_: string[]): SupportAccountLocator => {
  const args = arguments_.filter((argument) => argument !== "--");
  const emailIndex = args.indexOf("--email");
  const userIdIndex = args.indexOf("--user-id");
  if ((emailIndex >= 0) === (userIdIndex >= 0)) throw new Error(usage);
  if (emailIndex >= 0) {
    const email = args[emailIndex + 1];
    if (!email || args.length !== 2) throw new Error(usage);
    return { email };
  }
  const userId = args[userIdIndex + 1];
  if (!userId || args.length !== 2) throw new Error(usage);
  return { userId };
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL fehlt.");

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: "idle-tamer-support-readonly",
  max: 1,
  options: "-c default_transaction_read_only=on -c statement_timeout=5000",
});

try {
  const report = await getSupportAccountReport(pool, parseLocator(process.argv.slice(2)));
  if (!report) {
    process.stderr.write("Kein Account für die exakte Suche gefunden.\n");
    process.exitCode = 2;
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
} finally {
  await pool.end();
}
