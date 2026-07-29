import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-qa",
  fullyParallel: false,
  timeout: 45_000,
  workers: 1,
  reporter: "list",
  outputDir: "../../test-results/web-qa",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "chromium-tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1_180 }, isMobile: true, hasTouch: true },
    },
    {
      name: "chromium-mobile-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_ENABLE_QA: "true",
      VITE_ACCOUNT_API: "false",
    },
  },
});
