import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";
import { openCombatArea } from "./helpers/combat-navigation";

test("dispatch contracts stay content-dense without shrinking candidate actions", async ({ page }) => {
  const state = createInitialState();
  const front = createMonster("pyrook", 12, 1, 0, "rookie", () => "dispatch-front");
  const candidate = createMonster("mossbit", 12, 1, 0, "evolved", () => "dispatch-candidate");
  state.roster = [front, candidate];
  state.activeMonsterUid = front.uid;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  if (await page.getByTestId("offline-report").count()) {
    await page.getByTestId("offline-collect").click();
  }
  await openCombatArea(page, '[data-view="dispatch"]');

  const contracts = page.locator(".dispatch-contracts");
  const blockedCards = contracts.locator(".dispatch-contract:has(.dispatch-contract__blocked)");
  const candidateCards = contracts.locator(".dispatch-contract:has(.dispatch-candidates)");
  await expect(blockedCards).toHaveCount(4);
  await expect(candidateCards).toHaveCount(2);

  const blockedMetrics = await blockedCards.evaluateAll((cards) => cards.map((card) => {
    const cardRect = card.getBoundingClientRect();
    const rewardRect = card.querySelector<HTMLElement>(".dispatch-contract__reward")!.getBoundingClientRect();
    const blockedRect = card.querySelector<HTMLElement>(".dispatch-contract__blocked")!.getBoundingClientRect();
    return {
      height: cardRect.height,
      rewardToReason: blockedRect.top - rewardRect.bottom,
      trailingSpace: cardRect.bottom - blockedRect.bottom,
    };
  }));
  for (const metric of blockedMetrics) {
    expect(metric.height, "locked contract should remain content-close").toBeLessThanOrEqual(230);
    expect(metric.rewardToReason, "blocked reason should follow its reward").toBeLessThanOrEqual(24);
    expect(metric.rewardToReason).toBeGreaterThanOrEqual(0);
    expect(metric.trailingSpace, "blocked contract should not end in a blank band").toBeLessThanOrEqual(20);
  }

  const candidateMetrics = await candidateCards.evaluateAll((cards) => cards.map((card) => {
    const cardRect = card.getBoundingClientRect();
    const buttons = [...card.querySelectorAll<HTMLElement>(".dispatch-candidates > button")].map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });
    return { card: { left: cardRect.left, right: cardRect.right, top: cardRect.top, bottom: cardRect.bottom, height: cardRect.height }, buttons };
  }));
  for (const metric of candidateMetrics) {
    expect(metric.card.height, "candidate card keeps its established action area").toBeGreaterThanOrEqual(280);
    expect(metric.buttons.length).toBeGreaterThan(0);
    for (const button of metric.buttons) {
      expect(button.height).toBeGreaterThanOrEqual(53);
      expect(button.left).toBeGreaterThanOrEqual(metric.card.left);
      expect(button.right).toBeLessThanOrEqual(metric.card.right);
      expect(button.top).toBeGreaterThanOrEqual(metric.card.top);
      expect(button.bottom).toBeLessThanOrEqual(metric.card.bottom);
    }
  }

  const layout = await contracts.evaluate((element) => {
    const cards = [...element.querySelectorAll<HTMLElement>(".dispatch-contract")];
    const columns = new Set(cards.map((card) => Math.round(card.getBoundingClientRect().left)));
    return {
      viewportWidth: innerWidth,
      columns: columns.size,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.columns).toBe(layout.viewportWidth > 760 ? 2 : 1);
});
