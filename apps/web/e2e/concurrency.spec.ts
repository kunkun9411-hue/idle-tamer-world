import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

test("an external tab update blocks stale autosaves and reloads the latest state", async ({ context, page }) => {
  const state = createInitialState();
  const starter = createMonster("pyrook", 8, 0, 0, "rookie", () => "parallel-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await page.locator("#offline-continue").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const secondTab = await context.newPage();
  await secondTab.goto("/roadmap/");
  await secondTab.evaluate((key) => {
    const latest = JSON.parse(localStorage.getItem(key) ?? "{}");
    latest.resources.gold = 9_876;
    latest.lastSavedAt += 1;
    localStorage.setItem(key, JSON.stringify(latest));
  }, STORAGE_KEY);

  await expect(page.getByTestId("client-conflict")).toContainText("Neuerer Spielstand gefunden");
  await page.locator("#client-state-action").click();
  await expect(page.getByTestId("login-screen")).toBeVisible();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").resources?.gold, STORAGE_KEY)).toBe(9_876);
});
