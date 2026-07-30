import { expect, test, type Page } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

const viewports = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const openHabitat = async (page: Page): Promise<void> => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 1, 1, 0, "rookie", () => "habitat-empty-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await page.locator('.combat-rail [data-monster-toggle]').click();
  await page.locator('.combat-monster-modal__footer [data-view="habitat"]').click();
  await expect(page.locator(".habitat-page")).toBeVisible();
};

for (const viewport of viewports) {
  test(`compact habitat discovery path stays usable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openHabitat(page);

    const emptyState = page.locator(".habitat-empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("Finde Eier auf Expeditionen");
    await expect(emptyState.locator('[data-view="incubation"]')).toBeVisible();
    await expect(emptyState.locator('[data-view="dispatch"]')).toBeVisible();

    const box = await emptyState.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(220);
    expect(box?.height).toBeLessThanOrEqual(260);
    expect(await page.locator("html").evaluate((root) => root.scrollWidth <= root.clientWidth + 1)).toBe(true);
    if (viewport.name === "mobile") {
      for (const action of await emptyState.locator("button").all()) {
        expect((await action.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      }
    }

    await emptyState.locator('[data-view="incubation"]').click();
    await expect(page.getByRole("heading", { name: "Ether-Brutstation" })).toBeVisible();
    await page.locator('.main-nav [data-view="habitat"]').click();
    await page.locator(".habitat-empty-state [data-view=dispatch]").click();
    await expect(page.getByRole("heading", { name: "Monster-Expeditionen" })).toBeVisible();
  });
}
