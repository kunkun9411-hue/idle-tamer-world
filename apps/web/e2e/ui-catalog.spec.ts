import { expect, test } from "@playwright/test";

test("UI catalog exposes its contracts without page errors or horizontal overflow", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/dev/ui-catalog.html");
  await expect(page.getByRole("heading", { name: "Eine Oberfläche. Lesbar statt winzig." })).toBeVisible();
  await expect(page.locator(".type-contract-grid article")).toHaveCount(9);
  await expect(page.locator(".foundation-grid article")).toHaveCount(4);
  await expect(page.locator(".ui-kit-card")).toHaveCount(3);
  await expect(page.locator('[data-kit-item="A01"] img')).toHaveCount(1);
  await expect.poll(() => page.locator('[data-kit-item="A01"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 512, height: 512 });
  await expect.poll(() => page.locator('[data-kit-item="A02"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 1024, height: 192 });
  await expect.poll(() => page.locator('[data-kit-item="A03"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 192, height: 1024 });
  await expect(page.locator('[data-kit-assembly="A01-A03"] img')).toHaveCount(8);
  await expect.poll(() => page.locator('[data-kit-assembly="A01-A03"] img').evaluateAll((images) => images.every((image) => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )))).toBe(true);
  await expect(page.getByRole("heading", { name: "Generierte Identität, echter UI-Text" })).toBeVisible();
  await expect(page.locator(".generated-chrome-card")).toHaveCount(4);
  await expect(page.locator(".generated-chrome-card img")).toHaveCount(4);
  await page.locator("#generated").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(".generated-chrome-card img").evaluateAll((images) => images.every((image) => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )))).toBe(true);
  await expect(page.locator(".surface-grid article")).toHaveCount(16);
  await expect(page.locator(".state-grid article")).toHaveCount(10);
  await expect(page.locator(".asset-contract-grid article")).toHaveCount(6);
  await expect(page.locator(".debt-grid article")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.locator('[data-viewport="mobile"]').click();
  await expect.poll(() => page.locator(".viewport-frame").evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.width, height: style.height };
  })).toEqual({ width: "390px", height: "844px" });
  expect(pageErrors).toEqual([]);
});
