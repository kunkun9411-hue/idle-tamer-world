import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1_440, height: 900 },
  { name: "tablet", width: 820, height: 1_180 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const viewport of viewports) {
  test(`offline report keeps its summary clear of the collect action on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByTestId("login-submit").click();
    if (await page.getByTestId("starter-dialog").count()) {
      await page.getByTestId("starter-pyrook").click();
    }
    await expect(page.getByTestId("combat-scene")).toBeVisible();

    await page.reload();
    await page.getByTestId("login-submit").click();
    const report = page.getByTestId("offline-report");
    await expect(report).toBeVisible();

    const layout = await report.evaluate((element) => {
      const summary = element.querySelector<HTMLElement>(".offline-report__actions > p");
      const button = element.querySelector<HTMLButtonElement>("#offline-collect");
      if (!summary || !button) throw new Error("Offline report actions are incomplete.");
      const reportRect = element.getBoundingClientRect();
      const summaryRect = summary.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      return {
        reportTop: reportRect.top,
        reportBottom: reportRect.bottom,
        summaryBottom: summaryRect.bottom,
        buttonTop: buttonRect.top,
        buttonHeight: buttonRect.height,
        viewportHeight: window.innerHeight,
      };
    });

    expect(layout.reportTop).toBeGreaterThanOrEqual(0);
    expect(layout.reportBottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.buttonTop - layout.summaryBottom).toBeGreaterThanOrEqual(8);
    if (viewport.width <= 540) {
      expect(layout.buttonHeight).toBeGreaterThanOrEqual(44);
    }
  });
}
