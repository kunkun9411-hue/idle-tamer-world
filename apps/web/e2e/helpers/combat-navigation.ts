import { expect, type Page } from "@playwright/test";

export async function openCombatArea(page: Page, selector: string): Promise<void> {
  const railTarget = page.locator(`.combat-rail ${selector}`);
  if (await railTarget.isVisible()) {
    await railTarget.click();
    return;
  }

  const trigger = page.locator("#combat-areas-toggle");
  await expect(trigger).toBeVisible();
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Bereiche", exact: true });
  await expect(menu).toBeVisible();
  await menu.locator(selector).click();
}
