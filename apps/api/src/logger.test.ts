import { describe, expect, it } from "vitest";

import { createApiLogger } from "./logger";

const config = {
  NODE_ENV: "production" as const,
  HOST: "127.0.0.1",
  PORT: 3_001,
  LOG_LEVEL: "info" as const,
  DATABASE_URL: "postgres://must-not-appear",
  PUBLIC_ORIGIN: "https://idle-tamer.test",
  AUTH_TERMS_VERSION: "alpha-foundation-1",
  AUTH_PRIVACY_VERSION: "alpha-foundation-1",
  RATE_LIMIT_HMAC_SECRET: "test-rate-limit-secret-at-least-32-characters",
  AUTH_MAIL_OUTBOX_PATH: ".local/test-auth-outbox.jsonl",
  FEATURE_GUILDS: false,
  FEATURE_GUILD_DNA: false,
  FEATURE_LIVE_EVENTS: false,
  FEATURE_PVP: false,
};

describe("API log redaction", () => {
  it("redacts authentication, password, token and email fields in the real JSON logger", () => {
    const chunks: string[] = [];
    const destination = { write: (chunk: string) => chunks.push(chunk) };
    const logger = createApiLogger(config, destination);

    logger.info({
      req: {
        headers: { authorization: "Bearer secret-token", cookie: "session=private-cookie" },
        body: { email: "tamer@example.test", password: "raw-password", token: "body-token" },
      },
      email: "other@example.test",
      passwordHash: "hashed-password",
      token: "top-level-token",
    }, "redaction probe");

    const output = chunks.join("");
    expect(output).toContain("redaction probe");
    expect(output).toContain("[REDACTED]");
    for (const secret of ["secret-token", "private-cookie", "tamer@example.test", "raw-password", "body-token", "other@example.test", "hashed-password", "top-level-token"]) {
      expect(output).not.toContain(secret);
    }
  });
});
