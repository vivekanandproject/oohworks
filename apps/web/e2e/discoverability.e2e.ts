import { expect, test } from "@playwright/test";

/**
 * Every published piece is ready for search engines, answer engines and AI agents
 * (docs/oohworks-article-discoverability-plan.md). Runs against the sample pieces in e2e/fixtures.
 */
const NEWS = "/news/global-out-of-home-spend-2025-woo/";
const NEWS_MD = "/news/global-out-of-home-spend-2025-woo.md";

async function jsonLd(
  page: import("@playwright/test").Page,
): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => {
    const parsed = JSON.parse(b) as unknown;
    return (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
  });
}

test.describe("on the page", () => {
  test("the short answer comes first, and the page says who checked the figures", async ({
    page,
  }) => {
    await page.goto(NEWS);
    const answer = page.locator("[data-section='short-answer']");
    await expect(answer).toContainText("Short answer");
    await expect(answer).toContainText("$54.2 bn in 2025");
    const words = (await answer.locator("p").textContent())!.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
    await expect(page.locator("[data-section='fact-check']")).toContainText("Fact-checked");
    await expect(page.locator("[data-section='fact-check'] time")).toHaveAttribute(
      "datetime",
      /^\d{4}-\d{2}-\d{2}T/,
    );
  });

  test("structured data carries the abstract, the reviewer, speakable parts and the publisher", async ({
    page,
  }) => {
    await page.goto(NEWS);
    const data = await jsonLd(page);
    const article = data.find((d) => d["@type"] === "NewsArticle") as {
      abstract: string;
      mainEntityOfPage: { reviewedBy: { name: string }; lastReviewed: string };
      speakable: { cssSelector: string[] };
      publisher: { "@id": string };
    };
    expect(article.abstract).toContain("$54.2 bn");
    expect(article.mainEntityOfPage.reviewedBy.name).toBeTruthy();
    expect(String(article.mainEntityOfPage.lastReviewed)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(article.speakable.cssSelector).toContain("[data-section='short-answer'] p");
    expect(article.publisher["@id"]).toMatch(/#organization$/);
    await page.goto("/");
    const org = (await jsonLd(page)).find((d) => d["@type"] === "NewsMediaOrganization") as {
      logo: { url: string };
      correctionsPolicy: string;
    };
    expect(org.logo.url).toMatch(/\.png$/);
    expect(org.correctionsPolicy).toMatch(/\/newsroom\/corrections\/$/);
  });

  test("the page points at its Markdown copy", async ({ page }) => {
    await page.goto(NEWS);
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      "href",
      new RegExp(`${NEWS_MD.replace(/\./g, "\\.")}$`),
    );
  });
});

test.describe("for AI agents", () => {
  test("the Markdown copy has the text, each figure's source and date, and the sources", async ({
    request,
  }) => {
    const res = await request.get(NEWS_MD);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/markdown");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(res.headers()["link"]).toMatch(/global-out-of-home-spend-2025-woo\/>; rel="canonical"/);
    const md = await res.text();
    expect(md).toMatch(/^---\ntitle: "Global out-of-home spend reached \$54\.2 bn in 2025/);
    expect(md).toContain("**Short answer:**");
    expect(md).toMatch(/\$54\.2 bn \(source 1, as of 31 Dec 2025\)/);
    expect(md).toContain("## Sources");
    expect(md).toContain("fact_checked_by:");
  });

  test("Markdown copies of unknown or wrong-section pieces are 404", async ({ request }) => {
    expect((await request.get("/news/no-such-piece.md")).status()).toBe(404);
    expect((await request.get("/analysis/global-out-of-home-spend-2025-woo.md")).status()).toBe(
      404,
    );
  });

  test("llms.txt maps the site and lists the newest pieces as Markdown", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/^# OOHWORKS\n/);
    expect(text).toContain("never sells media");
    expect(text).toContain(NEWS_MD);
  });

  test("the articles API lists published pieces with their Markdown copies", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/articles/?section=news&per_page=5");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      articles: Array<Record<string, unknown>>;
      total: number;
    };
    expect(body.articles.length).toBeGreaterThan(0);
    const woo = body.articles.find((a) => String(a.url).endsWith(NEWS))!;
    expect(woo.markdownUrl).toMatch(new RegExp(`${NEWS_MD.replace(/\./g, "\\.")}$`));
    expect(woo.shortAnswer).toContain("$54.2 bn");
    expect((await request.get("/api/v1/articles/?section=nope")).status()).toBe(400);
    expect((await request.get("/api/v1/articles/?per_page=500")).status()).toBe(400);
  });

  test("robots.txt welcomes AI crawlers by name, and the feeds name a WebSub hub", async ({
    request,
  }) => {
    const robots = await (await request.get("/robots.txt")).text();
    for (const bot of ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "OAI-SearchBot"])
      expect(robots).toContain(`User-Agent: ${bot}`);
    expect(await (await request.get("/feed.xml")).text()).toContain('rel="hub"');
    const feed = (await (await request.get("/feed.json")).json()) as { hubs: { type: string }[] };
    expect(feed.hubs[0]!.type).toBe("WebSub");
  });
});

test.describe("the contract every published piece passes", () => {
  test("one h1, head tags, valid structured data, a Markdown copy, and a place in the sitemap", async ({
    page,
    request,
  }) => {
    const list = (await (await request.get("/api/v1/articles/?per_page=50")).json()) as {
      articles: Array<{ url: string; markdownUrl: string; title: string }>;
    };
    expect(list.articles.length).toBeGreaterThan(3);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const a of list.articles) {
      const path = new URL(a.url).pathname;
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1"), path).toHaveCount(1);
      const head = await page.evaluate(() => document.head.innerHTML);
      expect(head, path).toContain('<meta name="description"');
      expect(await page.locator('link[rel="canonical"]').getAttribute("href"), path).toMatch(
        new RegExp(`${path}$`),
      );
      const article = (await jsonLd(page)).find((d) =>
        ["NewsArticle", "Article", "Report"].includes(String(d["@type"])),
      ) as Record<string, unknown> | undefined;
      expect(article, path).toBeTruthy();
      expect(article!.headline, path).toBe(a.title);
      expect(String(article!.datePublished), path).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect((article!.author as unknown[]).length, path).toBeGreaterThan(0);
      const missingAlt = await page.locator("article img:not([alt])").count();
      expect(missingAlt, path).toBe(0);
      const md = await request.get(new URL(a.markdownUrl).pathname);
      expect(md.status(), a.markdownUrl).toBe(200);
      expect(await md.text(), a.markdownUrl).toContain(a.title.replace(/[`*_[\]\\]/g, "\\$&"));
      expect(sitemap, path).toContain(path);
    }
  });
});
