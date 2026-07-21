import { describe, expect, it } from "vitest";

import { AUTHORITATIVE_CACHE_CAPACITY, authoritativeBattleOutcome, runLevelCost, settleAuthoritativeRun, type AuthoritativeRunState } from "./authoritative-run";

const run = (overrides: Partial<AuthoritativeRunState> = {}): AuthoritativeRunState => ({
  activeMonsterDefinitionId: "pyrook",
  activeMonsterLevel: 1,
  currentZoneId: "violet-rim",
  highestZoneNumber: 1,
  zoneProgress: { "violet-rim": { stage: 1, clears: "0" } },
  runVictories: 0n,
  totalVictories: 0n,
  progressionStatus: "fighting",
  nextCombatAtMs: 1_000,
  ...overrides,
});

describe("authoritative run simulation", () => {
  it("uses only server-owned level, zone and time to produce rewards", () => {
    const outcome = authoritativeBattleOutcome(run());
    const result = settleAuthoritativeRun(run(), 1_000 + outcome.durationMs * 2, AUTHORITATIVE_CACHE_CAPACITY);
    expect(result.victoriesAdded).toBeGreaterThan(0);
    expect(result.goldAdded).toBeGreaterThan(0n);
    expect(result.state.runVictories).toBe(BigInt(result.victoriesAdded));
  });

  it("never produces more victories than free cache slots", () => {
    const result = settleAuthoritativeRun(run(), 24 * 60 * 60 * 1_000, 3);
    expect(result.victoriesAdded).toBe(3);
    expect(result.state.progressionStatus).toBe("cache_full");
  });

  it("blocks an under-levelled monster at an unbeatable boss without a reward", () => {
    const state = run({ zoneProgress: { "violet-rim": { stage: 10, clears: "0" } } });
    expect(authoritativeBattleOutcome(state).wins).toBe(false);
    const result = settleAuthoritativeRun(state, 1_000, 10);
    expect(result).toMatchObject({ victoriesAdded: 0, goldAdded: 0n });
    expect(result.state.progressionStatus).toBe("blocked");
  });

  it("keeps level prices exact as bigint", () => {
    expect(runLevelCost(1)).toBe(40n);
    expect(runLevelCost(1_000_000)).toBe(16_000_024n);
  });
});
