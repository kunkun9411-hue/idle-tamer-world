import { expect, test } from "@playwright/test";

const luminance = (hex: string): number => {
  const channels = hex.trim().replace("#", "").match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrast = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

test("login and starter choice remain operable by keyboard", async ({ page }) => {
  await page.goto("/");
  const identifier = page.locator("#login-identifier");
  const password = page.locator("#login-password");
  await identifier.focus();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Enter");

  const dialog = page.getByTestId("starter-dialog");
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

  await page.locator("#close-starter").focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#close-starter-alt")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.locator("#open-starter").click();
  await page.getByTestId("starter-pyrook").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("offline-report")).toHaveCount(0);
  await expect(page.getByTestId("combat-scene")).toBeVisible();
});

test("core text tokens meet WCAG AA contrast and inputs expose a focus ring", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(["--panel-solid", "--silver", "--silver-2", "--muted", "--dim", "--violet-bright"].map((name) => [name, style.getPropertyValue(name).trim()]));
  });
  for (const name of ["--silver", "--silver-2", "--muted", "--dim", "--violet-bright"]) {
    expect(contrast(tokens[name], tokens["--panel-solid"]), `${name} on --panel-solid`).toBeGreaterThanOrEqual(4.5);
  }

  const input = page.locator("#login-identifier");
  await page.keyboard.press("Tab");
  await expect(page.locator("#auth-mode-login")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#auth-mode-register")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const outline = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("stops the loading spinner instead of merely slowing it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?ui-state=loading");
    await expect(page.getByTestId("client-loading")).toBeVisible();
    const motion = await page.locator(".client-state-spinner").evaluate((element) => ({
      preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
      animationName: getComputedStyle(element).animationName,
    }));
    expect(motion.preference).toBe(true);
    expect(motion.animationName).toBe("none");
  });
});
