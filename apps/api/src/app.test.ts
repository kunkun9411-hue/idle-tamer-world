import { describe, expect, it, vi } from "vitest";

import { buildApp } from "./app";

const testConfig = {
  NODE_ENV: "test" as const,
  HOST: "127.0.0.1",
  PORT: 3_001,
  LOG_LEVEL: "silent" as const,
  DATABASE_URL: "postgres://unused",
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
      contentReleaseId: "foundation-1.0.0",
      features: { guilds: false, guildDna: true, liveEvents: false, pvp: false },
    });
    await app.close();
  });
});
