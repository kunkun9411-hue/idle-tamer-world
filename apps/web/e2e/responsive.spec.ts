import { expect, test } from "@playwright/test";

import { createInitialState, createMonster } from "../src/game/rules";
import { STORAGE_KEY } from "../src/game/storage";

test("starter flow and combat HUD fit the configured viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("starter-dialog")).toBeVisible();
  await page.getByTestId("starter-pyrook").click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();

  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();

  const playerCard = page.locator(".combat-account .player-account-card");
  await expect(playerCard).toBeVisible();
  await expect(playerCard.locator(".player-account-card__identity > strong")).toBeVisible();
  await expect(playerCard.locator(".player-account-card__metric")).toHaveCount(3);
  const accountLayout = await page.evaluate(() => {
    const rect = (selector: string): DOMRect | undefined => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
    const card = rect(".combat-account .player-account-card");
    const copy = rect(".combat-account .player-account-card__copy");
    const identity = rect(".combat-account .player-account-card__identity > strong");
    const zones = rect(".combat-zone-tabs");
    const duel = rect(".combat-duel");
    const zoneButtons = [...document.querySelectorAll<HTMLElement>(".combat-zone-tabs .combat-zone-tab")]
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, width: bounds.width };
      });
    const metrics = [...document.querySelectorAll<HTMLElement>(".combat-account .player-account-card__metric")]
      .map((element) => element.getBoundingClientRect().width);
    return {
      viewportWidth: innerWidth,
      card: card && { left: card.left, right: card.right, top: card.top, bottom: card.bottom, width: card.width },
      copyWidth: copy?.width ?? 0,
      identityWidth: identity?.width ?? 0,
      metricWidths: metrics,
      zones: zones && { top: zones.top, bottom: zones.bottom },
      zoneButtons,
      duel: duel && { top: duel.top },
    };
  });
  expect(accountLayout.card).toBeTruthy();
  expect(accountLayout.copyWidth).toBeGreaterThan(0);
  expect(accountLayout.identityWidth).toBeGreaterThan(0);
  expect(accountLayout.metricWidths).toHaveLength(3);
  for (const width of accountLayout.metricWidths) expect(width).toBeGreaterThan(0);
  expect(accountLayout.card!.left).toBeGreaterThanOrEqual(-1);
  expect(accountLayout.card!.right).toBeLessThanOrEqual(accountLayout.viewportWidth + 1);
  if (accountLayout.viewportWidth <= 520) {
    expect(accountLayout.card!.width).toBeGreaterThanOrEqual(220);
    expect(accountLayout.card!.bottom).toBeLessThanOrEqual((accountLayout.zones?.top ?? 0) + 1);
    for (const zoneButton of accountLayout.zoneButtons) {
      expect(zoneButton.width).toBeGreaterThan(0);
      expect(zoneButton.left, JSON.stringify(accountLayout)).toBeGreaterThanOrEqual(-1);
      expect(zoneButton.right).toBeLessThanOrEqual(accountLayout.viewportWidth + 1);
    }
    expect(accountLayout.zones!.bottom).toBeLessThanOrEqual((accountLayout.duel?.top ?? 0) + 1);
  }

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.innerWidth + 1);

  const selectors = [".fighter--player", ".fighter--enemy", ".combat-rail", ".combat-control-dock"];
  const boxes = await page.evaluate((targets) => Object.fromEntries(targets.map((selector) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    return [selector, rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null];
  })), selectors);
  for (const selector of selectors) {
    const box = boxes[selector];
    expect(box, `${selector} needs a visible box`).not.toBeNull();
    expect(box!.height, `${selector} must occupy visible space`).toBeGreaterThan(0);
    expect(box!.x, `${selector} starts inside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width, `${selector} ends inside the viewport`).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(box!.y, `${selector} starts inside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(box!.y + box!.height, `${selector} ends inside the viewport`).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) + 1);
  }
  const rail = boxes[".combat-rail"]!;
  for (const selector of [".fighter--player", ".fighter--enemy"]) {
    const fighter = boxes[selector]!;
    const overlapWidth = Math.min(rail.x + rail.width, fighter.x + fighter.width) - Math.max(rail.x, fighter.x);
    const overlapHeight = Math.min(rail.y + rail.height, fighter.y + fighter.height) - Math.max(rail.y, fighter.y);
    expect(overlapWidth > 4 && overlapHeight > 4, `${selector} must not be covered by the primary navigation`).toBe(false);
  }

  const fighterVisibility = await page.evaluate(() => [".fighter--player", ".fighter--enemy"].map((selector) => {
    const fighter = document.querySelector<HTMLElement>(selector);
    const image = fighter?.querySelector<HTMLImageElement>(".monster-avatar img");
    if (!fighter || !image) return { selector, visible: false, reason: "missing fighter or image" };
    const rect = image.getBoundingClientRect();
    const fighterStyle = getComputedStyle(fighter);
    const imageStyle = getComputedStyle(image);
    const visible = image.complete
      && image.naturalWidth > 0
      && rect.width > 40
      && rect.height > 40
      && rect.top >= 0
      && rect.bottom <= innerHeight
      && fighterStyle.display !== "none"
      && fighterStyle.visibility === "visible"
      && Number.parseFloat(fighterStyle.opacity) > 0
      && imageStyle.display !== "none"
      && imageStyle.visibility === "visible"
      && Number.parseFloat(imageStyle.opacity) > 0;
    return {
      selector,
      visible,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      fighterStyle: { display: fighterStyle.display, visibility: fighterStyle.visibility, opacity: fighterStyle.opacity },
      imageStyle: { display: imageStyle.display, visibility: imageStyle.visibility, opacity: imageStyle.opacity },
    };
  }));
  for (const result of fighterVisibility) expect(result.visible, JSON.stringify(result)).toBe(true);

  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator("#start-prestige").click();
  await expect(page.getByTestId("prestige-scene")).toBeVisible();
  await expect(page.getByTestId("prestige-crystal").locator("img")).toBeVisible();
  const prestigeLayout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(prestigeLayout.documentWidth).toBeLessThanOrEqual(prestigeLayout.innerWidth + 1);
  expect(prestigeLayout.bodyWidth).toBeLessThanOrEqual(prestigeLayout.innerWidth + 1);
});

