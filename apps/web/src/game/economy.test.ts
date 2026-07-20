import { beforeEach, describe, expect, it, vi } from "vitest";
import { CRAFTING_RECIPES } from "./crafting";
import { EXPEDITIONS } from "./expeditions";
import { LocalGameService } from "./game-service";
import { createInitialState } from "./rules";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe("economy and release invariants", () => {
  it("ships only positive deterministic crafting and expedition definitions", () => {
    expect(new Set(CRAFTING_RECIPES.map((recipe) => recipe.id)).size).toBe(CRAFTING_RECIPES.length);
    expect(CRAFTING_RECIPES.every((recipe) => recipe.goldCost >= 0 && recipe.output.amount > 0)).toBe(true);
    expect(CRAFTING_RECIPES.every((recipe) => Object.values(recipe.itemCosts).every((amount) => (amount ?? 0) > 0))).toBe(true);
    expect(new Set(EXPEDITIONS.map((expedition) => expedition.id)).size).toBe(EXPEDITIONS.length);
    expect(EXPEDITIONS.every((expedition) => expedition.durationMs > 0 && expedition.reward.gold > 0 && expedition.minimumLevel > 0)).toBe(true);
  });

  it("survives three complete Prestige runs without losing permanent totals", () => {
    const state = createInitialState();
    const service = new LocalGameService(state, () => 1);
    service.chooseStarter("pyrook");
    state.highestZoneNumber = 10;

    for (let run = 0; run < 3; run += 1) {
      for (let victory = 0; victory < 100; victory += 1) {
        service.recordVictory("flickerimp", 1);
        if (state.cacheSlotsUsed >= 80) service.collectCache();
      }
      expect(service.prestige()).toBe(1);
      expect(state.runVictories).toBe(0);
      expect(state.roster[0].level).toBe(1);
    }

    expect(state.totalVictories).toBe(300);
    expect(state.prestigeCount).toBe(3);
    expect(state.resources.cores).toBe(3);
    expect(Object.values(state.inventory).every((amount) => amount >= 0)).toBe(true);
    expect(Object.values(state.fragments).every((amount) => amount >= 0)).toBe(true);
  });
});
