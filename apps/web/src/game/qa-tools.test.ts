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

    expect(state.roster).toHaveLength(2);
    expect(state.roster[0]).toMatchObject({ definitionId: "pyrook", level: 100, hyperLevel: 10 });
    expect(state.roster[1]).toMatchObject({ definitionId: "bramblet", level: 100, hyperLevel: 10 });
    expect(state.activeMonsterUid).toBe("qa-pyrook");
    expect(state.supportMonsterUid).toBe("");
    expect(state.resources.gold).toBe(1_000_100);
    expect(state.highestZoneNumber).toBe(10);
    expect(state.runVictories).toBe(100);
  });

  it("keeps the two-monster combat setup idempotent and both monsters available for team testing", () => {
    const state = createInitialState();
    applyQaPreset(state, "combat");
    const reserve = state.roster.find((monster) => monster.uid !== state.activeMonsterUid);
    expect(reserve).toBeDefined();

    state.supportMonsterUid = reserve!.uid;
    state.expeditions.push({
      id: "qa-running",
      slot: 1,
      definitionId: "rim-signal-sweep",
      monsterUid: reserve!.uid,
      startedAt: 100,
      completesAt: 200,
      rewardMultiplier: 1,
    });
    applyQaPreset(state, "combat");

    expect(state.roster).toHaveLength(2);
    expect(state.roster.map((monster) => monster.uid)).toEqual(["qa-pyrook", "qa-bramblet"]);
    expect(state.activeMonsterUid).toBe("qa-pyrook");
    expect(state.supportMonsterUid).toBe("");
    expect(state.expeditions).toHaveLength(0);
    expect(state.profile).toEqual({ avatarId: "wanderer", frameId: "silver" });
    expect(state.playerName).toBe("Tamer");
  });
});