test("generated login and offline chrome stay inside the configured viewport", async ({ page }) => {
  const state = createInitialState(() => Date.now() - 10 * 60_000);
  const starter = createMonster("pyrook", 5, 0, 0, "rookie", () => "responsive-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.pendingGold = 120;
  state.cacheSlotsUsed = 1;
  state.tutorialStep = 4;

  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });
  await page.goto("/");

  const loginLayout = await page.locator(".login-panel").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(loginLayout.left).toBeGreaterThanOrEqual(-1);
  expect(loginLayout.right).toBeLessThanOrEqual(loginLayout.viewportWidth + 1);
  expect(loginLayout.top).toBeGreaterThanOrEqual(-1);
  expect(loginLayout.bottom).toBeLessThanOrEqual(loginLayout.viewportHeight + 1);
  if (loginLayout.viewportWidth <= 540) {
    const metaLayout = await page.locator(".login-form__meta").evaluate((element) => {
      const panel = element.closest<HTMLElement>(".login-panel")!.getBoundingClientRect();
      const controls = [...element.children].map((child) => {
        const rect = child.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      });
      return { panelLeft: panel.left, panelRight: panel.right, controls };
    });
    expect(metaLayout.controls).toHaveLength(2);
    expect(metaLayout.controls[0].left - metaLayout.panelLeft).toBeGreaterThanOrEqual(32);
    expect(metaLayout.panelRight - metaLayout.controls[1].right).toBeGreaterThanOrEqual(32);
  }

  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("offline-report")).toBeVisible();
  const offlineLayout = await page.getByTestId("offline-report").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(offlineLayout.left).toBeGreaterThanOrEqual(-1);
  expect(offlineLayout.right).toBeLessThanOrEqual(offlineLayout.viewportWidth + 1);
  expect(offlineLayout.top).toBeGreaterThanOrEqual(-1);
  expect(offlineLayout.bottom).toBeLessThanOrEqual(offlineLayout.viewportHeight + 1);

  const actionLayout = await page.locator(".offline-report__actions").evaluate((element) => {
    const buttons = [...element.querySelectorAll("button")];
    return buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      const content = document.createRange();
      content.selectNodeContents(button);
      const contentRect = content.getBoundingClientRect();
      return { width: rect.width, left: rect.left, right: rect.right, contentLeft: contentRect.left, contentRight: contentRect.right };
    });
  });
  expect(actionLayout).toHaveLength(1);
  for (const button of actionLayout) {
    expect(button.width).toBeLessThanOrEqual(211);
    expect(button.contentLeft).toBeGreaterThanOrEqual(button.left);
    expect(button.contentRight).toBeLessThanOrEqual(button.right);
  }
});

