import { expect, test } from "@playwright/test";

test("public roadmap shows completed A and B with C as the next active roadmap", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/roadmap/");
  await expect(page.getByRole("heading", { name: "Die Oberfläche steht. Jetzt wächst die Welt." })).toBeVisible();
  await expect(page.locator("#active-block-label")).toHaveText("ROADMAP C · CONTENT & FEATURES");
  await expect(page.locator("#active-step-label")).toHaveText("ROADMAP B EINGEFROREN · 32/32");
  await expect(page.locator("#completed-label")).toHaveText("32 / 32 B-Gates");
  await expect(page.locator("#program-a-percent")).toHaveText("100%");
  await expect(page.locator("#program-b-percent")).toHaveText("100%");
  await expect(page.locator(".block-card")).toHaveCount(8);
  await expect(page.locator(".block-card").first()).toContainText("B.01");
  await expect(page.locator('.block-card[data-block-id="3"]')).toHaveAttribute("data-active", "false");
  await expect(page.locator('.block-card[data-block-id="3"] .card-state')).toHaveText("Fertig");
  await expect(page.locator('.block-card[data-block-id="8"] .card-state')).toHaveText("Fertig");
  await expect(page.locator('.step-item[data-current="true"]')).toHaveCount(0);
  await expect(page.locator("#detail-hint")).toContainText("Roadmap B wird nur für kritische Fehler erneut geöffnet");

  await page.getByRole("button", { name: /A Systemfundament 32\/32/ }).click();
  await expect(page.getByRole("heading", { name: "Acht abgeschlossene Blöcke des Systemfundaments." })).toBeVisible();
  await expect(page.locator(".block-card")).toHaveCount(8);
  await expect(page.locator(".block-card").first()).toContainText("A.01");
  await expect(page.locator(".block-card").last()).toContainText("A.08");
  await expect(page.locator(".block-card .card-state")).toHaveText(Array(8).fill("Fertig"));

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});
