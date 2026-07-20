import { describe, expect, it, vi } from "vitest";
import { API_PROTOCOL_VERSION, type GameBootstrapResponse } from "./api-contract";
import { GameApiError, HttpGameClient } from "./api-client";
import { createInitialState } from "./rules";
import { CONTENT_CONTRACT_VERSION, CONTENT_RELEASE_ID, ERROR_CONTRACT_VERSION } from "./contract-versions";

const bootstrapPayload = (): GameBootstrapResponse => ({
  protocolVersion: API_PROTOCOL_VERSION,
  contentContractVersion: CONTENT_CONTRACT_VERSION,
  contentReleaseId: CONTENT_RELEASE_ID,
  revision: 12,
  serverTime: "2026-07-19T22:00:00.000Z",
  state: createInitialState(),
  session: { authenticated: true, playerId: "player-1", displayName: "Tamer" },
  features: { guilds: false, guildDna: false, liveEvents: false, pvp: false },
  offline: { elapsedSeconds: 1_800, rewardedSeconds: 1_800, slotsAdded: 3, goldAdded: 36, eggDefinitionIds: [], itemDeltas: { training_data: 1 } },
});

describe("HttpGameClient backend boundary", () => {
  it("bootstraps with cookie credentials and validates the protocol", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(bootstrapPayload()), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
    const client = new HttpGameClient({ baseUrl: "https://game.test/api/", clientInstanceId: "client-1", fetchImpl });

    await expect(client.bootstrap()).resolves.toMatchObject({ revision: 12, offline: { elapsedSeconds: 1_800, goldAdded: 36 } });
    expect(fetchImpl).toHaveBeenCalledWith("https://game.test/api/game/state", expect.objectContaining({ method: "GET", credentials: "include" }));
  });

  it("sends command id, client id and expected revision without trusting client rewards", async () => {
    const response = { ...bootstrapPayload(), accepted: true };
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.clientInstanceId).toBe("client-1");
      expect(body.expectedRevision).toBe(12);
      expect(body.commandId).toEqual(expect.any(String));
      expect(body.command).toEqual({ type: "monster.level_up", monsterUid: "monster-1" });
      expect(body).not.toHaveProperty("gold");
      return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch;
    const client = new HttpGameClient({ clientInstanceId: "client-1", fetchImpl });

    await expect(client.send({ type: "monster.level_up", monsterUid: "monster-1" }, 12)).resolves.toMatchObject({ accepted: true });
  });

  it("turns conflicts and unreachable servers into typed errors", async () => {
    const conflictFetch = vi.fn(async () => new Response(JSON.stringify({
      errorContractVersion: ERROR_CONTRACT_VERSION,
      code: "CONFLICT",
      message: "Spielstand wurde bereits geändert.",
      latestRevision: 13,
    }), { status: 409, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const conflictClient = new HttpGameClient({ fetchImpl: conflictFetch });
    await expect(conflictClient.bootstrap()).rejects.toBeInstanceOf(GameApiError);
    await expect(conflictClient.bootstrap()).rejects.toMatchObject({ status: 409, problem: { code: "CONFLICT", latestRevision: 13 } });

    const offlineClient = new HttpGameClient({ fetchImpl: vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch });
    await expect(offlineClient.bootstrap()).rejects.toBeInstanceOf(GameApiError);
    await expect(offlineClient.bootstrap()).rejects.toMatchObject({ status: 0, problem: { code: "UNAVAILABLE" } });
  });
});
