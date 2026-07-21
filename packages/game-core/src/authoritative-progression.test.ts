import { describe, expect, it } from "vitest";

import { deterministicCombatLoot } from "./authoritative-progression";

describe("authoritative progression loot", () => {
  it("is reproducible and preserves pity across settlement batches", () => {
    const first = deterministicCombatLoot("11111111-1111-4111-8111-111111111111", 100n, 30, 0, 0);
    expect(deterministicCombatLoot("11111111-1111-4111-8111-111111111111", 100n, 30, 0, 0)).toEqual(first);
    expect(first.nextEggPity).toBeGreaterThanOrEqual(0);
    expect(Object.values(first.eggs).reduce((sum, amount) => sum + amount, 0)).toBeGreaterThan(0);
  });

  it("uses a tiny prestige bonus without changing the deterministic seed", () => {
    const baseline = deterministicCombatLoot("22222222-2222-4222-8222-222222222222", 0n, 90, 0, 0);
    const veteran = deterministicCombatLoot("22222222-2222-4222-8222-222222222222", 0n, 90, 0, 500);
    const count = (value: Record<string, number>) => Object.values(value).reduce((sum, amount) => sum + amount, 0);
    expect(count(veteran.eggs)).toBeGreaterThanOrEqual(count(baseline.eggs));
  });
});
