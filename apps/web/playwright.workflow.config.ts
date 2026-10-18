import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/**
 * The marketplace loop end to end (e2e/*.workflow.ts), on its own: `pnpm test:workflow`. It publishes a
 * real site for a few minutes, which would upset the counts the other tests check if they ran beside
 * it, so it runs alone, one step at a time, with an HTML report in playwright-report/workflow/.
 */
export default defineConfig({
  ...base,
  testMatch: "**/*.workflow.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/workflow", open: "never" }],
    // A plain summary for people, beside it: playwright-report/workflow/summary.html.
    ["./e2e/workflow-reporter.ts"],
  ],
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
});
