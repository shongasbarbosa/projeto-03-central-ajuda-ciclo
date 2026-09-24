import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: process.env.PLAYWRIGHT_SCREENSHOTS ? [] : ["screenshots.spec.ts"],
  testMatch: process.env.PLAYWRIGHT_SCREENSHOTS ? ["screenshots.spec.ts"] : undefined,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    actionTimeout: 10_000,
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_DEMO_MODE: "true",
      VITE_API_URL: "http://localhost:8000/api",
    },
    timeout: 60_000,
  },
});
