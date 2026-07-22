import { expect, test } from "@playwright/test";

import { knownUiDebtIdsForWidth } from "../src/dev/ui-catalog-data";

const enterLocalCombat = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  if (await page.getByTestId("offline-report").count()) await page.locator("#offline-continue").click();
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

  await page.locator('.combat-rail [data-view="habitat"]').evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page.locator(".app-shell--habitat")).toBeVisible();
  const accountOverflow = await page.evaluate(() => {
    const rect = document.querySelector<HTMLElement>(".topbar__account")?.getBoundingClientRect();
    return rect ? rect.right - window.innerWidth : 0;
  });
  if (accountOverflow > 1) issueIds.push("subpage-account-overflow");

  const width = page.viewportSize()?.width ?? 0;
  expect(issueIds.sort()).toEqual(knownUiDebtIdsForWidth(width));
});
