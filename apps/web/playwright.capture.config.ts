import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /ui-capture\.spec\.ts/,
  fullyParallel: false,
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  outputDir: "../../test-results/ui-capture",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5173",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
