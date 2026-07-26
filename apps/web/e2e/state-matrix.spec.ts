import { expect, test, type Page } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

const enterCombat = async (page: Page): Promise<void> => {
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
};

test("client state matrix exposes a recoverable path for every non-local state", async ({ page }) => {
  for (const state of ["loading", "offline", "error", "conflict"] as const) {
    await page.goto(`/?ui-state=${state}`);
    await expect(page.getByTestId(`client-${state === "loading" ? "loading" : state}`)).toBeVisible();
    if (state === "loading") continue;
    await page.locator("#client-state-action").click();
    await expect(page.getByTestId("login-screen")).toBeVisible();
    await expect(page).not.toHaveURL(/ui-state/);
  }
});

test("empty collection and locked prestige states stay explicit", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 1, 1, 0, "rookie", () => "state-matrix-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  state.highestZoneNumber = 1;
  state.pendingGold = 0;
  state.pendingEggs = [];
  state.pendingFinds = [];
  state.eggInventory = {};

  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await enterCombat(page);

  await page.locator('[data-view="incubation"]').first().click();
  await expect(page.getByText("Noch keine Eier im Inventar")).toBeVisible();
  await page.locator('[data-view="habitat"]').first().click();
  await expect(page.getByText("Unbekannte Resonanz")).toBeVisible();
  await page.locator('[data-view="expedition"]').first().click();
  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator("#start-prestige").click();
  await expect(page.getByTestId("prestige-scene")).toBeVisible();
  await expect(page.locator("#confirm-prestige")).toBeDisabled();
  await expect(page.locator("#confirm-prestige")).toHaveText("PRESTIGE AB ZONE 10");
});