test("objectives replaces combat in the eight-slot mobile navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("starter-dialog").count()) await page.getByTestId("starter-pyrook").click();
  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();

  await page.locator('[data-combat-panel="missions"]').click();
  await page.locator('.combat-objective-hud [data-view="objectives"]').click();
  await expect(page.locator(".objectives-page")).toBeVisible();

  const nav = page.locator(".main-nav");
  await expect(nav.locator(".nav-button")).toHaveCount(8);
  await expect(nav.locator('[data-view="objectives"]')).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[data-view="expedition"]')).toHaveCount(0);
  await expect(nav.locator('[data-view="guild"]')).toBeVisible();
  expect(await nav.evaluate((element) => ({
    horizontal: element.scrollWidth <= element.clientWidth + 1,
    vertical: element.scrollHeight <= element.clientHeight + 1,
  }))).toEqual({ horizontal: true, vertical: true });
  if ((page.viewportSize()?.width ?? 0) <= 540) {
    const mobileNavigation = await nav.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const buttons = [...element.querySelectorAll<HTMLElement>(".nav-button")].map((button) => {
        const buttonBounds = button.getBoundingClientRect();
        const label = button.querySelector<HTMLElement>(".nav-label-short");
        return {
          height: buttonBounds.height,
          left: buttonBounds.left,
          right: buttonBounds.right,
          label: label?.textContent?.trim() ?? "",
          labelVisible: label ? getComputedStyle(label).display !== "none" && label.getBoundingClientRect().width > 0 : false,
        };
      });
      return { height: bounds.height, buttons, viewportWidth: document.documentElement.clientWidth };
    });
    expect(mobileNavigation.height).toBeLessThanOrEqual(58);
    expect(mobileNavigation.buttons).toHaveLength(8);
    for (const button of mobileNavigation.buttons) {
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(button.left).toBeGreaterThanOrEqual(-1);
      expect(button.right).toBeLessThanOrEqual(mobileNavigation.viewportWidth + 1);
      expect(button.label).not.toBe("");
      expect(button.labelVisible).toBe(true);
    }
  }

  await page.locator('.objective-overview [data-view="expedition"]').click();
  await expect(page.getByTestId("combat-scene")).toBeVisible();
});

