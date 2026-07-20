import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_PROTOCOL_VERSION, type GameBootstrapResponse } from "./api-contract";
import { GameApiError, type GameApiClient } from "./api-client";
import { CONTENT_CONTRACT_VERSION, CONTENT_RELEASE_ID, ERROR_CONTRACT_VERSION } from "./contract-versions";
import { LocalGameService } from "./game-service";
import { HttpGameService, LocalGameServicePort } from "./game-service-port";
import { createInitialState } from "./rules";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

const bootstrap = (): GameBootstrapResponse => ({
  protocolVersion: API_PROTOCOL_VERSION,
  contentContractVersion: CONTENT_CONTRACT_VERSION,
  contentReleaseId: CONTENT_RELEASE_ID,
  revision: 4,
  serverTime: "2026-07-20T06:00:00.000Z",
  state: createInitialState(),
  session: { authenticated: true, playerId: "player-1", displayName: "Tamer" },
  features: { guilds: false, guildDna: false, liveEvents: false, pvp: false },
  offline: { elapsedSeconds: 0, rewardedSeconds: 0, slotsAdded: 0, goldAdded: 0, eggDefinitionIds: [], itemDeltas: {} },
});

describe("shared game service port", () => {
  it("executes the same intent contract locally and advances its revision", async () => {
    const port = new LocalGameServicePort(new LocalGameService(createInitialState()));
    await expect(port.send({ type: "starter.choose", definitionId: "pyrook" })).resolves.toMatchObject({ accepted: true, revision: 1 });
    await expect(port.send({ type: "starter.choose", definitionId: "mossbit" })).resolves.toMatchObject({ accepted: false, revision: 1 });
    expect(port.state.roster[0].definitionId).toBe("pyrook");
  });

  it("replaces local guesses with authoritative HTTP state and revision", async () => {
    const payload = bootstrap();
    const remoteState = createInitialState();
    remoteState.resources.gold = 777;
    const client: GameApiClient = {
      bootstrap: vi.fn(async () => payload),
      send: vi.fn(async () => ({ ...payload, state: remoteState, revision: 5, accepted: true })),
    };
    const port = new HttpGameService(client);
    await port.bootstrap();
    const result = await port.send({ type: "cache.claim" });
    expect(result).toMatchObject({ accepted: true, revision: 5 });
    expect(port.state.resources.gold).toBe(777);
    expect(client.send).toHaveBeenCalledWith({ type: "cache.claim" }, 4, undefined);
  });

  it("surfaces revision conflicts as a stable connection state", async () => {
    const problem = { errorContractVersion: ERROR_CONTRACT_VERSION, code: "CONFLICT" as const, message: "stale", latestRevision: 9 };
    const client: GameApiClient = {
      bootstrap: vi.fn(async () => bootstrap()),
      send: vi.fn(async () => { throw new GameApiError(409, problem); }),
    };
    const port = new HttpGameService(client);
    await port.bootstrap();
    await expect(port.send({ type: "cache.claim" })).rejects.toBeInstanceOf(GameApiError);
    expect(port.connection).toBe("conflict");
  });
});

