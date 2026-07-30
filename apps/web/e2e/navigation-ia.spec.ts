import { expect, test } from "@playwright/test";

const combatRoutes = ["dispatch", "incubation", "research", "guild"] as const;

test("navigation IA keeps quick access in combat and returns every core route home", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) {
    await page.getByTestId("starter-pyrook").click();
  }
  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const monsterToggle = page.locator(".combat-rail [data-monster-toggle]");
  await expect(monsterToggle, "Monster must be a quick window in the combat shell").toHaveCount(1);
  await monsterToggle.click();
  const monsterDialog = page.getByRole("dialog", { name: "Monster", exact: true });
  await expect(monsterDialog).toHaveCount(1);
  await expect(monsterDialog).toBeVisible();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Inventar", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Monsterfenster schließen" }).click();
  await expect(monsterDialog).toHaveCount(0);
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const inventoryToggle = page.locator(".combat-rail [data-inventory-toggle]");
  await expect(inventoryToggle, "Inventory must be a quick window in the combat shell").toHaveCount(1);
  await inventoryToggle.click();
  const inventoryDialog = page.getByRole("dialog", { name: "Inventar", exact: true });
  await expect(inventoryDialog).toHaveCount(1);
  await expect(inventoryDialog).toBeVisible();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Monster", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Inventar schließen" }).click();
  await expect(inventoryDialog).toHaveCount(0);
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  for (const view of combatRoutes) {
    const button = page.locator(`.combat-rail [data-view="${view}"]`);
    await expect(button, `${view} must be reachable from the combat shell`).toHaveCount(1);
    await button.click();
    await expect(page.locator("section.page")).toBeVisible();
    await expect(page.locator(`.main-nav [data-view="${view}"]`)).toHaveAttribute("aria-current", "page");
    const returnButton = page.locator(".main-nav [data-view=expedition]");
    await expect(returnButton).toHaveCount(1);
    await returnButton.click();
    await expect(page.getByTestId("combat-scene")).toBeVisible();
  }

  await page.locator('.combat-rail [data-view="research"]').click();
  await expect(page.locator(".research-grid")).toBeVisible();
  await page.locator('.main-nav [data-view="inventory"]').click();
  await expect(page.getByTestId("combat-scene"), "Inventory from a detail page returns to the live battle").toBeVisible();
  await expect(page.getByRole("dialog", { name: "Inventar", exact: true }), "Every inventory entry opens the same slot inventory").toBeVisible();
  await page.getByRole("button", { name: "Inventar schließen" }).click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const goalsToggle = page.locator('[data-combat-panel="missions"]');
  const goalsPanel = page.locator(".combat-objective-hud");
  await goalsToggle.click();
  await expect(goalsPanel).toBeVisible();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
  await page.locator('.combat-objective-hud [data-view="objectives"]').click();
  await expect(page.locator(".objectives-page")).toBeVisible();
  await expect(page.locator(".main-nav .nav-button")).toHaveCount(8);
  await expect(page.locator('.main-nav [data-view="objectives"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('.main-nav [data-view="expedition"]')).toHaveCount(0);
  await page.locator('.objective-overview [data-view="expedition"]').click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const playerCard = page.locator('.player-account-card[data-view="profile"]').last();
  await expect(playerCard, "Player identity and currencies must form one profile card").toHaveCount(1);
  await expect(playerCard.locator(".account-avatar.has-portrait")).toHaveCount(1);
  await expect(playerCard.locator(".player-account-card__identity > strong")).not.toBeEmpty();
  await expect(playerCard.locator(".player-account-card__identity > i")).toBeVisible();
  await expect(playerCard.locator(".player-account-card__metric")).toHaveCount(3);
  await expect(page.locator(".combat-account > .resources, .combat-account > .rank-chip")).toHaveCount(0);
  await playerCard.click();
  await expect(page.locator("section.page")).toBeVisible();
  await page.locator(".main-nav [data-view=expedition]").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});
