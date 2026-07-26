import { expect, test } from "@playwright/test";

const combatRoutes = ["dispatch", "habitat", "incubation", "inventory", "research", "guild"] as const;

test("navigation IA returns every core route to the combat home", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) {
    await page.getByTestId("starter-pyrook").click();
  }
  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  for (const view of combatRoutes) {
    const button = page.locator(`.combat-rail [data-view="${view}"]`);
    await expect(button, `${view} must be reachable from the combat shell`).toHaveCount(1);
    await button.click();
    await expect(page.locator("section.page")).toBeVisible();
    await expect(page.locator(`.main-nav [data-view="${view}"]`)).toHaveAttribute("aria-current", "page");
    const returnButton = page.locator(".main-nav [data-view=expedition]");
    await expect(returnButton).toHaveCount(1);
    await returnButton.click();
    await expect(page.getByTestId("combat-scene")).toBeVisible();
  }

  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator(".combat-objectives-link").click();
  await expect(page.locator("section.page")).toBeVisible();
  await expect(page.locator('.main-nav [data-view="objectives"]')).toHaveAttribute("aria-current", "page");
  await page.locator(".main-nav [data-view=expedition]").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  await page.locator('.profile-chip[data-view="profile"]').last().click();
  await expect(page.locator("section.page")).toBeVisible();
  await page.locator(".main-nav [data-view=expedition]").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});
