import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "scripts/e2e-report.json" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
    trace: "on-first-retry",
    locale: "vi-VN",
  },
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : {
        command: "pnpm dev:all",
        url: "http://127.0.0.1:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
