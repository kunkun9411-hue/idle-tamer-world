import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";
import { openCombatArea } from "../e2e/helpers/combat-navigation";

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

  await openCombatArea(page, "[data-monster-toggle]");
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

test("three-monster quick window keeps roster rows separated", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const front = createMonster("pyrook", 4, 1, 0, "rookie", () => "modal-front");
  const support = createMonster("bramblet", 3, 1, 0, "rookie", () => "modal-support");
  const reserve = createMonster("nyxlet", 2, 1, 0, "rookie", () => "modal-reserve");
  state.roster = [front, support, reserve];
  state.activeMonsterUid = front.uid;
  state.tutorialStep = 4;
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
  }, { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await openCombatArea(page, "[data-monster-toggle]");

  const dialog = page.getByRole("dialog", { name: "Monster", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".combat-monster-modal__card")).toHaveCount(3);
  const layout = await dialog.evaluate((element) => {
    const cards = Array.from(element.querySelectorAll<HTMLElement>(".combat-monster-modal__card"))
      .map((card) => card.getBoundingClientRect());
    const overlaps = cards.some((card, index) => cards.slice(index + 1).some((other) => {
      const width = Math.min(card.right, other.right) - Math.max(card.left, other.left);
      const height = Math.min(card.bottom, other.bottom) - Math.max(card.top, other.top);
      return width > 1 && height > 1;
    }));
    return { overlaps, cardCount: cards.length };
  });
  expect(layout.cardCount).toBe(3);
  expect(layout.overlaps).toBe(false);
});
