import { defineConfig, devices } from "@playwright/test";

const useRealApi = process.env.PLAYWRIGHT_REAL_API === "true";
const baseURL = useRealApi ? "http://localhost:8080" : "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: process.env.PLAYWRIGHT_SCREENSHOTS ? [] : ["screenshots.spec.ts"],
  testMatch: process.env.PLAYWRIGHT_SCREENSHOTS ? ["screenshots.spec.ts"] : undefined,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
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
  // Contra a API real (PLAYWRIGHT_REAL_API=true), o stack já deve estar no
  // ar via `docker compose up` em http://localhost:8080; nenhum servidor é
  // iniciado automaticamente nesse caso.
  webServer: useRealApi
    ? undefined
    : {
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
