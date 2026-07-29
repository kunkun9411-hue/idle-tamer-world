import { describe, expect, it } from "vitest";

import { TEST_CHEST_REWARD, testChestOpenResult, testChestPresentation } from "./test-chest";

describe("test chest player feedback", () => {
  it("credits and consumes the chest in a local prototype", () => {
    expect(testChestOpenResult(false)).toEqual({
      consumeChest: true,
      creditRewards: true,
      title: "Ether-Truhe geöffnet",
      message: `+${TEST_CHEST_REWARD.gold} Gold und +${TEST_CHEST_REWARD.itemAmount} Etherstaub wurden deinem Inventar gutgeschrieben.`,
      tone: "success",
    });
    expect(testChestPresentation(false).actionLabel).toBe("ÖFFNEN");
  });

  it("keeps the online chest intact and labels the action as a non-booking preview", () => {
    expect(testChestOpenResult(true)).toMatchObject({
      consumeChest: false,
      creditRewards: false,
      title: "Truhenvorschau",
      tone: "violet",
    });
    expect(testChestOpenResult(true).message).toContain("nichts von deinem Online-Konto");
    expect(testChestPresentation(true)).toMatchObject({
      actionLabel: "VORSCHAU",
      detail: "Keine Kontobuchung im Online-Modus",
    });
  });
});
