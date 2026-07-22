import { expect, test } from "@playwright/test";

test("modular UI kit remains readable and contained at the reference viewport", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/dev/ui-catalog.html");
  const kit = page.locator("#kit");
  await kit.scrollIntoViewIfNeeded();

  await expect(page.locator(".ui-kit-card")).toHaveCount(5);
  await expect(page.locator('[data-kit-assembly="A01-A03"]')).toBeVisible();

  const viewportWidth = page.viewportSize()?.width ?? 0;
  const kitBox = await kit.boundingBox();
  const assemblyBox = await page.locator('[data-kit-assembly="A01-A03"]').boundingBox();
  expect(kitBox).not.toBeNull();
  expect(assemblyBox).not.toBeNull();
  expect(kitBox!.x).toBeGreaterThanOrEqual(0);
  expect(kitBox!.x + kitBox!.width).toBeLessThanOrEqual(viewportWidth + 1);
  expect(assemblyBox!.x).toBeGreaterThanOrEqual(0);
  expect(assemblyBox!.x + assemblyBox!.width).toBeLessThanOrEqual(viewportWidth + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});
