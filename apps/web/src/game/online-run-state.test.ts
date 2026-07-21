import { describe, expect, it } from "vitest";

import type { AuthoritativeRunSnapshot } from "@idle-tamer/contracts";

import { createInitialState, createMonster } from "./rules";
import { applyAuthoritativeRunSnapshot, combatMonsterForAuthority } from "./online-run-state";

const snapshot = (): AuthoritativeRunSnapshot => ({
  revision: 3,
  serverTime: "2026-07-21T22:00:00.000Z",
  contentReleaseId: "foundation-1.0.0",
  balanceReleaseId: "low-numbers-1.0.0",
  gold: "83",
  pendingGold: "26",
  cacheSlotsUsed: 2,
  cacheCapacity: 90,
  activeMonster: { definitionId: "pyrook", level: 4 },
  currentZoneId: "violet-rim",
  unlockedZoneIds: ["violet-rim"],
  highestZoneNumber: 1,
  zoneProgress: { "violet-rim": { stage: 3, clears: "0" } },
  runVictories: "2",
  totalVictories: "2",
  progressionStatus: "fighting",
  nextCombatAt: "2026-07-21T22:00:07.000Z",
  collection: {
    roster: [{ uid: "11111111-1111-4111-8111-111111111111", definitionId: "pyrook", level: 4, hyperLevel: 7, evolution: "evolved", generation: 1, gemSlots: { triangle: "common-crimson-triangle" } }],
    activeMonsterUid: "11111111-1111-4111-8111-111111111111", supportMonsterUid: "",
    eggInventory: { mossbit: "1" }, fragments: { pyrook: "10" }, inventory: { training_data: "2", evolution_core: "0", incubator_charge: "1", ether_dust: "0" },
    gemInventory: { "common-crimson-triangle": "0" }, pendingEggs: [], pendingItems: { training_data: "0", evolution_core: "0", incubator_charge: "0", ether_dust: "0" }, pendingGems: [],
    incubation: null, expeditions: [], research: { power: 1, vitality: 0, extraction: 0, incubation: 0 }, prestigeCount: 2, cores: "3", eggPity: 1,
    claimedMilestones: [], activityCounters: { victory: 2, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 1, prestige: 0, expedition_start: 0, expedition_complete: 0 },
    objectivePeriods: { dailyKey: "2026-07-21", weeklyKey: "2026-W30", dailyBaseline: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 }, weeklyBaseline: { victory: 0, boss_victory: 0, cache_claim: 0, hatch: 0, monster_discovery: 0, level_up: 0, hyper_up: 0, evolution: 0, gem_equip: 0, prestige: 0, expedition_start: 0, expedition_complete: 0 } },
    claimedObjectives: [], settings: { soundEnabled: true, combatEffects: true, reducedMotion: false, numberFormat: "compact" }, tutorialStep: 0, claimedSystemMessages: [], lastServerSaveAt: "2026-07-21T22:00:00.000Z",
  },
});

describe("online run state boundary", () => {
  it("replaces local values with the complete authoritative collection", () => {
    const state = createInitialState();
    const monster = createMonster("pyrook");
    monster.hyperLevel = 7;
    monster.evolution = "evolved";
    monster.gemSlots.triangle = "common-crimson-triangle";
    state.roster = [monster];
    state.activeMonsterUid = monster.uid;

    applyAuthoritativeRunSnapshot(state, snapshot());

    expect(state.roster[0]).toMatchObject({ level: 4, hyperLevel: 7, evolution: "evolved", gemSlots: { triangle: "common-crimson-triangle" } });
    expect(state).toMatchObject({ resources: { gold: 83, cores: 3 }, pendingGold: 26, cacheSlotsUsed: 2, runVictories: 2, research: { power: 1 } });
  });

  it("treats the server Gem balance as canonical", () => {
    const state = createInitialState();
    const monster = createMonster("pyrook");
    state.roster = [monster];
    state.activeMonsterUid = monster.uid;
    state.activityCounters.gem_equip = 1;
    state.gemInventory["common-crimson-triangle"] = 0;

    applyAuthoritativeRunSnapshot(state, snapshot());

    expect(state.gemInventory["common-crimson-triangle"]).toBe(0);
  });

  it("uses permanent stats in the server-authoritative fight without cloning the collection", () => {
    const monster = createMonster("pyrook");
    monster.hyperLevel = 5;
    monster.evolution = "evolved";
    monster.gemSlots.square = "common-azure-square";

    const combatMonster = combatMonsterForAuthority(monster, true);

    expect(combatMonster).toBe(monster);
    expect(monster).toMatchObject({ hyperLevel: 5, evolution: "evolved", gemSlots: { square: "common-azure-square" } });
  });
});
