import { expect, test } from "@playwright/test";

import { UI_GENERATED_CHROME } from "../src/dev/ui-catalog-data";

test("UI catalog exposes its contracts without page errors or horizontal overflow", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/dev/ui-catalog.html");
  await expect(page.getByRole("heading", { name: "Eine Oberfläche. Lesbar statt winzig." })).toBeVisible();
  await expect(page.locator(".type-contract-grid article")).toHaveCount(9);
  await expect(page.locator(".foundation-grid article")).toHaveCount(4);
  const kitManifestResponse = await page.request.get("/assets/ui/kit/ui-kit-manifest.json");
  expect(kitManifestResponse.ok()).toBe(true);
  const kitManifest = await kitManifestResponse.json() as {
    kitVersion?: number;
    style?: string;
    elements?: Array<{ id?: string; path?: string; status?: string }>;
  };
  expect(kitManifest.kitVersion).toBe(1);
  expect(kitManifest.style).toBe("silver-ether");
  expect(kitManifest.elements?.length).toBeGreaterThan(0);
  expect(kitManifest.elements?.every((element) => (
    element.id && element.path?.startsWith("/assets/ui/kit/") && element.status === "approved"
  ))).toBe(true);
  const familyCounts = (kitManifest.elements ?? []).reduce<Record<string, number>>((counts, element) => {
    const family = element.id?.charAt(0);
    if (family) counts[family] = (counts[family] ?? 0) + 1;
    return counts;
  }, {});
  for (const [prefix, count] of Object.entries(familyCounts)) {
    const family = { A: "frame", B: "surface", C: "chrome", D: "control", E: "info", F: "economy", G: "system", H: "identity" }[prefix];
    expect(family, `manifest prefix ${prefix} must map to a catalog family`).toBeTruthy();
    await expect(page.locator(`[data-kit-family="${family}"]`)).toHaveCount(count);
  }
  await expect(page.locator("[data-kit-item]")).toHaveCount(kitManifest.elements?.length ?? 0);
  await expect(page.locator(".info-variant-card:not(.system-variant-card)")).toHaveCount(8);
  await expect(page.locator(".system-variant-card")).toHaveCount(2);
  const manifestIds = kitManifest.elements?.map((element) => element.id).sort() ?? [];
  const renderedIds = await page.locator("[data-kit-item]").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-kit-item") ?? "").sort()
  ));
  expect(new Set(renderedIds).size).toBe(kitManifest.elements?.length ?? 0);
  expect(renderedIds).toEqual(manifestIds);
  const assetChecks = await Promise.all((kitManifest.elements ?? []).map(async (element) => (
    element.path ? (await page.request.get(element.path)).ok() : false
  )));
  expect(assetChecks.every(Boolean)).toBe(true);
  await expect(page.locator('[data-kit-item="F01"] img')).toHaveCount(1);
  await expect(page.locator('[data-kit-item="G11"] img')).toHaveAttribute("src", "/assets/ui/kit/system/g11-v1.webp");
  await expect(page.locator('[data-kit-item="G17"] img')).toHaveCount(1);
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
  await expect.poll(() => page.locator('[data-kit-item="A04"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 1024, height: 64 });
  await expect.poll(() => page.locator('[data-kit-item="A05"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 64, height: 1024 });
  await expect.poll(() => page.locator('[data-kit-item="A06"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 256, height: 256 });
  await expect.poll(() => page.locator('[data-kit-item="A07"] img').evaluate((image) => (
    image instanceof HTMLImageElement && image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null
  ))).toEqual({ width: 192, height: 192 });
  await expect(page.locator('[data-kit-assembly="A01-A03"] img')).toHaveCount(8);
  await expect.poll(() => page.locator('[data-kit-assembly="A01-A03"] img').evaluateAll((images) => images.every((image) => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )))).toBe(true);
  await expect(page.locator('[data-kit-assembly="A04-A06"] img')).toHaveCount(8);
  await expect.poll(() => page.locator('[data-kit-assembly="A04-A06"] img').evaluateAll((images) => images.every((image) => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )))).toBe(true);
  await expect(page.locator('[data-kit-assembly="A04-A07"] img')).toHaveCount(8);
  await expect(page.locator('[data-kit-assembly="A04-A07"]')).toContainText("Barrieren halten 8 % länger.");
  await expect.poll(() => page.locator('[data-kit-assembly="A04-A07"] img').evaluateAll((images) => images.every((image) => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )))).toBe(true);
  await expect(page.getByRole("heading", { name: "Generierte Identität, echter UI-Text" })).toBeVisible();
  await expect(page.locator(".generated-chrome-card")).toHaveCount(UI_GENERATED_CHROME.length);
  await expect(page.locator(".generated-chrome-card img")).toHaveCount(UI_GENERATED_CHROME.length);
  await page.locator("#generated").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(".generated-chrome-card img").evaluateAll((images) => images.every((image) => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )))).toBe(true);
  await expect(page.locator(".surface-grid article")).toHaveCount(16);
  await expect(page.locator(".state-grid article")).toHaveCount(10);
  await expect(page.locator(".asset-contract-grid article")).toHaveCount(6);
  await expect(page.locator(".debt-grid article")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.locator('[data-viewport="mobile"]').click();
  await expect.poll(() => page.locator(".viewport-frame").evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.width, height: style.height };
  })).toEqual({ width: "390px", height: "844px" });
  expect(pageErrors).toEqual([]);
});
