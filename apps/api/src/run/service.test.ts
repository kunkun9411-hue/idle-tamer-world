import { randomUUID } from "node:crypto";

import type { AuthoritativeRunSnapshot, RunCommandEnvelope } from "@idle-tamer/contracts";
import { RunDatabaseError, type RunStore } from "@idle-tamer/database";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../errors";
import { RunService } from "./service";

const now = new Date("2026-07-21T20:00:00.000Z");
const snapshot = (): AuthoritativeRunSnapshot => ({
  revision: 0,
  serverTime: now.toISOString(),
  contentReleaseId: "foundation-1.0.0",
  balanceReleaseId: "low-numbers-1.0.0",
  gold: "100",
  pendingGold: "0",
  cacheSlotsUsed: 0,
  cacheCapacity: 90,
  activeMonster: { definitionId: "pyrook", level: 1 },
  currentZoneId: "violet-rim",
  unlockedZoneIds: ["violet-rim"],
  highestZoneNumber: 1,
  zoneProgress: { "violet-rim": { stage: 1, clears: "0" } },
  runVictories: "0",
  totalVictories: "0",
  progressionStatus: "fighting",
  nextCombatAt: new Date(now.getTime() + 7_000).toISOString(),
});

const envelope = (command: object) => ({
  commandId: randomUUID(),
  clientInstanceId: randomUUID(),
  expectedRevision: 0,
  issuedAt: now.toISOString(),
  command,
});

describe("RunService", () => {
  it("strips client-supplied reward and balance fields before persistence", async () => {
    const executeCommand = vi.fn(async (_userId: string, request: RunCommandEnvelope) => ({
      runContractVersion: 1 as const,
      accepted: true as const,
      replayed: false,
      snapshot: snapshot(),
      event: { type: "cache.claimed" as const, payload: { gold: "0" } },
    }));
    const store = { bootstrap: vi.fn(), executeCommand } as unknown as RunStore;
    const service = new RunService(store, () => now);
    await service.command("user", envelope({ type: "cache.claim", gold: "999999999999", victories: 500 }));
    expect(executeCommand.mock.calls[0][1].command).toEqual({ type: "cache.claim" });
  });

  it("maps stale revisions without leaking database details", async () => {
    const store = {
      bootstrap: vi.fn(),
      executeCommand: vi.fn().mockRejectedValue(new RunDatabaseError("CONFLICT", "internal", 7)),
    } as unknown as RunStore;
    const service = new RunService(store, () => now);
    await expect(service.command("user", envelope({ type: "cache.claim" }))).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT", latestRevision: 7 } satisfies Partial<ApiError>);
  });

  it("rejects unsupported or malformed commands before the store", async () => {
    const store = { bootstrap: vi.fn(), executeCommand: vi.fn() } as unknown as RunStore;
    const service = new RunService(store, () => now);
    await expect(service.command("user", envelope({ type: "wallet.set", gold: "10" }))).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION" });
    expect(store.executeCommand).not.toHaveBeenCalled();
  });
});
