import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

test("starter flow and combat HUD fit the configured viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("starter-dialog")).toBeVisible();
  await page.getByTestId("starter-pyrook").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.innerWidth + 1);

  const selectors = [".fighter--player", ".fighter--enemy", ".combat-rail", ".combat-control-dock"];
  const boxes = await page.evaluate((targets) => Object.fromEntries(targets.map((selector) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    return [selector, rect ? { x: rect.x, width: rect.width, height: rect.height } : null];
  })), selectors);
  for (const selector of selectors) {
    const box = boxes[selector];
    expect(box, `${selector} needs a visible box`).not.toBeNull();
    expect(box!.height, `${selector} must occupy visible space`).toBeGreaterThan(0);
    expect(box!.x, `${selector} starts inside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width, `${selector} ends inside the viewport`).toBeLessThanOrEqual(layout.innerWidth + 1);
  }

  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator("#start-prestige").click();
  await expect(page.getByTestId("prestige-scene")).toBeVisible();
  await expect(page.getByTestId("prestige-crystal").locator("img")).toBeVisible();
  const prestigeLayout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(prestigeLayout.documentWidth).toBeLessThanOrEqual(prestigeLayout.innerWidth + 1);
  expect(prestigeLayout.bodyWidth).toBeLessThanOrEqual(prestigeLayout.innerWidth + 1);
});

test("generated login and offline chrome stay inside the configured viewport", async ({ page }) => {
  const state = createInitialState(() => Date.now() - 10 * 60_000);
  const starter = createMonster("pyrook", 5, 0, 0, "rookie", () => "responsive-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.pendingGold = 120;
  state.cacheSlotsUsed = 1;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });
  await page.goto("/");

  const loginLayout = await page.locator(".login-panel").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(loginLayout.left).toBeGreaterThanOrEqual(-1);
  expect(loginLayout.right).toBeLessThanOrEqual(loginLayout.viewportWidth + 1);
  expect(loginLayout.top).toBeGreaterThanOrEqual(-1);
  expect(loginLayout.bottom).toBeLessThanOrEqual(loginLayout.viewportHeight + 1);

  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("offline-report")).toBeVisible();
  const offlineLayout = await page.getByTestId("offline-report").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(offlineLayout.left).toBeGreaterThanOrEqual(-1);
  expect(offlineLayout.right).toBeLessThanOrEqual(offlineLayout.viewportWidth + 1);
  expect(offlineLayout.top).toBeGreaterThanOrEqual(-1);
  expect(offlineLayout.bottom).toBeLessThanOrEqual(offlineLayout.viewportHeight + 1);

  const actionLayout = await page.locator(".offline-report__actions").evaluate((element) => {
    const buttons = [...element.querySelectorAll("button")];
    return buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      const content = document.createRange();
      content.selectNodeContents(button);
      const contentRect = content.getBoundingClientRect();
      return { width: rect.width, left: rect.left, right: rect.right, contentLeft: contentRect.left, contentRight: contentRect.right };
    });
  });
  expect(actionLayout).toHaveLength(2);
  for (const button of actionLayout) {
    expect(button.width).toBeLessThanOrEqual(211);
    expect(button.contentLeft).toBeGreaterThanOrEqual(button.left);
    expect(button.contentRight).toBeLessThanOrEqual(button.right);
  }
});
