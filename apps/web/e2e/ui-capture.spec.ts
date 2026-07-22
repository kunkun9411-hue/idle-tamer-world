import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { UI_VIEWPORTS } from "../src/dev/ui-catalog-data";

const captureRoot = fileURLToPath(new URL("../../../artifacts/ui-captures/", import.meta.url));

const activate = async (page: Page, selector: string): Promise<void> => {
  const locator = page.locator(selector);
  await expect(locator).toHaveCount(1);
  await locator.evaluate((element) => (element as HTMLButtonElement).click());
};

for (const viewport of UI_VIEWPORTS) {
  test(`${viewport.id} scene capture`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const target = `${captureRoot}/${viewport.id}`;
    await mkdir(target, { recursive: true });
    const shot = async (name: string, fullPage = false): Promise<void> => {
      await page.screenshot({ path: `${target}/${name}.png`, fullPage, animations: "disabled" });
    };

    await page.goto("/");
    await shot("01-login");
    await page.getByTestId("login-submit").click();
    if (await page.getByTestId("starter-dialog").count()) {
      await shot("02-starter-choice", true);
      await page.getByTestId("starter-pyrook").click();
    }
    await expect(page.getByTestId("combat-scene")).toBeVisible();
    await page.reload();
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("offline-report")).toBeVisible();
    await shot("03-offline-report");
    await page.keyboard.press("Tab");
    await shot("03-offline-report-focus");
    await page.getByTestId("offline-collect").hover();
    await shot("03-offline-report-hover");
    await page.getByTestId("offline-collect").click();
    if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();
    await expect(page.getByTestId("combat-scene")).toBeVisible();
    await shot("04-combat");

    await activate(page, '[data-combat-panel="missions"]');
    await shot("05-combat-missions");
    await activate(page, ".combat-objectives-link");
    await shot("06-objectives", true);

    for (const [index, view] of ["dispatch", "habitat", "incubation", "inventory", "research", "guild"].entries()) {
      await activate(page, `.main-nav [data-view="${view}"]`);
      await shot(`${String(index + 7).padStart(2, "0")}-${view}`, true);
    }

    await activate(page, '.topbar [data-view="profile"]');
    await shot("13-profile", true);
    await activate(page, '.main-nav [data-view="expedition"]');
    await expect(page.getByTestId("combat-scene")).toBeVisible();
    await activate(page, "#start-prestige");
    await expect(page.getByTestId("prestige-scene")).toBeVisible();
    await shot("14-prestige", true);
  });
}
