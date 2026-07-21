import type { AccountBootstrapResponse, RunBootstrapResponse } from "@idle-tamer/contracts";
import { describe, expect, it, vi } from "vitest";

import { AccountClient, getClientInstanceId } from "./client";

const bootstrap = (): AccountBootstrapResponse => ({
  authContractVersion: 1,
  serverTime: "2026-07-21T20:00:00.000Z",
  session: { sessionId: "s", deviceName: "Chrome", createdAt: "2026-07-21T20:00:00.000Z", lastSeenAt: "2026-07-21T20:00:00.000Z", idleExpiresAt: "2026-07-22T20:00:00.000Z", absoluteExpiresAt: "2026-07-28T20:00:00.000Z", reauthenticatedAt: "2026-07-21T20:00:00.000Z" },
  account: { userId: "u", status: "active", emailMasked: "t***@example.test", emailVerified: true, roles: ["player"], createdAt: "2026-07-21T20:00:00.000Z" },
  profile: { playerId: "p", displayName: "Test", avatarId: "wanderer", frameId: "silver", revision: 0 },
  onboarding: { starterDefinitionId: null, availableStarterDefinitionIds: ["pyrook"], requiredAction: "starter_choice" },
  authority: { mode: "solo-online", server: ["account", "profile", "starter", "run", "economy", "collection", "incubation", "expeditions", "research", "prestige"], local: [], localStorageNamespace: "namespace" },
  features: { guilds: false, guildDna: false, liveEvents: false, pvp: false },
  csrfToken: "csrf-token",
});

const runBootstrap = (): RunBootstrapResponse => ({
  runContractVersion: 2,
  snapshot: {
    revision: 2,
    serverTime: "2026-07-21T20:00:00.000Z",
    contentReleaseId: "foundation-1.0.0",
    balanceReleaseId: "low-numbers-1.0.0",
    gold: "100",
    pendingGold: "26",
    cacheSlotsUsed: 2,
    cacheCapacity: 90,
    activeMonster: { definitionId: "pyrook", level: 1 },
    currentZoneId: "violet-rim",
    unlockedZoneIds: ["violet-rim"],
    highestZoneNumber: 1,
    zoneProgress: { "violet-rim": { stage: 3, clears: "0" } },
    runVictories: "2",
    totalVictories: "2",
    progressionStatus: "fighting",
    nextCombatAt: "2026-07-21T20:00:10.000Z",
    collection: {
      roster: [{ uid: "11111111-1111-4111-8111-111111111111", definitionId: "pyrook", level: 1, hyperLevel: 0, evolution: "rookie", generation: 1, gemSlots: {} }],
      activeMonsterUid: "11111111-1111-4111-8111-111111111111", supportMonsterUid: "", eggInventory: {}, fragments: {},
      inventory: { training_data: "0", evolution_core: "0", incubator_charge: "0", ether_dust: "0" }, gemInventory: {}, pendingEggs: [], pendingItems: { training_data: "0", evolution_core: "0", incubator_charge: "0", ether_dust: "0" }, pendingGems: [],
      incubation: null, expeditions: [], research: { power: 0, vitality: 0, extraction: 0, incubation: 0 }, prestigeCount: 0, cores: "0", eggPity: 0, claimedMilestones: [],
      activityCounters: { victory: 2, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 },
      objectivePeriods: { dailyKey: "2026-07-21", weeklyKey: "2026-W30", dailyBaseline: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 }, weeklyBaseline: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 } },
      claimedObjectives: [], settings: { soundEnabled: true, combatEffects: true, reducedMotion: false, numberFormat: "compact" }, tutorialStep: 0, claimedSystemMessages: [], lastServerSaveAt: "2026-07-21T20:00:00.000Z",
    },
  },
  settlement: { victoriesAdded: 2, goldAdded: "26", eggsAdded: 0, itemsAdded: 0, gemsAdded: 0 },
});

describe("AccountClient", () => {
  it("calls browser fetch without binding AccountClient as its receiver", async () => {
    const receiverAwareFetch = vi.fn(function (this: unknown) {
      expect(this).toBeUndefined();
      return Promise.resolve(new Response(JSON.stringify(bootstrap()), { status: 200, headers: { "content-type": "application/json" } }));
    }) as unknown as typeof fetch;
    const client = new AccountClient(receiverAwareFetch);
    await expect(client.bootstrap()).resolves.toEqual(bootstrap());
    expect(receiverAwareFetch).toHaveBeenCalledOnce();
  });

  it("keeps cookies implicit and forwards the rotated CSRF token to commands", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(bootstrap()), { status: 200, headers: { "content-type": "application/json" } }))
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        expect(new Headers(init.headers).get("x-csrf-token")).toBe("csrf-token");
        return new Response(JSON.stringify({ authContractVersion: 1, accepted: true, resultingRevision: 1, bootstrap: { ...bootstrap(), profile: { ...bootstrap().profile, revision: 1 } } }), { status: 200, headers: { "content-type": "application/json" } });
      });
    const client = new AccountClient(fetchImpl as unknown as typeof fetch);
    await client.bootstrap();
    await expect(client.command({ type: "starter.choose", definitionId: "pyrook" }, 0, crypto.randomUUID())).resolves.toMatchObject({ resultingRevision: 1 });
  });

  it("creates one stable browser instance id", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) };
    expect(getClientInstanceId(storage)).toBe(getClientInstanceId(storage));
  });

  it("keeps large run values as strings and sends only intents with CSRF", async () => {
    const runResponse = { ...runBootstrap(), accepted: true as const, replayed: false, event: { type: "cache.claimed" as const, payload: { gold: "26" } } };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(bootstrap()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(runBootstrap()), { status: 200 }))
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        expect(new Headers(init.headers).get("x-csrf-token")).toBe("csrf-token");
        expect(JSON.parse(String(init.body)).command).toEqual({ type: "cache.claim" });
        return new Response(JSON.stringify(runResponse), { status: 200 });
      });
    const client = new AccountClient(fetchImpl as unknown as typeof fetch);
    await client.bootstrap();
    await expect(client.bootstrapRun()).resolves.toMatchObject({ snapshot: { pendingGold: "26" } });
    await expect(client.runCommand({ type: "cache.claim" }, 2, crypto.randomUUID())).resolves.toMatchObject({ event: { payload: { gold: "26" } } });
  });

  it("uses the social revision and sends no client-owned guild balance", async () => {
    const guildBootstrap = { guildContractVersion: 1 as const, snapshot: { revision: 3, serverTime: bootstrap().serverTime, membership: null, directory: [], friends: [], blockedPlayerIds: [], invitations: [], joinAvailableAt: bootstrap().serverTime } };
    const guildResponse = { ...guildBootstrap, accepted: true as const, replayed: false, event: { type: "guild.donated", payload: { amount: 10 } } };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(bootstrap()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(guildBootstrap), { status: 200 }))
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        expect(new Headers(init.headers).get("x-csrf-token")).toBe("csrf-token");
        const body = JSON.parse(String(init.body));
        expect(body).toMatchObject({ expectedRevision: 3, command: { type: "guild.donate", amount: 10 } });
        expect(body.command).not.toHaveProperty("guildBalance");
        return new Response(JSON.stringify(guildResponse), { status: 200 });
      });
    const client = new AccountClient(fetchImpl as unknown as typeof fetch);
    await client.bootstrap();
    await client.bootstrapGuild();
    await expect(client.guildCommand({ type: "guild.donate", amount: 10 }, 3, crypto.randomUUID())).resolves.toMatchObject({ accepted: true });
  });
});
