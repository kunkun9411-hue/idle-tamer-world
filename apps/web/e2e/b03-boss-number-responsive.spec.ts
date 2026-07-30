import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { unlockThroughZone } from "../src/game/qa-tools";
import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";
import type { GameState } from "../src/game/types";

interface MatrixFixture {
  id: string;
  expectedBoss: string;
  expectedGold: string;
  expectedState: "STAGE GESCHAFFT" | "REGENERATION";
  makeState(): GameState;
}

const baseState = (level: number, uid: string): GameState => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", level, 1, 0, "rookie", () => uid);
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.supportMonsterUid = "";
  state.tutorialStep = 4;
  state.lastSeenAt = Date.now();
  state.cacheSlotsUsed = 1;
  return state;
};

const matrix: MatrixFixture[] = [
  {
    id: "boss-scientific-victory",
    expectedBoss: "Kronwurzel-Koloss",
    expectedGold: "1,25e15",
    expectedState: "STAGE GESCHAFFT",
    makeState: () => {
      const state = baseState(100, "b03-victory-pyrook");
      state.currentZoneId = "violet-rim";
      state.unlockedZoneIds = ["violet-rim"];
      state.highestZoneNumber = 1;
      state.zoneProgress["violet-rim"] = { stage: 10, clears: 0 };
      state.runVictories = 0;
      state.prestigeCount = 0;
      state.resources.gold = 1_250_000_000_000_000;
      state.pendingGold = 1_250_000_000_000_000;
      state.settings.numberFormat = "compact";
      return state;
    },
  },
  {
    id: "boss-full-number-recovery",
    expectedBoss: "Nihil-Wächter",
    expectedGold: "999.999.999.999.999",
    expectedState: "REGENERATION",
    makeState: () => {
      const state = baseState(1, "b03-recovery-pyrook");
      unlockThroughZone(state, 10);
      state.zoneProgress["ether-crown"] = { stage: 10, clears: 2 };
      state.runVictories = 0;
      state.prestigeCount = 0;
      state.resources.gold = 999_999_999_999_999;
      state.pendingGold = 999_999_999_999_999;
      state.settings.numberFormat = "full";
      return state;
    },
  },
];

