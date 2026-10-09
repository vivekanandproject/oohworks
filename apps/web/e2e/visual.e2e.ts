import { test } from "@playwright/test";

/** Full-page captures for review. Not assertions; the SEO contract lives in home.e2e.ts. */
test("capture landing page", async ({ page }, info) => {
  test.skip(!["desktop", "phone"].includes(info.project.name), "chromium captures only");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: info.outputPath(`home-${info.project.name}.png`), fullPage: true });
});
