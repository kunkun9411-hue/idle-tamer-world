import { describe, expect, it } from "vitest";

import { progressionLootDelta } from "./run-store";

describe("authoritative return settlement loot", () => {
  it("reports only additions and excludes rewards already waiting in the combat cache", () => {
    const before = {
      eggs: { mossbit: 4 },
      items: { training_data: 7, ether_dust: 2 },
      gems: { "common-crimson-triangle": 3 },
    };
    const after = {
      eggs: { mossbit: 5, pyrook: 2 },
      items: { training_data: 10, ether_dust: 2, incubator_charge: 1 },
      gems: { "common-crimson-triangle": 3, "common-azure-square": 2 },
    };

    expect(progressionLootDelta(before, after)).toEqual({
      eggs: 3,
      items: 4,
      gems: 2,
    });
  });

  it("uses the complete first cache batch as the delta when no rewards existed before", () => {
    expect(progressionLootDelta(null, {
      eggs: { mossbit: 1 },
      items: { training_data: 3 },
      gems: {},
    })).toEqual({
      eggs: 1,
      items: 3,
      gems: 0,
    });
  });
});
