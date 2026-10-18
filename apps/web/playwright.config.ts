import { defineConfig, devices } from "@playwright/test";
import { TEST_PORT as PORT } from "./scripts/test-env.mjs";

/**
 * Tests run against the test build and the test database, never the development ones:
 *   pnpm --filter @ohworks/web test:db       the database, with its sample owners, sites and pieces
 *   pnpm --filter @ohworks/web build:test    the build, in .next-verify
 *   pnpm --filter @ohworks/web test:e2e      starts the server below if none is running
 */

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  webServer: {
    command: `pnpm serve:test -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/health/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "webkit-phone", use: { ...devices["iPhone 14"] } },
    // Playwright's Firefox build does not launch on macOS 27 yet; CI (Linux) always runs it.
    ...(process.env.CI || process.env.PW_FIREFOX
      ? [{ name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } }]
      : []),
  ],
});
