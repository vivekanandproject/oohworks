import { expect, test } from "@playwright/test";

test.describe("search page", () => {
  test("shows what it understood as removable chips", async ({ page }) => {
    await page.goto("/search/?q=20x10+hoardings+in+Bengaluru+under+1+lakh");
    const understood = page.locator("[data-section='understood']");
    await expect(understood).toContainText("Bengaluru");
    await expect(understood).toContainText("Hoardings");
    await expect(understood).toContainText("20 × 10 ft");
    await expect(understood).toContainText("Under ₹ 1 lakh a month");
    await expect(page.locator("[data-section='results']")).toContainText(
      "No hoardings in Bengaluru yet",
    );
    await expect(page.locator("[data-section='formats'] [aria-pressed='true']")).toHaveText(
      "Hoardings",
    );
    await expect(page.locator("[data-section='cities'] [aria-pressed='true']")).toHaveText(
      "Bengaluru",
    );
  });

  test("removing a chip clears that facet", async ({ page }) => {
    await page.goto("/search/?q=hoardings+in+Bengaluru");
    await page.getByRole("link", { name: "Remove Bengaluru" }).click();
    await expect(page).toHaveURL(/q=hoardings/);
    await expect(page).not.toHaveURL(/Bengaluru|bengaluru/);
    await expect(page.locator("[data-section='cities'] [aria-pressed='true']")).toHaveCount(0);
  });

  test("filter chips toggle through the URL and stay noindex", async ({ page }) => {
    await page.goto("/search/");
    await page
      .locator("[data-section='formats']")
      .getByRole("link", { name: "LED screens" })
      .click();
    await expect(page).toHaveURL(/\/search\/\?format=led-screen$/);
    await page.locator("[data-section='cities']").getByRole("link", { name: "Mumbai" }).click();
    await expect(page).toHaveURL(/\/search\/\?city=mumbai&format=led-screen$/);
    await expect(page.locator("[data-section='results']")).toContainText(
      "No led screens in Mumbai yet",
    );
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });

  test("one accent element, the search button", async ({ page }) => {
    await page.goto("/search/?q=hoardings");
    await expect(page.locator(".oh-btn.accent")).toHaveCount(1);
  });

  test("follow form stores a valid email and reports back", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const ok = await request.post("/api/follow/", {
      form: {
        email: "playwright@ohworks.local",
        city: "bengaluru",
        format: "hoarding",
        q: "test",
        return: "/search/?q=test&city=bengaluru",
      },
      maxRedirects: 0,
    });
    expect(ok.status()).toBe(303);
    expect(ok.headers()["location"]).toContain("followed=1");
    const bad = await request.post("/api/follow/", {
      form: { email: "not-an-email", return: "/search/" },
      maxRedirects: 0,
    });
    expect(bad.status()).toBe(303);
    expect(bad.headers()["location"]).toContain("follow=invalid");
    const bot = await request.post("/api/follow/", {
      form: { email: "bot@example.com", company: "x", return: "/search/" },
      maxRedirects: 0,
    });
    expect(bot.headers()["location"]).toContain("followed=1");
    const unsafe = await request.post("/api/follow/", {
      form: { email: "a@b.co", return: "//evil.example" },
      maxRedirects: 0,
    });
    expect(unsafe.headers()["location"]).toMatch(/\/search\/\?followed=1$/);
  });

  test("after following, the page confirms", async ({ page }) => {
    await page.goto("/search/?city=pune&followed=1");
    await expect(page.getByRole("status")).toContainText("You are on the list");
    await expect(page.locator("[data-section='follow']")).toHaveCount(0);
  });
});
