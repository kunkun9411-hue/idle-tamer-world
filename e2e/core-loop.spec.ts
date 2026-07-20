import { expect, test, type Page } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

const skipTutorialIfVisible = async (page: Page): Promise<void> => {
  const skip = page.locator("#skip-tutorial");
  if (await skip.count()) await skip.click();
};

test("fresh account reaches starter choice and the focused auto battle", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("login-screen")).toBeVisible();
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("starter-dialog")).toBeVisible();
  await page.getByTestId("starter-pyrook").click();
  await expect(page.getByTestId("offline-report")).toBeVisible();
  await page.locator("#offline-continue").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await expect(page.getByText("Violetter Saum").first()).toBeVisible();
});

test("loading and revision-conflict states are visible and recoverable", async ({ page }) => {
  await page.goto("/?ui-state=loading");
  await expect(page.getByTestId("client-loading")).toBeVisible();
  await page.goto("/?ui-state=conflict");
  await expect(page.getByTestId("client-conflict")).toContainText("Neuerer Spielstand gefunden");
  await page.locator("#client-state-action").click();
  await expect(page.getByTestId("login-screen")).toBeVisible();
  await expect(page).not.toHaveURL(/ui-state/);
});

test("offline claim to hatch, permanent upgrades and Prestige remains consistent", async ({ page }) => {
  const state = createInitialState(() => Date.now() - 10 * 60_000);
  const starter = createMonster("pyrook", 20, 1, 0, "rookie", () => "e2e-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.resources.gold = 1_000;
  state.pendingGold = 144;
  state.cacheSlotsUsed = 1;
  state.eggInventory.pyrook = 2;
  state.fragments.pyrook = 40;
  state.inventory.evolution_core = 3;
  state.inventory.incubator_charge = 5;
  state.runVictories = 100;
  state.totalVictories = 100;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("offline-report")).toBeVisible();
  await page.getByTestId("offline-collect").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await skipTutorialIfVisible(page);

  await page.locator('[data-view="incubation"]').first().click();
  await page.locator('[data-incubate="pyrook"]').click();
  await expect(page.getByText("RESONANZAUFBAU")).toBeVisible();
  for (let charge = 0; charge < 5; charge += 1) await page.locator("#accelerate-incubation").click();
  await expect(page.locator("#hatch-egg")).toBeEnabled();
  await page.locator("#hatch-egg").click();
  await expect(page.getByText("Fragmente gewonnen")).toBeVisible();

  await page.locator('[data-view="habitat"]').first().click();
  await page.locator('[data-hyper="e2e-pyrook"]').click();
  await page.locator('[data-evolve="e2e-pyrook"]').click();
  await page.locator('[data-equip-gem][data-monster="e2e-pyrook"]').first().click();

  await page.locator('[data-view="expedition"]').first().click();
  await page.locator('[data-combat-panel="missions"]').click();
  await expect(page.locator("#start-prestige")).toBeVisible();
  await page.locator("#start-prestige").click();
  await page.locator("#confirm-prestige").click();
  await expect(page.getByText("Neue Zeitlinie gestartet")).toBeVisible({ timeout: 5_000 });

  const persisted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), STORAGE_KEY) as typeof state;
  expect(persisted.prestigeCount).toBe(1);
  expect(persisted.runVictories).toBe(0);
  expect(persisted.roster[0]).toMatchObject({ level: 1, hyperLevel: 1, evolution: "evolved" });
  expect(Object.keys(persisted.roster[0].gemSlots)).toContain("triangle");
});