const openFixture = async (page: Page, fixture: MatrixFixture): Promise<void> => {
  const state = fixture.makeState();
  await page.addInitScript(
    ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
    { key: STORAGE_KEY, save: state },
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  /* This matrix inspects the already-filled cache. Collecting the unrelated
     return report would deliberately mutate the very values under test. Keep
     the unrelated modal out of every following combat re-render. */
  await page.evaluate(() => {
    const removeReturnReport = () => document.querySelector(".offline-report-backdrop")?.remove();
    new MutationObserver(removeReturnReport).observe(document.body, { childList: true, subtree: true });
    removeReturnReport();
  });
  if (await page.locator("#skip-tutorial").count()) await page.locator("#skip-tutorial").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
};

const expectStageGeometry = async (page: Page, expectBossScale = false): Promise<void> => {
  const geometry = await page.evaluate(() => {
    const selectors = [
      ".fighter--player",
      ".fighter--enemy",
      ".fighter--player .monster-avatar",
      ".fighter--enemy .monster-avatar",
      ".fighter--player .nameplate",
      ".fighter--enemy .nameplate",
      ".combat-zone-tabs",
      ".combat-account .player-account-card",
      '[data-live="run-gold"]',
      '[data-live="pending-gold"]',
    ];
    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const elements = selectors.map((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      const rect = element?.getBoundingClientRect();
      return {
        selector,
        exists: Boolean(element && rect),
        visible: Boolean(rect && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < viewport.width && rect.bottom > 0 && rect.top < viewport.height),
        containedX: Boolean(rect && rect.left >= -1 && rect.right <= viewport.width + 1),
        containedY: Boolean(rect && rect.top >= -1 && rect.bottom <= viewport.height + 1),
      };
    });
    const longValues = [...document.querySelectorAll<HTMLElement>('[data-live="run-gold"], [data-live="pending-gold"]')]
      .map((element) => ({
        live: element.dataset.live ?? "",
        text: element.textContent?.trim() ?? "",
        clientWidth: element.clientWidth,
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        scrollWidth: element.scrollWidth,
        clipped: element.scrollWidth > element.clientWidth + 1,
      }));
    const banner = document.querySelector<HTMLElement>('[data-live="battle-banner"]:not([hidden])');
    const overlapTargets = [
      ".fighter--player .monster-avatar",
      ".fighter--enemy .monster-avatar",
      ".fighter--player .nameplate",
      ".fighter--enemy .nameplate",
    ];
    const bannerOverlaps = banner
      ? overlapTargets.filter((selector) => {
          const target = document.querySelector<HTMLElement>(selector);
          if (!target) return false;
          const a = banner.getBoundingClientRect();
          const b = target.getBoundingClientRect();
          return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2
            && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
        })
      : [];
    const images = [...document.querySelectorAll<HTMLImageElement>(".fighter .monster-avatar img")]
      .map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        };
      });
    const accountCardWidth = document.querySelector<HTMLElement>(".combat-account .player-account-card")?.getBoundingClientRect().width ?? 0;
    const bossPresent = Boolean(document.querySelector(".fighter--enemy .monster-avatar--boss"));
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      elements,
      longValues,
      bannerOverlaps,
      images,
      accountCardWidth,
      bossPresent,
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewport.width + 1);
  for (const element of geometry.elements) {
    expect(element.exists, element.selector).toBe(true);
    expect(element.visible, element.selector).toBe(true);
    expect(element.containedX, element.selector).toBe(true);
    expect(element.containedY, element.selector).toBe(true);
  }
  expect(geometry.longValues).toHaveLength(2);
  for (const value of geometry.longValues) {
    expect(value.text).not.toBe("");
    const minimumFontSize = geometry.viewport.width <= 620 && value.live === "run-gold" ? 9 : 7;
    expect(value.fontSize, `${value.live}: ${value.text} font size`).toBeGreaterThanOrEqual(minimumFontSize);
    expect(value.clipped, `${value.live}: ${value.text} (${value.clientWidth}/${value.scrollWidth}px)`).toBe(false);
  }
  if (geometry.viewport.width <= 620) expect(geometry.accountCardWidth).toBeGreaterThanOrEqual(280);
  expect(geometry.bannerOverlaps).toEqual([]);
  expect(geometry.images.length).toBeGreaterThanOrEqual(2);
  for (const image of geometry.images) {
    expect(image.complete).toBe(true);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.left).toBeGreaterThanOrEqual(-1);
    expect(image.right).toBeLessThanOrEqual(geometry.viewport.width + 1);
  }
  if (expectBossScale) {
    expect(geometry.bossPresent).toBe(true);
    expect(geometry.images[1].height, "boss art is visually larger than the Rookie").toBeGreaterThanOrEqual(geometry.images[0].height * 1.15);
  }
};

for (const fixture of matrix) {
  test(`${fixture.id} remains readable`, async ({ page }, testInfo: TestInfo) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") runtimeErrors.push(message.text());
    });

    await openFixture(page, fixture);
    const scene = page.getByTestId("combat-scene");
    await expect(scene.locator(".combat-zone-tab.is-active small")).toContainText("STAGE 10/10");
    await expect(scene.locator(".fighter--enemy .nameplate small").first()).toHaveText("ZONENBOSS");
    await expect(scene.locator(".fighter--enemy .nameplate strong")).toHaveText(fixture.expectedBoss);
    await expect(scene.locator(".fighter--enemy .monster-avatar--boss")).toHaveAttribute("data-boss", "true");
    await expect(scene.locator('[data-live="run-gold"]')).toHaveText(fixture.expectedGold);

    await scene.locator('[data-combat-panel="loot"]').click();
    await expect(scene.locator(".combat-panel--loot")).toHaveClass(/is-open/);
    await expect(scene.locator('[data-live="pending-gold"]')).toHaveText(fixture.expectedGold);
    await expectStageGeometry(page, true);

    await expect(scene.locator('[data-live="battle-status"]')).toHaveText(fixture.expectedState, { timeout: 4_000 });
    const stateClass = fixture.expectedState === "STAGE GESCHAFFT" ? "victory" : "recovering";
    const banner = scene.locator(`.battle-state-banner--${stateClass}`);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(fixture.expectedState);
    if (fixture.expectedState === "REGENERATION") await expect(banner).toContainText("RESONANZ WIRD NEU GEKOPPELT");

    await expectStageGeometry(page);
    await page.screenshot({
      path: testInfo.outputPath(`${fixture.id}-${testInfo.project.name}.png`),
      animations: "disabled",
    });
    expect(runtimeErrors).toEqual([]);
  });
}
