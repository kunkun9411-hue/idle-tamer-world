import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";
import { openCombatArea } from "./helpers/combat-navigation";

test("1024px shell keeps the complete player card separate from primary navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1_024, height: 768 });
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 22, 4, 0, "rookie", () => "tablet-shell-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  state.resources.gold = 193_822;
  state.resources.cores = 26;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  await openCombatArea(page, '[data-view="research"]');
  await expect(page.locator(".app-shell--research")).toBeVisible();

  const card = page.locator(".topbar__account .player-account-card");
  await expect(card.locator(".player-account-card__identity > strong")).toBeVisible();
  await expect(card.locator(".player-account-card__metric")).toHaveCount(3);
  const geometry = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>(".topbar__account .player-account-card")!.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>(".main-nav")!;
    const navRect = nav.getBoundingClientRect();
    const buttons = [...nav.querySelectorAll<HTMLElement>(".nav-button")].map((button) => {
      const rect = button.getBoundingClientRect();
      const label = button.querySelector<HTMLElement>("b");
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        labelVisible: Boolean(label && label.getBoundingClientRect().width > 0),
      };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      position: getComputedStyle(nav).position,
      card: { left: card.left, right: card.right, top: card.top, bottom: card.bottom },
      nav: { left: navRect.left, right: navRect.right, top: navRect.top, bottom: navRect.bottom },
      scrollWidth: document.documentElement.scrollWidth,
      buttons,
    };
  });

  expect(geometry.position).toBe("static");
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.card.left).toBeGreaterThanOrEqual(0);
  expect(geometry.card.right).toBeLessThanOrEqual(geometry.viewport.width);
  expect(geometry.nav.left).toBeGreaterThanOrEqual(0);
  expect(geometry.nav.right).toBeLessThanOrEqual(geometry.viewport.width);
  expect(geometry.nav.bottom).toBeLessThanOrEqual(130);
  expect(geometry.card.bottom).toBeLessThan(geometry.nav.top);
  expect(geometry.buttons).toHaveLength(8);
  for (const button of geometry.buttons) {
    expect(button.left).toBeGreaterThanOrEqual(0);
    expect(button.right).toBeLessThanOrEqual(geometry.viewport.width);
    expect(button.top).toBeGreaterThanOrEqual(geometry.nav.top - 1);
    expect(button.bottom).toBeLessThanOrEqual(geometry.nav.bottom + 1);
    expect(button.labelVisible).toBe(true);
  }
});
