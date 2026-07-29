import { expect, test } from "@playwright/test";

test("public roadmap shows the completed foundation and active B player review", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/roadmap/");
  await expect(page.getByRole("heading", { name: "Das System steht. Jetzt wird es zum Spiel." })).toBeVisible();
  await expect(page.locator("#active-block-label")).toContainText("B.03");
  await expect(page.locator("#active-step-label")).toHaveText("3 · Prüfen");
  await expect(page.locator("#completed-label")).toHaveText("28 / 32 B-Gates");
  await expect(page.locator("#program-a-percent")).toHaveText("100%");
  await expect(page.locator("#program-b-percent")).toHaveText("87.5%");
  await expect(page.locator(".block-card")).toHaveCount(8);
  await expect(page.locator(".block-card").first()).toContainText("B.01");
  await expect(page.locator('.block-card[data-block-id="3"]')).toHaveAttribute("data-active", "true");
  await expect(page.locator('.block-card[data-block-id="3"] .card-state')).toHaveText("Aktiv");
  await expect(page.locator('.block-card[data-block-id="8"] .card-state')).toHaveText("Später");
  await expect(page.locator('.step-item[data-current="true"]')).toHaveCount(1);
  await expect(page.locator('.step-item[data-current="true"]')).toContainText("3. Prüfen");
  await expect(page.locator("#detail-hint")).toContainText("Schritt 3 – Prüfen");

  await page.getByRole("button", { name: /A Systemfundament 32\/32/ }).click();
  await expect(page.getByRole("heading", { name: "Acht abgeschlossene Blöcke des Systemfundaments." })).toBeVisible();
  await expect(page.locator(".block-card")).toHaveCount(8);
  await expect(page.locator(".block-card").first()).toContainText("A.01");
  await expect(page.locator(".block-card").last()).toContainText("A.08");
  await expect(page.locator(".block-card .card-state")).toHaveText(Array(8).fill("Fertig"));

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});
