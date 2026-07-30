import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

test("profile keeps avatar and frame selection as separate visible choices", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 1, 1, 0, "rookie", () => "profile-surface-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  if (await page.getByTestId("offline-report").count()) {
    await page.getByTestId("offline-collect").click();
  }
  await page.locator('.profile-chip[data-view="profile"]').last().click();
  await expect(page.locator(".profile-page")).toBeVisible();
  await expect(page.locator('.cosmetic-card[data-avatar="wanderer"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.frame-card[data-frame="silver"]')).toHaveClass(/is-selected/);
  await page.locator('.cosmetic-card[data-avatar="keeper"]').click();
  await page.locator('.frame-card[data-frame="violet"]').click();
  await expect(page.locator('.cosmetic-card[data-avatar="keeper"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.frame-card[data-frame="violet"]')).toHaveClass(/is-selected/);
  await expect(page.locator(".profile-hero")).toContainText("Archivhüterin");
  await page.locator('.main-nav [data-view="expedition"]').click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
});

test("guild surface explains the online requirement instead of rendering a dead panel", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await page.locator('.combat-rail [data-view="guild"]').click();
  await expect(page.locator(".guild-page")).toBeVisible();
  await expect(page.locator(".locked-callout")).toContainText("Für Gilden-DNA mit dem Spielserver verbinden");
  await expect(page.locator(".locked-callout")).toContainText("Gilden, Freunde und Chat");
  await expect(page.locator(".locked-callout [data-view=expedition]")).toBeVisible();
});
