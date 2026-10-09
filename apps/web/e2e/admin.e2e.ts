import { expect, test } from "@playwright/test";

test.describe("cms admin", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "chromium desktop only",
  );

  test("login page renders and a seeded editor can sign in", async ({ page }) => {
    const res = await page.goto("/admin/login");
    expect(res?.status()).toBe(200);
    await page.getByLabel(/email/i).fill("editor@ohworks.local");
    await page
      .getByLabel(/password/i)
      .fill(process.env.SEED_ADMIN_PASSWORD ?? "ohworks-admin-local");
    await page.getByRole("button", { name: /log ?in/i }).click();
    await expect(page).toHaveURL(/\/admin\/?(\?.*)?$/, { timeout: 15_000 });
    await expect(page.getByRole("link", { name: /^Articles$/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Sources$/ }).first()).toBeVisible();
  });

  test("admin and API are kept out of the index", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Disallow: /api/");
  });
});
