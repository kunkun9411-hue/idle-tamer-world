import { expect, test } from "@playwright/test";

import { openCombatArea } from "./helpers/combat-navigation";

const enterLocalCombat = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
};

test("opening the local Ether chest keeps inventory and reward feedback visible", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterLocalCombat(page);
  const gold = page.locator('.player-account-card [data-live="run-gold"]');
  await expect(gold).toHaveText("100");

  await openCombatArea(page, "[data-inventory-toggle]");
  const inventory = page.getByRole("dialog", { name: "Inventar", exact: true });
  await expect(inventory).toBeVisible();
  await inventory.locator('[data-inventory-category="other"]').click();

  const chest = inventory.getByRole("button", { name: "Ether-Truhe öffnen", exact: true });
  await expect(chest).toBeVisible();
  await chest.click();

  await expect(inventory).toBeVisible();
  await expect(chest).toHaveCount(0);
  await expect(gold).toHaveText("350");
  await expect(page.getByRole("status")).toContainText("Ether-Truhe geöffnet");
  await expect(page.getByRole("status")).toContainText("+250 Gold und +3 Etherstaub");

  const feedbackIsAboveModal = await page.evaluate(() => {
    const notice = document.querySelector<HTMLElement>(".ui-notice");
    const modal = document.querySelector<HTMLElement>(".combat-inventory-modal");
    if (!notice || !modal) return false;
    return Number.parseInt(getComputedStyle(notice).zIndex, 10) > Number.parseInt(getComputedStyle(modal).zIndex, 10);
  });
  expect(feedbackIsAboveModal).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("ether-chest-feedback.png"), animations: "disabled" });
  expect(pageErrors).toEqual([]);
});
