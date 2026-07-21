import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { ACTIVE_ACCOUNT_NAMESPACE_KEY } from "../src/account/client";

const liveBaseUrl = process.env.LIVE_AUTH_BASE_URL;
const liveEmail = process.env.LIVE_AUTH_EMAIL;
const livePassword = process.env.LIVE_AUTH_PASSWORD;

test.skip(!liveBaseUrl || !liveEmail || !livePassword, "requires an ephemeral verified live account");

interface LivePage {
  page: Page;
  diagnostics: string[];
}

const login = async (context: BrowserContext): Promise<LivePage> => {
  const page = await context.newPage();
  const diagnostics: string[] = [];
  page.on("requestfailed", (request) => diagnostics.push(`request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown"})`));
  page.on("pageerror", (error) => diagnostics.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.push(`console error: ${message.text()}`);
  });
  await page.goto(liveBaseUrl as string);
  const apiProbe = await page.evaluate(async () => {
    try {
      const response = await fetch("/api/v1/meta", { headers: { accept: "application/json" } });
      return { ok: response.ok, status: response.status, error: "" };
    } catch (error) {
      return { ok: false, status: 0, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
    }
  });
  if (!apiProbe.ok) throw new Error(`live API probe failed: ${apiProbe.status} ${apiProbe.error}`);
  await expect(page.getByTestId("login-screen")).toBeVisible();
  await expect(page.getByTestId("login-submit")).toBeEnabled();
  await page.locator("#login-identifier").fill(liveEmail as string);
  await page.locator("#login-password").fill(livePassword as string);
  await page.getByTestId("login-submit").click();
  const status = page.locator(".auth-message--error");
  await page.waitForTimeout(250);
  if (await status.isVisible()) {
    diagnostics.push(`visible auth error: ${await status.innerText()}`);
    throw new Error(diagnostics.join("\n"));
  }
  return { page, diagnostics };
};

test("one account keeps the same profile and starter across two real browser contexts", async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  try {
    const first = await login(firstContext);
    const firstPage = first.page;
    await expect(firstPage.getByTestId("starter-dialog"), first.diagnostics.join("\n")).toBeVisible({ timeout: 20_000 });
    await firstPage.getByTestId("starter-pyrook").click();
    await expect(firstPage.getByTestId("combat-scene")).toBeVisible();
    await firstPage.getByRole("button", { name: "ÜBERSPRINGEN" }).click();
    await firstPage.getByRole("button", { name: "Monster", exact: true }).click();
    await expect(firstPage.locator("[data-level]").first()).toBeEnabled({ timeout: 20_000 });
    await firstPage.locator("[data-level]").first().click();
    await expect.poll(() => firstPage.evaluate(async () => {
      const response = await fetch("/api/v1/run", { credentials: "include" });
      const body = await response.json() as { snapshot?: { activeMonster?: { level?: number } } };
      return { status: response.status, level: body.snapshot?.activeMonster?.level };
    })).toEqual({ status: 200, level: 2 });
    const foundationGem = firstPage.locator('[data-equip-gem="common-crimson-triangle"]');
    await expect(foundationGem).toContainText("1×");
    await foundationGem.click();
    await expect(firstPage.getByText("Gem-Ausrüstung folgt in Block 6", { exact: true })).toBeVisible();
    await expect(foundationGem).toContainText("1×");
    const firstNamespace = await firstPage.evaluate((key) => localStorage.getItem(key), ACTIVE_ACCOUNT_NAMESPACE_KEY);
    expect(firstNamespace).toMatch(/^[0-9a-f-]{36}$/u);

    const second = await login(secondContext);
    const secondPage = second.page;
    await expect(secondPage.getByTestId("combat-scene"), second.diagnostics.join("\n")).toBeVisible({ timeout: 20_000 });
    await expect(secondPage.getByTestId("starter-dialog")).toHaveCount(0);
    await expect.poll(() => secondPage.evaluate(async () => {
      const response = await fetch("/api/v1/run", { credentials: "include" });
      const body = await response.json() as { snapshot?: { activeMonster?: { definitionId?: string; level?: number } } };
      return { status: response.status, monster: body.snapshot?.activeMonster?.definitionId, level: body.snapshot?.activeMonster?.level };
    })).toEqual({ status: 200, monster: "pyrook", level: 2 });
    const secondNamespace = await secondPage.evaluate((key) => localStorage.getItem(key), ACTIVE_ACCOUNT_NAMESPACE_KEY);
    expect(secondNamespace).toBe(firstNamespace);

    const sessionCount = await firstPage.evaluate(async () => {
      const response = await fetch("/api/v1/auth/sessions", { credentials: "include" });
      const body = await response.json() as { sessions: unknown[] };
      return { status: response.status, count: body.sessions.length };
    });
    expect(sessionCount).toEqual({ status: 200, count: 2 });

    const revokeStatus = await firstPage.evaluate(async () => {
      const bootstrap = await fetch("/api/v1/bootstrap", { credentials: "include" });
      const { csrfToken } = await bootstrap.json() as { csrfToken: string };
      const response = await fetch("/api/v1/auth/logout-others", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: "{}",
      });
      return response.status;
    });
    expect(revokeStatus).toBe(204);

    await secondPage.reload();
    await expect(secondPage.getByTestId("login-screen")).toBeVisible();
    await firstPage.reload();
    await expect(firstPage.getByTestId("combat-scene")).toBeVisible();

    const deletionStatus = await firstPage.evaluate(async (password) => {
      const bootstrap = await fetch("/api/v1/bootstrap", { credentials: "include" });
      const { csrfToken } = await bootstrap.json() as { csrfToken: string };
      const response = await fetch("/api/v1/account/deletion", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ confirmation: "DELETE", password }),
      });
      return response.status;
    }, livePassword as string);
    expect(deletionStatus).toBe(200);

    await firstPage.reload();
    await expect(firstPage.getByTestId("login-screen")).toBeVisible();
    await expect(firstPage.getByTestId("login-submit")).toBeEnabled();
    await firstPage.locator("#login-identifier").fill(liveEmail as string);
    await firstPage.locator("#login-password").fill(livePassword as string);
    await firstPage.getByTestId("login-submit").click();
    await expect(firstPage.getByTestId("cancel-account-deletion")).toBeVisible();
    await firstPage.getByTestId("cancel-account-deletion").click();
    await expect(firstPage.getByTestId("combat-scene")).toBeVisible();

    const logoutStatus = await firstPage.evaluate(async () => {
      const bootstrap = await fetch("/api/v1/bootstrap", { credentials: "include" });
      const { csrfToken } = await bootstrap.json() as { csrfToken: string };
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: "{}",
      });
      return response.status;
    });
    expect(logoutStatus).toBe(204);
    await firstPage.reload();
    await expect(firstPage.getByTestId("login-screen")).toBeVisible();
  } finally {
    await firstContext.close();
    await secondContext.close();
  }
});
