import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

test("combat navigation keeps one readable mobile dock and every game area reachable", async ({ page }) => {
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
  await expect(battleNav).toBeVisible();

  const viewport = page.viewportSize()!;
  const combatEntry = globalNav.locator('[data-view="expedition"]');
  if (viewport.width <= 620) {
    await expect(globalNav).toBeHidden();
    const dockButtons = battleNav.locator("button:visible");
    await expect(dockButtons).toHaveCount(6);
    await expect(dockButtons.locator("> span")).toHaveText(["Ziele", "Beute", "Duo", "Kampflog", "Fokus", "Bereiche"]);

    const layout = await page.evaluate(() => {
      const dock = document.querySelector<HTMLElement>(".combat-control-dock")!.getBoundingClientRect();
      const visibleButtons = [...document.querySelectorAll<HTMLElement>(".combat-control-dock button")]
        .filter((button) => getComputedStyle(button).display !== "none")
        .map((button) => {
          const rect = button.getBoundingClientRect();
          const label = button.querySelector<HTMLElement>("span");
          const labelRect = label?.getBoundingClientRect();
          return {
            label: label?.textContent?.trim() ?? button.getAttribute("title"),
            left: rect.left,
            right: rect.right,
            height: rect.height,
            labelWidth: labelRect?.width ?? 0,
            labelHeight: labelRect?.height ?? 0,
            labelFontSize: label ? Number.parseFloat(getComputedStyle(label).fontSize) : 0,
            labelClipped: label ? label.scrollWidth > label.clientWidth + 1 : true,
          };
        });
      return {
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        dock: { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom },
        buttons: visibleButtons,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.dock.left).toBeGreaterThanOrEqual(0);
    expect(layout.dock.right).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.dock.bottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.buttons).toHaveLength(6);
    for (const button of layout.buttons) {
      expect(button.height, `${button.label} keeps a usable touch target`).toBeGreaterThanOrEqual(44);
      expect(button.left, `${button.label} starts in the viewport`).toBeGreaterThanOrEqual(0);
      expect(button.right, `${button.label} ends in the viewport`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(button.labelWidth, `${button.label} keeps a visible text label`).toBeGreaterThan(0);
      expect(button.labelHeight, `${button.label} keeps a visible text label`).toBeGreaterThan(0);
      expect(button.labelFontSize, `${button.label} keeps readable type`).toBeGreaterThanOrEqual(viewport.width >= 360 ? 9 : 8);
      expect(button.labelClipped, `${button.label} label is not clipped`).toBe(false);
    }

    const areasTrigger = page.locator("#combat-areas-toggle");
    await expect(areasTrigger).toHaveAttribute("aria-expanded", "false");
    await areasTrigger.click();
    await expect(areasTrigger).toHaveAttribute("aria-expanded", "true");
    const areasDialog = page.getByRole("dialog", { name: "Bereiche", exact: true });
    await expect(areasDialog).toBeVisible();
    const areaButtons = areasDialog.getByRole("navigation", { name: "Weitere Spielbereiche" }).locator("button");
    await expect(areaButtons).toHaveCount(6);
    await expect(areaButtons).toHaveText(["Monster", "Brut", "Inventar", "Forschung", "Missionen", "Gilde"]);
    await page.keyboard.press("Escape");
    await expect(areasDialog).toBeHidden();
    await expect(areasTrigger).toBeFocused();
    await expect(areasTrigger).toHaveAttribute("aria-expanded", "false");

    await areasTrigger.click();
    await page.getByRole("dialog", { name: "Bereiche", exact: true }).locator("[data-monster-toggle]").click();
    await expect(page.getByRole("dialog", { name: "Monster", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Monsterfenster schließen" }).click();
    await page.locator("#combat-areas-toggle").click();
    await page.getByRole("dialog", { name: "Bereiche", exact: true }).locator("[data-inventory-toggle]").click();
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
    await expect(globalNav).toBeVisible();
    await expect(combatEntry).toBeVisible();
    await expect(globalNav.locator("button:visible")).toHaveCount(7);
    await expect(battleNav.locator("button:visible")).toHaveCount(5);
  }
});
