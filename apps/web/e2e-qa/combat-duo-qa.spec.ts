import { expect, test } from "@playwright/test";

test("local combat preset proves the two-monster support and zone-bonus flow", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByTestId("login-screen")).toBeVisible();
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("starter-dialog")).toBeVisible();
  await page.getByTestId("starter-pyrook").click();

  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const combatPreset = page.locator('.qa-panel [data-qa="combat"]');
  await expect(combatPreset).toHaveCount(1);
  await combatPreset.click();

  await page.locator(".combat-rail [data-monster-toggle]").click();
  const monsterDialog = page.getByRole("dialog", { name: "Monster", exact: true });
  const summary = monsterDialog.locator(".combat-monster-modal__summary");
  await expect(monsterDialog).toBeVisible();
  await expect(summary).toContainText("2 Resonanzen");
  await expect(summary).toContainText("1 Front");
  await expect(summary).toContainText("0 Support");

  const brambletCard = monsterDialog.locator(".combat-monster-modal__card").filter({ hasText: "Bramblet" });
  await expect(brambletCard).toHaveCount(1);
  await brambletCard.getByRole("button", { name: "ALS SUPPORT", exact: true }).click();

  await expect(summary).toContainText("1 Support");
  await expect(brambletCard).toHaveClass(/is-support/);
  await expect(brambletCard.locator(".combat-monster-modal__role")).toHaveText("SUPPORT");
  await monsterDialog.getByRole("button", { name: "Monsterfenster schließen" }).click();

  await page.locator('.combat-control-dock [data-combat-panel="duo"]').click();
  const duoPanel = page.locator(".combat-duo-hud.is-open");
  await expect(duoPanel).toBeVisible();
  await expect(duoPanel).toContainText("Bramblet");
  await expect(duoPanel).toContainText("ZONENBONUS AKTIV");
  await expect(duoPanel).toContainText("Vorhut-Signal");
  await expect(duoPanel).toContainText("+18% Angriff und +10% Gold");
  await page.screenshot({ path: testInfo.outputPath("duo-active.png"), animations: "disabled" });
  expect(pageErrors).toEqual([]);
});
