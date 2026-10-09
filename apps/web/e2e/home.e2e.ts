import { expect, test } from "@playwright/test";

const LANDING = ["/", "/charter/", "/for-owners/", "/guides/", "/news/", "/search/", "/sign-in/"];

test.describe("landing page SEO contract", () => {
  test("has exactly one h1 and no skipped heading levels", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Every billboard, findable.");
    const levels = await page
      .locator("h1, h2, h3, h4")
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!, `heading jump at index ${i}`).toBeLessThanOrEqual(1);
    }
  });

  test("title, description, canonical and robots are set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(
      /ohworks: every billboard, findable\. The open map of out-of-home advertising/,
    );
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length ?? 0).toBeGreaterThan(80);
    expect(description?.length ?? 0).toBeLessThan(160);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/$/);
    expect(await page.locator('link[rel="alternate"][hreflang="x-default"]').count()).toBe(1);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "index").toContain("index");
  });

  test("Organization and WebSite JSON-LD with a SearchAction", async ({ page }) => {
    await page.goto("/");
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(raw ?? "[]") as Array<Record<string, unknown>>;
    const types = data.map((d) => d["@type"]);
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
    const site = data.find((d) => d["@type"] === "WebSite") as {
      potentialAction: { target: { urlTemplate: string } };
    };
    expect(site.potentialAction.target.urlTemplate).toContain("/search/?q={search_term_string}");
  });

  test("exactly one survey (accent) element on the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".oh-btn.accent")).toHaveCount(1);
  });

  test("every internal link resolves without redirect or error", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    const unique = [...new Set(hrefs.map((h) => h.split("#")[0]!))].filter(Boolean);
    expect(unique.length).toBeGreaterThan(5);
    for (const href of unique) {
      const res = await request.get(href, { maxRedirects: 0 });
      expect(res.status(), `${href} returned ${res.status()}`).toBe(200);
    }
  });

  test("search submits as a GET to a noindex results page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("hoarding Outer Ring Road");
    await page.getByRole("button", { name: "Find sites" }).click();
    await expect(page).toHaveURL(/\/search\/\?q=hoarding\+Outer\+Ring\+Road/);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
  });

  test("Googlebot and OAI-SearchBot receive the full page", async ({ request }) => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "OAI-SearchBot/1.0; +https://openai.com/searchbot",
    ]) {
      const res = await request.get("/", { headers: { "user-agent": ua } });
      expect(res.status()).toBe(200);
      expect(await res.text()).toContain("Every billboard, findable.");
    }
  });

  test("robots.txt and sitemap.xml exist and agree", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /search/");
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/charter/");
  });

  for (const path of LANDING) {
    test(`${path} renders with the shared shell`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("link", { name: "ohworks home" }).first()).toBeVisible();
      await expect(page.locator("footer")).toContainText("never sells media");
    });
  }
});

test.describe("motion", () => {
  test("hero headline is never hidden by a reveal", async ({ page }) => {
    await page.goto("/");
    const opacity = await page.locator("h1").evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    expect(await page.locator("[data-reveal] h1").count()).toBe(0);
  });

  test("every reveal block becomes visible after scrolling", async ({ page }) => {
    await page.goto("/");
    const total = await page.locator("[data-reveal]").count();
    expect(total).toBeGreaterThan(5);
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
    }
    await expect(page.locator('[data-reveal="visible"]')).toHaveCount(total);
    await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);
  });

  test("reduced motion shows everything without scrolling", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const hidden = await page
      .locator("[data-stagger-item], [data-fade], [data-reveal]")
      .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length);
    expect(hidden).toBe(0);
  });

  test("the site sheet draws in once it is in view", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-section='site-sheet']").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const stillHidden = await page
      .locator("[data-section='site-sheet'] [data-fade]")
      .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length);
    expect(stillHidden).toBe(0);
  });
});

test.describe("navigation", () => {
  test("the bar stays at the top while scrolling", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: 1600, behavior: "instant" }));
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const box = await page.locator("header").first().boundingBox();
    expect(Math.round(box!.y)).toBe(0);
    await expect(page.getByRole("link", { name: "List your sites" }).first()).toBeInViewport();
  });

  test("Guides is in the footer, not the bar", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("header").getByRole("link", { name: "Guides", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator("footer").getByRole("link", { name: "Guides", exact: true }),
    ).toHaveCount(1);
  });

  test("anchor targets clear the sticky bar", async ({ page }) => {
    await page.goto("/for-owners/#badges");
    await page.waitForTimeout(900);
    const top = await page.locator("#badges").evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(56);
    expect(top).toBeLessThanOrEqual(140);
  });
});
