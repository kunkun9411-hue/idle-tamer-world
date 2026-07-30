import { expect, test } from "@playwright/test";

import { knownUiDebtIdsForWidth } from "../src/dev/ui-catalog-data";
import { openCombatArea } from "./helpers/combat-navigation";

const enterLocalCombat = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
};

test("layout debt matches the explicit A.08 handoff allowlist", async ({ page }) => {
  await enterLocalCombat(page);

  const issueIds: string[] = [];
  const navigationOverlap = await page.evaluate(() => {
    const rectangles = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    const areas = rectangles(".combat-rail button");
    const controls = rectangles(".combat-control-dock button");
    return areas.some((area) => controls.some((control) => {
      const overlapWidth = Math.min(area.right, control.right) - Math.max(area.left, control.left);
      const overlapHeight = Math.min(area.bottom, control.bottom) - Math.max(area.top, control.top);
      return overlapWidth > 4 && overlapHeight > 4;
    }));
  });
  if (navigationOverlap) issueIds.push("mobile-combat-navigation-overlap");

  const quickWindows = [
    {
      toggle: ".combat-rail [data-monster-toggle]",
      name: "Monster",
      closeName: "Monsterfenster schließen",
    },
    {
      toggle: ".combat-rail [data-inventory-toggle]",
      name: "Inventar",
      closeName: "Inventar schließen",
    },
  ] as const;

  for (const quickWindow of quickWindows) {
    await openCombatArea(page, quickWindow.toggle.replace(".combat-rail ", ""));
    const dialog = page.getByRole("dialog", { name: quickWindow.name, exact: true });
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("combat-scene")).toBeVisible();
    const dialogOverflow = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > window.innerWidth + 1 || rect.top < -1 || rect.bottom > window.innerHeight + 1;
    });
    if (dialogOverflow) issueIds.push(`combat-${quickWindow.name.toLowerCase()}-dialog-overflow`);
    const contentCollision = await dialog.evaluate((element, windowName) => {
      const selectors = windowName === "Inventar"
        ? [".combat-inventory-modal__header", ".combat-inventory-tabs", ".combat-inventory-grid", ".combat-inventory-hint"]
        : [".combat-inventory-modal__header", ".combat-monster-modal__summary", ".combat-monster-modal__grid", ".combat-monster-modal__footer"];
      const rectangles = selectors.map((selector) => element.querySelector<HTMLElement>(selector)?.getBoundingClientRect());
      if (rectangles.some((rect) => !rect)) return true;
      return rectangles.slice(1).some((rect, index) => rect!.top < rectangles[index]!.bottom - 1);
    }, quickWindow.name);
    if (contentCollision) issueIds.push(`combat-${quickWindow.name.toLowerCase()}-content-collision`);
    await page.getByRole("button", { name: quickWindow.closeName }).click();
    await expect(dialog).toHaveCount(0);
  }

  await openCombatArea(page, '[data-view="research"]');
  await expect(page.locator(".app-shell--research")).toBeVisible();
  const accountOverflow = await page.evaluate(() => {
    const rect = document.querySelector<HTMLElement>(".topbar__account")?.getBoundingClientRect();
    return rect ? rect.right - window.innerWidth : 0;
  });
  if (accountOverflow > 1) issueIds.push("subpage-account-overflow");
  await page.locator('.main-nav [data-view="expedition"]').click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const width = page.viewportSize()?.width ?? 0;
  expect(issueIds.sort()).toEqual(knownUiDebtIdsForWidth(width));
});
