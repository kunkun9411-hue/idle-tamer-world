import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

const captureRoot = fileURLToPath(new URL("../../../artifacts/ui-captures/", import.meta.url));

const prepareCombat = async (page: Page, width: number, height: number): Promise<void> => {
  await page.setViewportSize({ width, height });
  const state = createInitialState(() => Date.now() - 4 * 60_000);
  const starter = createMonster("pyrook", 5, 1, 0, "rookie", () => `b07-${width}`);
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  state.pendingGold = 120;
  state.cacheSlotsUsed = 1;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
};

test("B07 reference matrix and 2x typography stress stay contained", async ({ page }) => {
  for (const viewport of [[1280, 720], [1024, 768], [390, 844]] as const) {
    await prepareCombat(page, viewport[0], viewport[1]);
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      focus: getComputedStyle(document.querySelector("#combat-focus-toggle")!).outlineWidth,
    }));
    expect(layout.documentWidth, `document overflow at ${viewport[0]}px`).toBeLessThanOrEqual(layout.width + 1);
    expect(layout.bodyWidth, `body overflow at ${viewport[0]}px`).toBeLessThanOrEqual(layout.width + 1);
    expect(Number.parseFloat(layout.focus)).toBeGreaterThanOrEqual(2);

    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const stress = await page.evaluate(() => ({
      combat: Boolean(document.querySelector('[data-testid="combat-scene"]')),
      negative: [...document.querySelectorAll<HTMLElement>(".combat-control-dock button, .combat-rail button")]
        .filter((button) => getComputedStyle(button).display !== "none")
        .some((button) => button.getBoundingClientRect().left < -1),
    }));
    expect(stress.combat).toBe(true);
    expect(stress.negative, `2x typography moved a control outside at ${viewport[0]}px`).toBe(false);
    await page.reload();
  }
});

test("B08 feedback and reduced-motion handoff are visible and reproducible", async ({ page }) => {
  await prepareCombat(page, 1280, 720);
  await expect(page.getByTestId("offline-report")).toHaveCount(0);
  await expect(page.locator(".ui-notice")).toContainText("Willkommen zurück");

  const focusToggle = page.locator("#combat-focus-toggle");
  await focusToggle.click();
  await expect(focusToggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".combat-shell")).toHaveClass(/is-focus-mode/);
  await focusToggle.click();
  await expect(focusToggle).toHaveAttribute("aria-pressed", "false");

  await page.emulateMedia({ reducedMotion: "reduce" });
  const spinner = await page.evaluate(() => {
    const element = document.createElement("span");
    element.className = "client-state-spinner";
    document.body.append(element);
    const animationName = getComputedStyle(element).animationName;
    element.remove();
    return animationName;
  });
  expect(spinner).toBe("none");

  const target = `${captureRoot}/b08-combat-focus.png`;
  await page.screenshot({ path: target, animations: "disabled" });
  expect((await stat(target)).size).toBeGreaterThan(50_000);
});
