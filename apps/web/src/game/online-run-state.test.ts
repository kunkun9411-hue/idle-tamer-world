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
});

describe("online run state boundary", () => {
  it("updates only run values and preserves local permanent collection state", () => {
    const state = createInitialState();
    const monster = createMonster("pyrook");
    monster.hyperLevel = 7;
    monster.evolution = "evolved";
    monster.gemSlots.triangle = "common-crimson-triangle";
    state.roster = [monster];
    state.activeMonsterUid = monster.uid;

    applyAuthoritativeRunSnapshot(state, snapshot());

    expect(monster).toMatchObject({ level: 4, hyperLevel: 7, evolution: "evolved", gemSlots: { triangle: "common-crimson-triangle" } });
    expect(state).toMatchObject({ resources: { gold: 83 }, pendingGold: 26, cacheSlotsUsed: 2, runVictories: 2 });
  });

  it("repairs a foundation Gem orphaned by the former online snapshot bug", () => {
    const state = createInitialState();
    const monster = createMonster("pyrook");
    state.roster = [monster];
    state.activeMonsterUid = monster.uid;
    state.activityCounters.gem_equip = 1;
    state.gemInventory["common-crimson-triangle"] = 0;

    applyAuthoritativeRunSnapshot(state, snapshot());

    expect(state.gemInventory["common-crimson-triangle"]).toBe(1);
  });

  it("uses rookie stats in the server-authoritative fight without mutating the collection", () => {
    const monster = createMonster("pyrook");
    monster.hyperLevel = 5;
    monster.evolution = "evolved";
    monster.gemSlots.square = "common-azure-square";

    const combatMonster = combatMonsterForAuthority(monster, true);

    expect(combatMonster).toMatchObject({ hyperLevel: 0, evolution: "rookie", gemSlots: {} });
    expect(monster).toMatchObject({ hyperLevel: 5, evolution: "evolved", gemSlots: { square: "common-azure-square" } });
  });
});
