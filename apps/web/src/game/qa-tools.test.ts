import { describe, expect, it } from "vitest";

import { ZONES } from "./catalog";
import { applyQaPreset, unlockThroughZone } from "./qa-tools";
import { createInitialState } from "./rules";

describe("local QA presets", () => {
  it("unlocks the real linear zone chain without inventing progress entries", () => {
    const state = createInitialState();
    unlockThroughZone(state, 10);

    expect(state.unlockedZoneIds).toEqual(ZONES.map((zone) => zone.id));
    expect(Object.keys(state.zoneProgress)).toEqual(ZONES.map((zone) => zone.id));
    expect(state.currentZoneId).toBe(ZONES[9].id);
    expect(state.highestZoneNumber).toBe(10);
  });

  it("prepares reproducible combat and Prestige states from a fresh save", () => {
    const state = createInitialState();
    applyQaPreset(state, "resources");
    applyQaPreset(state, "combat");
    applyQaPreset(state, "prestige");

    expect(state.roster).toHaveLength(1);
    expect(state.roster[0]).toMatchObject({ definitionId: "pyrook", level: 100, hyperLevel: 10 });
    expect(state.resources.gold).toBe(1_000_100);
    expect(state.highestZoneNumber).toBe(10);
    expect(state.runVictories).toBe(100);
  });
});
