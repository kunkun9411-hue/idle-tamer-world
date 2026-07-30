import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

test("combat navigation separates battle tools from global destinations on phones", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 4, 1, 0, "rookie", () => "mobile-navigation-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) {
    await page.getByTestId("offline-collect").click();
  }
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const globalNav = page.getByRole("navigation", { name: "Spielbereiche" });
  const battleNav = page.getByRole("navigation", { name: "Kampfoptionen" });
  await expect(globalNav).toBeVisible();
  await expect(battleNav).toBeVisible();
  await expect(battleNav.locator("button")).toHaveCount(5);

  const viewport = page.viewportSize()!;
  const combatEntry = globalNav.locator('[data-view="expedition"]');
  if (viewport.width <= 520) {
    await expect(combatEntry).toBeHidden();
    await expect(globalNav.locator("button:visible")).toHaveCount(6);

    const layout = await page.evaluate(() => {
      const box = (selector: string): DOMRect =>
        document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      const rail = box(".combat-rail");
      const dock = box(".combat-control-dock");
      const visibleButtons = [...document.querySelectorAll<HTMLElement>(".combat-rail button, .combat-control-dock button")]
        .filter((button) => getComputedStyle(button).display !== "none")
        .map((button) => {
          const rect = button.getBoundingClientRect();
          const label = button.querySelector<HTMLElement>("span");
          const labelRect = label?.getBoundingClientRect();
          return {
            label: button.getAttribute("aria-label") ?? button.getAttribute("title"),
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            labelWidth: labelRect?.width ?? 0,
            labelHeight: labelRect?.height ?? 0,
          };
        });
      return {
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        rail: { left: rail.left, right: rail.right, top: rail.top, bottom: rail.bottom },
        dock: { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom },
        buttons: visibleButtons,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.dock.left).toBeGreaterThanOrEqual(0);
    expect(layout.dock.right).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.rail.left).toBeGreaterThanOrEqual(0);
    expect(layout.rail.right).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.rail.bottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.rail.top - layout.dock.bottom).toBeGreaterThanOrEqual(2);
    expect(layout.rail.top - layout.dock.bottom).toBeLessThanOrEqual(12);
    expect(layout.rail.bottom - layout.dock.top, "both navigation tiers stay compact").toBeLessThanOrEqual(108);
    expect(layout.buttons).toHaveLength(11);
    for (const button of layout.buttons) {
      expect(button.height, `${button.label} keeps a usable touch target`).toBeGreaterThanOrEqual(44);
      expect(button.left, `${button.label} starts in the viewport`).toBeGreaterThanOrEqual(0);
      expect(button.right, `${button.label} ends in the viewport`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(button.labelWidth, `${button.label} keeps a visible text label`).toBeGreaterThan(0);
      expect(button.labelHeight, `${button.label} keeps a visible text label`).toBeGreaterThan(0);
    }

    await globalNav.locator("[data-monster-toggle]").click();
    await expect(page.getByRole("dialog", { name: "Monster", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Monsterfenster schließen" }).click();
    await globalNav.locator("[data-inventory-toggle]").click();
    await expect(page.getByRole("dialog", { name: "Inventar", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Inventar schließen" }).click();

    await page.locator(".player-account-card").click();
    await expect(page.locator(".profile-page")).toBeVisible();
    const profileNavigation = await page.evaluate(() => {
      const usableWidth = document.documentElement.clientWidth;
      const navigation = document.querySelector<HTMLElement>(".main-nav")!.getBoundingClientRect();
      const buttons = [...document.querySelectorAll<HTMLElement>(".main-nav .nav-button")].map((button) => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left, right: rect.right, height: rect.height };
      });
      return {
        usableWidth,
        navigation: { left: navigation.left, right: navigation.right },
        buttons,
      };
    });
    expect(profileNavigation.navigation.left).toBeGreaterThanOrEqual(0);
    expect(profileNavigation.navigation.right).toBeLessThanOrEqual(profileNavigation.usableWidth + 1);
    for (const button of profileNavigation.buttons) {
      expect(button.left).toBeGreaterThanOrEqual(0);
      expect(button.right).toBeLessThanOrEqual(profileNavigation.usableWidth + 1);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
  } else {
    await expect(combatEntry).toBeVisible();
    await expect(globalNav.locator("button:visible")).toHaveCount(7);
  }
});
