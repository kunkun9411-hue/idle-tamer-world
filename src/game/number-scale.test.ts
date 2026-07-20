import { describe, expect, it } from "vitest";

import { hyperLevelCost, levelCost } from "./rules";
import { costStepMultiplier, formatGameNumber, LOW_NUMBER_POLICY } from "./number-scale";

describe("low-number economy policy", () => {
  it("uses readable values until the scientific endgame threshold", () => {
    expect(formatGameNumber(9_999, "full")).toBe("9.999");
    expect(formatGameNumber(1_250_000, "compact").replace(/\s/g, " ")).toBe("1,3 Mio.");
    expect(formatGameNumber(999_999_999_999_999, "full")).not.toContain("e");
    expect(formatGameNumber(1_000_000_000_000_000, "full")).toBe("1e15");
    expect(formatGameNumber(1_250_000_000_000_000, "compact")).toBe("1,25e15");
  });

  it("keeps current upgrade steps far below an order-of-magnitude wall", () => {
    for (let level = 1; level < 10_000; level += 1) {
      expect(costStepMultiplier(levelCost(level), levelCost(level + 1))).toBeLessThanOrEqual(LOW_NUMBER_POLICY.preScientificMaxCostStepMultiplier);
    }
    for (let level = 0; level < 1_000; level += 1) {
      expect(costStepMultiplier(hyperLevelCost(level), hyperLevelCost(level + 1))).toBeLessThanOrEqual(LOW_NUMBER_POLICY.preScientificMaxCostStepMultiplier);
    }
    expect(levelCost(20)).toBeLessThan(LOW_NUMBER_POLICY.firstPrestigeTargetCeiling);
    expect(levelCost(10_000)).toBeLessThan(LOW_NUMBER_POLICY.earlyAccountTargetCeiling);
  });
});
