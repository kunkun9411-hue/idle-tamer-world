import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState, createMonster } from "./rules";
import { loadGame, saveGame } from "./storage";

let values: Map<string, string>;

beforeEach(() => {
  values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe("save schema v8", () => {
  it("migrates a v3 roster without losing permanent progress", () => {
    const monster = createMonster("pyrook", 17, 2, 4);
    values.set("idle-tamer.save.v3", JSON.stringify({
      version: 3,
      playerName: "Archivtest",
      resources: { gold: 321, cores: 2 },
      pendingGold: 20,
      eggInventory: { mossbit: 2 },
      fragments: { pyrook: 7 },
      roster: [monster],
      activeMonsterUid: monster.uid,
      runVictories: 30,
      totalVictories: 82,
      prestigeCount: 1,
      eggPity: 3,
      research: { power: 2, vitality: 1, extraction: 0, incubation: 1 },
      claimedMilestones: [10],
      lastSavedAt: Date.now(),
    }));

    const loaded = loadGame();
    expect(loaded.migrated).toBe(true);
    expect(loaded.state.version).toBe(8);
    expect(loaded.state.roster[0]).toMatchObject({ definitionId: "pyrook", level: 17, hyperLevel: 4, evolution: "rookie" });
    expect(loaded.state.fragments.pyrook).toBe(7);
    expect(loaded.state.unlockedZoneIds).toEqual(["violet-rim", "glass-gardens", "obsidian-fjord"]);
    expect(loaded.state.profile).toEqual({ avatarId: "wanderer", frameId: "silver" });
    expect(loaded.state.activityCounters).toMatchObject({ victory: 82, hyper_up: 4, prestige: 1 });
    expect(loaded.state.objectivePeriods.dailyBaseline.victory).toBe(82);
    expect(values.has("idle-tamer.save.v8")).toBe(true);
  });

  it("renames v4 Ultra progress to Hyper progress and supplies Gem slots", () => {
    values.set("idle-tamer.save.v4", JSON.stringify({
      ...createInitialState(),
      version: 4,
      roster: [{ uid: "legacy", definitionId: "pyrook", level: 8, ultraLevel: 6, evolution: "evolved", generation: 1 }],
      activeMonsterUid: "legacy",
      gemInventory: undefined,
      pendingGems: undefined,
    }));
    const loaded = loadGame();
    expect(loaded.migrated).toBe(true);
    expect(loaded.state.roster[0]).toMatchObject({ hyperLevel: 6, evolution: "evolved", gemSlots: {} });
    expect(Object.values(loaded.state.gemInventory).reduce((sum, amount) => sum + amount, 0)).toBe(3);
    expect(loaded.state.activityCounters).toMatchObject({ hyper_up: 6, evolution: 1 });
  });

  it("migrates a v5 save into period-safe objective progress", () => {
    const state = createInitialState();
    const monster = createMonster("pyrook", 12, 1, 2);
    values.set("idle-tamer.save.v5", JSON.stringify({
      ...state,
      version: 5,
      roster: [monster],
      activeMonsterUid: monster.uid,
      runVictories: 27,
      totalVictories: 54,
      activityCounters: undefined,
      objectivePeriods: undefined,
      claimedObjectives: undefined,
    }));

    const loaded = loadGame();
    expect(loaded.migrated).toBe(true);
    expect(loaded.state.version).toBe(8);
    expect(loaded.state.activityCounters).toMatchObject({ victory: 54, level_up: 11, hyper_up: 2 });
    expect(loaded.state.objectivePeriods.dailyBaseline.victory).toBe(54);
    expect(loaded.state.claimedObjectives).toEqual([]);
  });

  it("preserves v6 objective claims while adding expedition slots", () => {
    const state = createInitialState();
    values.set("idle-tamer.save.v6", JSON.stringify({
      ...state,
      version: 6,
      claimedObjectives: ["permanent:achievement-evolution"],
      activityCounters: { ...state.activityCounters, evolution: 1 },
      expeditions: undefined,
    }));

    const loaded = loadGame();
    expect(loaded.migrated).toBe(true);
    expect(loaded.state.version).toBe(8);
    expect(loaded.state.claimedObjectives).toEqual(["permanent:achievement-evolution"]);
    expect(loaded.state.activityCounters.evolution).toBe(1);
    expect(loaded.state.activityCounters.expedition_complete).toBe(0);
    expect(loaded.state.expeditions).toEqual([]);
  });

  it("keeps v7 expeditions and adds completed onboarding defaults", () => {
    const state = createInitialState();
    const worker = createMonster("voltfin");
    values.set("idle-tamer.save.v7", JSON.stringify({
      ...state,
      version: 7,
      roster: [worker],
      activeMonsterUid: "",
      expeditions: [{ id: "running", slot: 1, definitionId: "rim-signal-sweep", monsterUid: worker.uid, startedAt: 10, completesAt: 20, rewardMultiplier: 1.3 }],
      settings: undefined,
      tutorialStep: undefined,
      claimedSystemMessages: undefined,
    }));

    const loaded = loadGame();
    expect(loaded.state.version).toBe(8);
    expect(loaded.state.expeditions).toHaveLength(1);
    expect(loaded.state.settings.numberFormat).toBe("compact");
    expect(loaded.state.tutorialStep).toBe(4);
    expect(loaded.state.claimedSystemMessages).toEqual([]);
  });

  it("caps offline progress at the available cache capacity", () => {
    const state = createInitialState();
    const monster = createMonster("mossbit");
    state.roster.push(monster);
    state.activeMonsterUid = monster.uid;
    state.cacheSlotsUsed = 89;
    state.lastSavedAt = Date.now() - 24 * 60 * 60 * 1_000;
    saveGame(state);
    const stored = JSON.parse(values.get("idle-tamer.save.v8") ?? "{}");
    stored.lastSavedAt = Date.now() - 24 * 60 * 60 * 1_000;
    values.set("idle-tamer.save.v8", JSON.stringify(stored));

    const loaded = loadGame();
    expect(loaded.offlineSlots).toBe(1);
    expect(loaded.state.cacheSlotsUsed).toBe(90);
    expect(loaded.offlineSeconds).toBe(8 * 60 * 60);
  });

  it("consumes an offline window immediately and cannot reward a fast reload twice", () => {
    const state = createInitialState();
    const monster = createMonster("pyrook");
    state.roster.push(monster);
    state.activeMonsterUid = monster.uid;
    saveGame(state);
    const stored = JSON.parse(values.get("idle-tamer.save.v8") ?? "{}");
    stored.lastSavedAt = Date.now() - 10 * 60_000;
    values.set("idle-tamer.save.v8", JSON.stringify(stored));

    const first = loadGame();
    const firstPendingGold = first.state.pendingGold;
    const second = loadGame();
    expect(first.offlineSlots).toBe(2);
    expect(second.offlineSlots).toBe(0);
    expect(second.state.pendingGold).toBe(firstPendingGold);
  });
});
