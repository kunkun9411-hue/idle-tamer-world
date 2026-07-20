import { expect, test } from "@playwright/test";

test("starter flow and combat HUD fit the configured viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("starter-dialog")).toBeVisible();
  await page.getByTestId("starter-pyrook").click();
  await page.locator("#offline-continue").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.innerWidth + 1);

  const selectors = [".fighter--player", ".fighter--enemy", ".combat-rail", ".combat-control-dock"];
  const boxes = await page.evaluate((targets) => Object.fromEntries(targets.map((selector) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    return [selector, rect ? { x: rect.x, width: rect.width, height: rect.height } : null];
  })), selectors);
  for (const selector of selectors) {
    const box = boxes[selector];
    expect(box, `${selector} needs a visible box`).not.toBeNull();
    expect(box!.height, `${selector} must occupy visible space`).toBeGreaterThan(0);
    expect(box!.x, `${selector} starts inside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width, `${selector} ends inside the viewport`).toBeLessThanOrEqual(layout.innerWidth + 1);
  }

  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator("#start-prestige").click();
  await expect(page.getByTestId("prestige-scene")).toBeVisible();
  await expect(page.getByTestId("prestige-crystal").locator("img")).toBeVisible();
  const prestigeLayout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(prestigeLayout.documentWidth).toBeLessThanOrEqual(prestigeLayout.innerWidth + 1);
  expect(prestigeLayout.bodyWidth).toBeLessThanOrEqual(prestigeLayout.innerWidth + 1);
});
