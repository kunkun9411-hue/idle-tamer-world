import { expect, test } from "@playwright/test";

import { RESEARCH } from "../src/game/progression";
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
  await expect(page.locator('.cosmetic-card[data-avatar="wanderer"] .cosmetic-avatar img')).toHaveAttribute("src", /pyrook_idle_right\.png$/);
  await expect(page.locator(".profile-hero .account-avatar img")).toHaveAttribute("src", /pyrook_idle_right\.png$/);
  await expect(page.locator(".profile-page .cosmetic-avatar i")).toHaveCount(0);
  await expect(page.locator('.frame-card[data-frame="silver"]')).toHaveClass(/is-selected/);
  await page.locator('.cosmetic-card[data-avatar="keeper"]').click();
  await page.locator('.frame-card[data-frame="violet"]').click();
  await expect(page.locator('.cosmetic-card[data-avatar="keeper"]')).toHaveClass(/is-selected/);
  await expect(page.locator(".profile-hero .account-avatar img")).toHaveAttribute("src", /nyxlet_idle_right\.png$/);
  await expect(page.locator('.frame-card[data-frame="violet"]')).toHaveClass(/is-selected/);
  await expect(page.locator(".profile-hero")).toContainText("Archivhüterin");
  await page.locator('.main-nav [data-view="expedition"]').click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await expect(page.locator(".player-account-card .account-avatar img")).toHaveAttribute("src", /nyxlet_idle_right\.png$/);
});

test("guild surface explains the online requirement instead of rendering a dead panel", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await page.locator('.combat-rail [data-view="guild"]').click();
  await expect(page.locator(".guild-page")).toBeVisible();
  await expect(page.locator(".guild-page")).toContainText("DERZEIT NICHT VERFÜGBAR");
  await expect(page.locator(".locked-callout")).toContainText("Gildenbereich derzeit nicht verfügbar");
  await expect(page.locator(".locked-callout")).toContainText("Gilden, Freunde und Chat");
  await expect(page.locator(".locked-callout [data-view=expedition]")).toBeVisible();
  await expect(page.locator(".guild-page")).not.toContainText(/UI-Test|Spielserver|Onlineserver|serverautoritativ|PostgreSQL/iu);
});

test("research cards distinguish ready, insufficient and maximal core states", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 1, 1, 0, "rookie", () => "research-surface-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  state.resources.cores = 1;
  state.research.power = RESEARCH.find((entry) => entry.id === "power")?.maxLevel ?? 10;
  state.research.vitality = 2;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  await page.locator('.combat-rail [data-view="research"]').click();
  await expect(page.locator(".research-grid")).toBeVisible();

  const maximal = page.locator('[data-research-card="power"]');
  await expect(maximal).toHaveAttribute("data-research-state", "max");
  await expect(maximal.locator("button")).toHaveText("MAXIMAL");

  const insufficient = page.locator('[data-research-card="vitality"]');
  await expect(insufficient).toHaveAttribute("data-research-state", "insufficient");
  await expect(insufficient.locator("button")).toBeDisabled();
  await expect(insufficient.locator("button")).toHaveText("ZU WENIG KERNE · 2 KERNE KOSTEN · 1 KERN BESITZ");

  const ready = page.locator('[data-research-card="extraction"]');
  await expect(ready).toHaveAttribute("data-research-state", "ready");
  await expect(ready.locator("button")).toBeEnabled();
  await expect(ready.locator("button")).toHaveText("ERFORSCHEN · 1 KERN KOSTEN · 1 KERN BESITZ");

  const nonMaximal = page.locator('.research-card:not([data-research-state="max"])');
  const nonMaximalCount = await nonMaximal.count();
  for (let index = 0; index < nonMaximalCount; index += 1) {
    await expect(nonMaximal.nth(index).locator("button")).toContainText("KOSTEN");
    await expect(nonMaximal.nth(index).locator("button")).toContainText("BESITZ");
  }
  await expect(page.locator(".research-page, .app-shell--research")).not.toContainText(/\bP\b/u);
});
