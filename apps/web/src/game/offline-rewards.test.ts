import { describe, expect, it } from "vitest";

import type { AuthoritativeRunSnapshot } from "@idle-tamer/contracts";

import { authoritativeCacheHasRewards, returnReportActivity, shouldShowOfflineReport } from "./offline-rewards";

const snapshot = (overrides: Partial<AuthoritativeRunSnapshot> = {}): AuthoritativeRunSnapshot => ({
  revision: 3,
  serverTime: "2026-07-29T20:00:00.000Z",
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
  nextCombatAt: "2026-07-29T20:00:07.000Z",
  collection: {
    roster: [],
    activeMonsterUid: "",
    supportMonsterUid: "",
    eggInventory: {},
    fragments: {},
    inventory: { training_data: "0", evolution_core: "0", incubator_charge: "0", ether_dust: "0" },
    gemInventory: {},
    pendingEggs: [],
    pendingItems: { training_data: "0", evolution_core: "0", incubator_charge: "0", ether_dust: "0" },
    pendingGems: [],
    incubation: null,
    expeditions: [],
    research: { power: 0, vitality: 0, extraction: 0, incubation: 0 },
    prestigeCount: 0,
    cores: "0",
    eggPity: 0,
    claimedMilestones: [],
    activityCounters: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 },
    objectivePeriods: {
      dailyKey: "2026-07-29",
      weeklyKey: "2026-W31",
      dailyBaseline: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 },
      weeklyBaseline: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 },
    },
    claimedObjectives: [],
    settings: { soundEnabled: true, combatEffects: true, reducedMotion: false, numberFormat: "compact" },
    tutorialStep: 0,
    claimedSystemMessages: [],
    lastServerSaveAt: "2026-07-29T20:00:00.000Z",
  },
  ...overrides,
});

describe("offline return report authority", () => {
  it("does not offer an online claim from stale local offline progress", () => {
    const staleLocal = { offlineSeconds: 8 * 60 * 60, cacheSlotsUsed: 90, pendingGold: 1_080 };

    expect(shouldShowOfflineReport(true, staleLocal)).toBe(false);
    expect(shouldShowOfflineReport(true, staleLocal, snapshot())).toBe(false);
  });

  it("opens the online report only when the authoritative cache contains rewards", () => {
    const local = { offlineSeconds: 0, cacheSlotsUsed: 0, pendingGold: 0 };
    const emptySnapshot = snapshot();

    expect(shouldShowOfflineReport(true, local, snapshot({ pendingGold: "26", cacheSlotsUsed: 2 }))).toBe(true);
    expect(authoritativeCacheHasRewards(snapshot({
      collection: { ...emptySnapshot.collection, pendingItems: { ...emptySnapshot.collection.pendingItems, ether_dust: "1" } },
    }))).toBe(true);
  });

  it("keeps local prototype offline progress independent from the server snapshot", () => {
    expect(shouldShowOfflineReport(false, { offlineSeconds: 60, cacheSlotsUsed: 0, pendingGold: 0 })).toBe(true);
  });

  it("never presents stale browser offline values as server-authoritative rewards", () => {
    const local = { offlineSeconds: 8 * 60 * 60, offlineGold: 99_999, offlineSlots: 90, offlineItemCount: 44 };
    expect(returnReportActivity(true, local, {
      victoriesAdded: 2,
      goldAdded: "26",
      eggsAdded: 0,
      itemsAdded: 0,
      gemsAdded: 0,
    })).toEqual({
      authority: "server",
      durationSeconds: null,
      victoriesAdded: 2,
      goldAdded: 26,
      slotsAdded: 0,
      itemCountAdded: 0,
      eggsAdded: 0,
      gemsAdded: 0,
    });
    expect(returnReportActivity(false, local)).toEqual({
      authority: "local",
      durationSeconds: 8 * 60 * 60,
      victoriesAdded: 90,
      goldAdded: 99_999,
      slotsAdded: 90,
      itemCountAdded: 44,
      eggsAdded: 0,
      gemsAdded: 0,
    });
  });
});
