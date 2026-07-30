import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const liveBaseUrl = process.env.LIVE_AUTH_BASE_URL;
const liveEmail = process.env.LIVE_AUTH_EMAIL;
const livePassword = process.env.LIVE_AUTH_PASSWORD;
const liveGuildName = process.env.LIVE_GUILD_NAME;
const captureRoot = fileURLToPath(new URL("../../../artifacts/ui-captures/", import.meta.url));

test.skip(!liveBaseUrl || !liveEmail || !livePassword || !liveGuildName, "requires an ephemeral verified live account");

test("active online guild hub exposes DNA, social and shared activity surfaces", async ({ page }) => {
  const diagnostics: string[] = [];
  page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") diagnostics.push(`console: ${message.text()}`); });
  page.on("response", async (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    if (!url.includes("/api/")) return;
    let body = "";
    try { body = (await response.text()).slice(0, 240); } catch { /* diagnostic only */ }
    diagnostics.push(`api:${response.status()} ${url} ${body}`);
  });
  await page.goto(liveBaseUrl as string);
  const meta = await page.evaluate(async () => {
    const response = await fetch("/api/v1/meta", { headers: { accept: "application/json" } });
    return await response.json() as { features?: { guilds?: boolean; guildDna?: boolean } };
  });
  expect(meta.features).toMatchObject({ guilds: true, guildDna: true });

  await expect(page.getByTestId("login-screen")).toBeVisible();
  await page.locator("#login-identifier").fill(liveEmail as string);
  await page.locator("#login-password").fill(livePassword as string);
  const loginResponsePromise = page.waitForResponse((response) => response.url().includes("/api/v1/auth/login"));
  await page.getByTestId("login-submit").click();
  const loginResponse = await loginResponsePromise;
  diagnostics.push(`login:${loginResponse.status()}`);
  await expect(page.locator(".auth-message--error")).toHaveCount(0);

  await expect(page.getByTestId("starter-dialog")).toBeVisible({ timeout: 20_000 });
  const starterButton = page.locator('.starter-card button[data-starter="pyrook"], .starter-card button').first();
  if (await starterButton.count()) {
    await expect(starterButton).toBeEnabled();
    await starterButton.click();
    await expect(page.getByRole("button", { name: /PYROOK/ }), diagnostics.join("\n")).toHaveCount(0, { timeout: 20_000 });
  }
  const skipTutorial = page.locator("#skip-tutorial");
  if (await skipTutorial.count()) await skipTutorial.click();
  const combat = page.getByTestId("combat-scene");
  try {
    await expect(combat).toBeVisible({ timeout: 5_000 });
  } catch (error) {
    const buttons = await page.locator("button").allTextContents();
    throw new Error(`combat not reached; starterButtons=${await starterButton.count()} buttons=${JSON.stringify(buttons)} diagnostics=${diagnostics.join(" | ")}; ${String(error)}`);
  }

  await page.locator('.combat-rail [data-view="guild"]').click();
  await expect(page.locator(".guild-page")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Finde deine Gilde", { exact: true })).toBeVisible();
  await expect(page.locator(".guild-page")).not.toContainText(/UI-Test|Spielserver|Onlineserver|serverautoritativ|PostgreSQL/iu);

  const create = page.locator("#guild-create-form");
  await create.locator('input[name="name"]').fill(liveGuildName as string);
  await create.locator('input[name="tag"]').fill("BR08");
  await create.locator('textarea[name="description"]').fill("QA-Nachweis für den aktiven Gildenhub.");
  await create.locator("button").click();

  await expect(page.locator(".guild-page--active")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".guild-command-hero")).toContainText(liveGuildName as string);
  await expect(page.locator(".guild-dna-live")).toBeVisible();
  await expect(page.locator(".dna-helix")).toBeVisible();
  await expect(page.locator(".guild-boss-card")).toContainText("Chromawyrm Prime");
  await expect(page.locator(".guild-task-card")).toBeVisible();
  await expect(page.locator(".guild-expedition-card")).toBeVisible();
  await expect(page.locator(".guild-chat-panel")).toContainText("Gildenchat");
  await expect(page.locator("[data-guild-gene]").first()).toBeVisible();
  await expect(page.locator(".guild-page")).not.toContainText(/UI-Test|Spielserver|Onlineserver|serverautoritativ|PostgreSQL|Ledger|atomar/iu);

  await page.screenshot({ path: `${captureRoot}/live-guild.png`, fullPage: true });
});
