import { describe, expect, it, vi } from "vitest";

import { loadServerConfig } from "@idle-tamer/config";

import { buildApp } from "./app";

const testConfig = {
  NODE_ENV: "test" as const,
  HOST: "127.0.0.1",
  PORT: 3_001,
  LOG_LEVEL: "silent" as const,
  DATABASE_URL: "postgres://unused",
  PUBLIC_ORIGIN: "https://idle-tamer.test",
  AUTH_TERMS_VERSION: "alpha-foundation-1",
  AUTH_PRIVACY_VERSION: "alpha-foundation-1",
  RATE_LIMIT_HMAC_SECRET: "test-rate-limit-secret-at-least-32-characters",
  AUTH_MAIL_OUTBOX_PATH: ".local/test-auth-outbox.jsonl",
  FEATURE_GUILDS: false,
  FEATURE_GUILD_DNA: true,
  FEATURE_LIVE_EVENTS: false,
  FEATURE_PVP: false,
};

describe("Fastify foundation", () => {
  it("reports liveness and returns a correlation header", async () => {
    const app = buildApp({ config: testConfig, database: { ping: vi.fn() }, logger: false });
    const response = await app.inject({ method: "GET", url: "/health/live", headers: { "x-request-id": "test-request-1" } });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("test-request-1");
    expect(response.json()).toMatchObject({ status: "ok", protocolVersion: 8 });
    await app.close();
  });

  it("separates readiness from liveness", async () => {
    const app = buildApp({ config: testConfig, database: { ping: vi.fn().mockRejectedValue(new Error("offline")) }, logger: false });
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ errorContractVersion: 1, code: "UNAVAILABLE" });
    expect(response.json().correlationId).toBeTruthy();
    await app.close();
  });

  it("publishes only safe release and feature metadata", async () => {
    const app = buildApp({ config: testConfig, database: { ping: vi.fn() }, logger: false });
    const response = await app.inject({ method: "GET", url: "/api/v1/meta" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      protocolVersion: 8,
      runContractVersion: 1,
      contentReleaseId: "foundation-1.0.0",
      features: { guilds: false, guildDna: true, liveEvents: false, pvp: false },
    });
    await app.close();
  });

  it("does not opt cross-origin browsers into credentialed API access", async () => {
    const app = buildApp({ config: testConfig, database: { ping: vi.fn() }, logger: false });
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/bootstrap",
      headers: {
        origin: "https://evil.test",
        "access-control-request-method": "GET",
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
    await app.close();
  });

  it("fails closed when production lacks HTTPS or an external rate-limit secret", () => {
    expect(() => loadServerConfig({ NODE_ENV: "production", PUBLIC_ORIGIN: "https://idle-tamer.test" })).toThrow(/rate-limit HMAC secret/iu);
    expect(() => loadServerConfig({
      NODE_ENV: "production",
      PUBLIC_ORIGIN: "http://idle-tamer.test",
      RATE_LIMIT_HMAC_SECRET: "external-test-secret-at-least-32-characters",
    })).toThrow(/HTTPS public origin/iu);
    expect(loadServerConfig({
      NODE_ENV: "production",
      PUBLIC_ORIGIN: "https://idle-tamer.test",
      RATE_LIMIT_HMAC_SECRET: "external-test-secret-at-least-32-characters",
    })).toMatchObject({ NODE_ENV: "production", PUBLIC_ORIGIN: "https://idle-tamer.test" });
  });
});
