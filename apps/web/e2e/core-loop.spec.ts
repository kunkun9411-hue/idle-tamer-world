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
  await expect(page.locator('img[alt="Idle Tamer World"]').first()).toBeVisible();
  await expect(page.locator(".login-panel__generated-frame")).toHaveAttribute("src", "/assets/ui/chrome/panel-frame-v1.webp");
  await expect(page.locator(".login-panel__divider")).toHaveAttribute("src", "/assets/ui/chrome/ether-divider-v1.webp");
  await expect(page.getByTestId("login-submit")).toHaveCSS("background-image", /primary-button-frame-v1\.webp/);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("starter-dialog")).toBeVisible();
  await page.getByTestId("starter-pyrook").click();
  await expect(page.getByTestId("offline-report")).toHaveCount(0);
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await expect(page.getByText("Violetter Saum").first()).toBeVisible();
  await expect(page.getByTestId("qa-panel")).toHaveCount(0);
});

test("combat controls stay mounted and the first click opens its panel", async ({ page }) => {
  const state = createInitialState();
  const starter = createMonster("pyrook", 8, 1, 0, "rookie", () => "stable-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.pendingGold = 50;
  state.cacheSlotsUsed = 1;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await page.getByTestId("offline-collect").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const replacements = await page.evaluate(async () => {
    let control = document.querySelector('[data-combat-panel="loot"]');
    let replacementCount = 0;
    for (let sample = 0; sample < 20; sample += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      const current = document.querySelector('[data-combat-panel="loot"]');
      if (current !== control) replacementCount += 1;
      control = current;
    }
    return replacementCount;
  });
  expect(replacements).toBe(0);

  await page.locator('[data-combat-panel="loot"]').click();
  await expect(page.locator(".combat-panel--loot")).toHaveClass(/is-open/);
  await expect(page.locator("#collect-cache")).toBeEnabled();
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

test("Prestige remains locked before zone 10 even after 500 run victories", async ({ page }) => {
  const state = createInitialState();
  const starter = createMonster("pyrook", 5, 1, 0, "rookie", () => "zone-gate-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.runVictories = 500;
  state.totalVictories = 500;
  state.highestZoneNumber = 9;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await page.getByTestId("offline-collect").click();
  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator("#start-prestige").click();

  await expect(page.getByTestId("prestige-scene")).toBeVisible();
  await expect(page.getByTestId("prestige-crystal").locator("img")).toHaveAttribute("src", "/assets/prestige/ether-crystal-v2.png");
  await expect(page.getByTestId("prestige-backdrop")).toHaveCSS("background-image", /prestige-sanctum-v2\.webp/);
  await expect(page.getByText("ZONE 9 / 10")).toBeVisible();
  await expect(page.locator("#confirm-prestige")).toBeDisabled();
  await expect(page.locator("#confirm-prestige")).toHaveText("PRESTIGE AB ZONE 10");
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
  state.highestZoneNumber = 10;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("offline-report")).toBeVisible();
  await expect(page.locator(".offline-report__generated-frame")).toHaveAttribute("src", "/assets/ui/chrome/panel-frame-v1.webp");
  await expect(page.locator(".offline-report__divider")).toHaveAttribute("src", "/assets/ui/chrome/ether-divider-v1.webp");
  await expect(page.locator(".offline-report__actions button")).toHaveCount(1);
  await expect(page.locator("#offline-continue")).toHaveCount(0);
  await expect(page.getByTestId("offline-collect")).toHaveCSS("background-image", /primary-button-frame-v1\.webp/);
  await expect(page.getByTestId("offline-collect")).toHaveCSS("box-shadow", "none");
  expect(await page.getByTestId("offline-collect").evaluate((element) => getComputedStyle(element, "::after").display)).toBe("none");
  await page.keyboard.press("Tab");
  const collectFocus = await page.getByTestId("offline-collect").evaluate((element) => {
    const style = getComputedStyle(element);
    return { isFocusVisible: element.matches(":focus-visible"), outline: style.outlineStyle, filter: style.filter };
  });
  expect(collectFocus.isFocusVisible).toBe(true);
  expect(collectFocus.outline).toBe("none");
  expect(collectFocus.filter).toContain("drop-shadow");
  await page.getByTestId("offline-collect").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await skipTutorialIfVisible(page);

  await page.locator('[data-view="incubation"]').first().click();
  await page.locator('[data-incubate="pyrook"]').click();
  await expect(page.getByText("RESONANZAUFBAU")).toBeVisible();
  for (let charge = 0; charge < 5; charge += 1) {
    await page.locator("#accelerate-incubation").click();
    await page.waitForTimeout(320);
  }
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
  await expect(page.getByTestId("prestige-scene")).toBeVisible();
  await expect(page.getByTestId("prestige-crystal").locator("img")).toBeVisible();
  await page.locator("#confirm-prestige").click();
  await expect(page.getByTestId("prestige-scene")).toHaveClass(/is-activating/);
  await expect(page.getByText("Neue Zeitlinie gestartet")).toBeVisible({ timeout: 5_000 });

  const persisted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), STORAGE_KEY) as typeof state;
  expect(persisted.prestigeCount).toBe(1);
  expect(persisted.runVictories).toBe(0);
  expect(persisted.roster[0]).toMatchObject({ level: 1, hyperLevel: 1, evolution: "evolved" });
  expect(Object.keys(persisted.roster[0].gemSlots)).toContain("triangle");
});
