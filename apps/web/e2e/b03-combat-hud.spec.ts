import { expect, test } from "@playwright/test";

test("combat HUD keeps the two-monster stage primary and hides secondary panels on demand", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();

  const scene = page.getByTestId("combat-scene");
  await expect(scene).toBeVisible();
  await expect(scene.locator(".fighter--player")).toBeVisible();
  await expect(scene.locator(".fighter--enemy")).toBeVisible();
  await expect(scene.locator(".versus")).toContainText("VS");
  await expect(scene.locator(".combat-control-dock")).toBeVisible();
  await expect(scene.locator(".combat-panel--loot")).not.toHaveClass(/is-open/);

  await scene.locator('[data-combat-panel="duo"]').click();
  await expect(scene.locator(".combat-panel--duo")).toHaveClass(/is-open/);
  await expect(scene.locator(".fighter--player")).toBeVisible();
  await expect(scene.locator(".fighter--enemy")).toBeVisible();

  await scene.locator("#combat-focus-toggle").click();
  await expect(page.locator(".combat-shell")).toHaveClass(/is-focus-mode/);
  await expect(scene.locator(".combat-panel--duo")).not.toHaveClass(/is-open/);
  await expect(scene.locator(".combat-rail")).toBeHidden();
  await expect(scene.locator(".fighter--player")).toBeVisible();
  await expect(scene.locator(".fighter--enemy")).toBeVisible();

  await scene.locator("#combat-focus-toggle").click();
  await expect(page.locator(".combat-shell")).not.toHaveClass(/is-focus-mode/);
  await expect(scene.locator(".combat-control-dock")).toBeVisible();
});
