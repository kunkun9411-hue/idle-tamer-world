import { randomUUID } from "node:crypto";

import type { GuildCommandEnvelope, GuildSnapshot } from "@idle-tamer/contracts";
import { GuildDatabaseError, type GuildStore } from "@idle-tamer/database";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../errors";
import { GuildService } from "./service";

const now = new Date("2026-07-22T01:00:00.000Z");
const emptySnapshot = (): GuildSnapshot => ({ revision: 0, serverTime: now.toISOString(), membership: null, directory: [], friends: [], blockedPlayerIds: [], invitations: [], joinAvailableAt: now.toISOString() });
const envelope = (command: object) => ({ commandId: randomUUID(), clientInstanceId: randomUUID(), expectedRevision: 0, issuedAt: now.toISOString(), command });

describe("GuildService", () => {
  it("strips client-supplied balances and validates every guild intent", async () => {
    const executeCommand = vi.fn(async (_userId: string, request: GuildCommandEnvelope) => ({
      guildContractVersion: 1 as const, accepted: true as const, replayed: false, snapshot: emptySnapshot(), event: { type: "guild.donated", payload: {} },
    }));
    const store = { bootstrap: vi.fn(), executeCommand } as unknown as GuildStore;
    const service = new GuildService(store, () => now);
    await service.command("user", envelope({ type: "guild.donate", amount: 10, guildBalance: "999999" }));
    expect(executeCommand.mock.calls[0][1].command).toEqual({ type: "guild.donate", amount: 10 });
  });

  it("maps stale social revisions without database details", async () => {
    const store = { bootstrap: vi.fn(), executeCommand: vi.fn().mockRejectedValue(new GuildDatabaseError("CONFLICT", "internal", 9)) } as unknown as GuildStore;
    const service = new GuildService(store, () => now);
    await expect(service.command("user", envelope({ type: "guild.boss_attack" }))).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT", latestRevision: 9 } satisfies Partial<ApiError>);
  });

  it("rejects malformed IDs, roles, votes and unknown commands before the store", async () => {
    const store = { bootstrap: vi.fn(), executeCommand: vi.fn() } as unknown as GuildStore;
    const service = new GuildService(store, () => now);
    await expect(service.command("user", envelope({ type: "guild.join", guildId: "wrong" }))).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.command("user", envelope({ type: "guild.vote_cast", voteId: randomUUID(), choice: "maybe" }))).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.command("user", envelope({ type: "guild.balance_set", amount: 10 }))).rejects.toMatchObject({ statusCode: 400 });
    expect(store.executeCommand).not.toHaveBeenCalled();
  });
});