test("static routes keep the complete player account card in the header", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 4, 2, 0, "rookie", () => "static-header-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  state.resources.gold = 193_822;
  state.resources.cores = 26;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  await page.locator('.combat-rail [data-view="research"]').click();
  await expect(page.locator(".app-shell--research")).toBeVisible();

  const card = page.locator(".topbar__account .player-account-card");
  await expect(card).toBeVisible();
  await expect(card.locator(".player-account-card__identity > strong")).toBeVisible();
  await expect(card.locator(".player-account-card__metric")).toHaveCount(3);
  await expect(card.locator('[data-live="rank"]')).toBeVisible();
  await expect(card.locator('[data-live="run-gold"]')).toHaveText("193.822");
  await expect(card.locator('[data-live="prestige-cores"]')).toHaveText("26");

  const headerLayout = await page.evaluate(() => {
    const bounds = (selector: string): DOMRect => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
    const cardRect = bounds(".topbar__account .player-account-card");
    const headerRect = bounds(".topbar");
    const navRect = bounds(".main-nav");
    const metricWidths = [...document.querySelectorAll<HTMLElement>(".topbar__account .player-account-card__metric")]
      .map((element) => element.getBoundingClientRect().width);
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      card: { left: cardRect.left, right: cardRect.right, top: cardRect.top, bottom: cardRect.bottom, width: cardRect.width },
      header: { top: headerRect.top, bottom: headerRect.bottom, left: headerRect.left, right: headerRect.right },
      nav: { top: navRect.top, bottom: navRect.bottom },
      copyWidth: bounds(".topbar__account .player-account-card__copy").width,
      nameWidth: bounds(".topbar__account .player-account-card__identity > strong").width,
      metricWidths,
    };
  });
  expect(headerLayout.documentWidth).toBeLessThanOrEqual(headerLayout.viewportWidth + 1);
  expect(headerLayout.card.left).toBeGreaterThanOrEqual(headerLayout.header.left - 1);
  expect(headerLayout.card.right).toBeLessThanOrEqual(headerLayout.header.right + 1);
  expect(headerLayout.card.top).toBeGreaterThanOrEqual(headerLayout.header.top - 1);
  expect(headerLayout.card.bottom).toBeLessThanOrEqual(headerLayout.header.bottom + 1);
  expect(headerLayout.copyWidth).toBeGreaterThan(0);
  expect(headerLayout.nameWidth).toBeGreaterThan(0);
  for (const width of headerLayout.metricWidths) expect(width).toBeGreaterThan(0);
  if (headerLayout.viewportWidth <= 520) expect(headerLayout.card.width).toBeGreaterThanOrEqual(220);
  if (headerLayout.viewportWidth <= 900) expect(headerLayout.header.bottom).toBeLessThan(headerLayout.nav.top);
});

test("mobile collection routes stay compact without hiding choices", async ({ page }) => {
  const state = createInitialState(() => Date.now());
  const starter = createMonster("pyrook", 4, 2, 0, "rookie", () => "responsive-collection-pyrook");
  state.roster = [starter];
  state.activeMonsterUid = starter.uid;
  state.tutorialStep = 4;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: STORAGE_KEY, save: state });

  await page.goto("/");
  await page.getByTestId("login-submit").click();
  if (await page.getByTestId("offline-report").count()) await page.getByTestId("offline-collect").click();
  await page.locator('.combat-rail [data-view="dispatch"]').click();
  await expect(page.locator(".dispatch-page")).toBeVisible();

  const viewportWidth = page.viewportSize()?.width ?? 0;
  if (viewportWidth <= 540) {
    const emptySlots = page.locator(".dispatch-slot.is-empty");
    await expect(emptySlots).toHaveCount(2);
    const slotHeights = await emptySlots.evaluateAll((slots) => slots.map((slot) => slot.getBoundingClientRect().height));
    for (const height of slotHeights) {
      expect(height).toBeGreaterThanOrEqual(100);
      expect(height).toBeLessThanOrEqual(112);
    }
  }

  await page.locator(".player-account-card").click();
  await expect(page.locator(".profile-page")).toBeVisible();
  if (viewportWidth >= 360 && viewportWidth <= 540) {
    const catalogue = await page.locator(".profile-page .cosmetic-grid").evaluate((grid) => {
      const cards = [...grid.querySelectorAll<HTMLElement>(".cosmetic-card")].map((card) => card.getBoundingClientRect());
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length,
        firstRow: cards.length >= 2 && Math.abs(cards[0].top - cards[1].top) <= 1,
        maxCardHeight: Math.max(...cards.map((card) => card.height)),
      };
    });
    expect(catalogue.columns).toBe(2);
    expect(catalogue.firstRow).toBe(true);
    expect(catalogue.maxCardHeight).toBeLessThanOrEqual(142);

    await page.setViewportSize({ width: 320, height: 844 });
    const narrowColumns = await page.locator(".profile-page .cosmetic-grid")
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length);
    expect(narrowColumns).toBe(1);
  }
});
