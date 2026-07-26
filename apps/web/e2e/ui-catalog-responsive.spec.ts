import { expect, test } from "@playwright/test";

test("modular UI kit remains readable and contained at the reference viewport", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/dev/ui-catalog.html");
  const kit = page.locator("#kit");
  await kit.scrollIntoViewIfNeeded();

  const kitManifestResponse = await page.request.get("/assets/ui/kit/ui-kit-manifest.json");
  expect(kitManifestResponse.ok()).toBe(true);
  const kitManifest = await kitManifestResponse.json() as {
    elements?: Array<{ id?: string }>;
  };
  const familyCounts = (kitManifest.elements ?? []).reduce<Record<string, number>>((counts, element) => {
    const family = element.id?.charAt(0);
    if (family) counts[family] = (counts[family] ?? 0) + 1;
    return counts;
  }, {});
  const familyMap: Record<string, string> = { A: "frame", B: "surface", C: "chrome", D: "control", E: "info", F: "economy", G: "system", H: "identity" };
  for (const [prefix, count] of Object.entries(familyCounts)) {
    await expect(page.locator(`[data-kit-family="${familyMap[prefix]}"]`)).toHaveCount(count);
  }
  await expect(page.locator("[data-kit-item]")).toHaveCount(kitManifest.elements?.length ?? 0);
  await expect(page.locator(".info-variant-card:not(.system-variant-card)")).toHaveCount(8);
  await expect(page.locator(".system-variant-card")).toHaveCount(2);
  await expect(page.locator('[data-kit-assembly="A01-A03"]')).toBeVisible();
  await expect(page.locator('[data-kit-assembly="A04-A06"]')).toBeVisible();
  await expect(page.locator('[data-kit-assembly="A04-A07"]')).toBeVisible();

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
