import { expect, test } from "@playwright/test";

/** These run against the sample pieces loaded by `pnpm --filter @ohworks/web seed:demo`. */
const LEAD = "/analysis/most-billboards-cannot-be-found-online/";
const NEWS = "/news/global-out-of-home-spend-2025-woo/";
const GUIDE = "/guides/what-is-digital-out-of-home/";
const SHOWCASE = "/showcase/how-ohworks-shows-a-campaign/";

async function jsonLd(
  page: import("@playwright/test").Page,
): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => {
    const parsed = JSON.parse(b) as unknown;
    return (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
  });
}

test.describe("newsroom front page", () => {
  test("shows the lead, the latest list and only sections that hold pieces", async ({ page }) => {
    await page.goto("/newsroom/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Newsroom");
    await expect(page.locator("[data-section='lead'] h2 a")).toHaveAttribute("href", LEAD);
    expect(
      await page.locator("[data-section='latest'] [data-piece]").count(),
    ).toBeGreaterThanOrEqual(4);
    const chips = page.locator("[data-section='pillars'] a");
    await expect(chips.filter({ hasText: /^All$/ })).toHaveAttribute("aria-current", "page");
    for (const label of ["News", "Analysis", "Guides", "Owner academy", "Showcase"])
      await expect(chips.filter({ hasText: new RegExp(`^${label}$`) })).toHaveCount(1);
    await expect(chips.filter({ hasText: /^Data$/ })).toHaveCount(0);
    await expect(page.locator("[data-section='briefing']")).toHaveCount(1);
    await expect(page.locator(".oh-btn.accent")).toHaveCount(0);
  });

  test("metadata, feed links and structured data", async ({ page }) => {
    await page.goto("/newsroom/");
    await expect(page).toHaveTitle(/^Newsroom · ohworks$/);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      /\/newsroom\/$/,
    );
    expect(
      await page.locator('link[rel="alternate"][type="application/rss+xml"]').getAttribute("href"),
    ).toMatch(/\/feed\.xml$/);
    expect(
      (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "index",
    ).toContain("index");
    const types = (await jsonLd(page)).map((d) => d["@type"]);
    expect(types).toContain("BreadcrumbList");
  });

  test("every internal link resolves without redirect or error", async ({ page, request }) => {
    await page.goto("/newsroom/");
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    const unique = [...new Set(hrefs.map((h) => h.split("#")[0]!))].filter(Boolean);
    expect(unique.length).toBeGreaterThan(15);
    for (const href of unique) {
      const res = await request.get(href, { maxRedirects: 0 });
      expect(res.status(), `${href} returned ${res.status()}`).toBe(200);
    }
  });
});

test.describe("section indexes", () => {
  test("a section lists its pieces and marks its chip", async ({ page }) => {
    await page.goto("/news/");
    await expect(page.locator("h1")).toHaveText("News");
    await expect(page.locator("[data-section='stream'] [data-piece]")).toHaveCount(4);
    await expect(page.locator("[data-section='pillars'] a[aria-current='page']")).toHaveText(
      "News",
    );
    expect(
      (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "index",
    ).not.toContain("noindex");
  });

  test("an empty section is a real page that stays out of the index", async ({ page, request }) => {
    const res = await page.goto("/data/");
    expect(res?.status()).toBe(200);
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/data/");
    expect(sitemap).toContain("/news/");
  });

  test("page numbers: 1 redirects, out of range and nonsense are 404", async ({ request }) => {
    const one = await request.get("/news/page/1/", { maxRedirects: 0 });
    expect(one.status()).toBe(308);
    expect(one.headers()["location"]).toMatch(/\/news\/$/);
    expect((await request.get("/news/page/9/")).status()).toBe(404);
    expect((await request.get("/news/page/abc/")).status()).toBe(404);
    expect((await request.get("/newsroom/all/")).status()).toBe(200);
  });
});

test.describe("article page", () => {
  test("a long piece gets rails: contents, key facts and numbered sources that resolve", async ({
    page,
  }) => {
    await page.goto(LEAD);
    await expect(page.locator("article#piece")).toHaveAttribute("data-layout", "rails");
    await expect(page.locator("h1")).toHaveCount(1);
    const sections = await page.locator(".oh-prose > h2").count();
    expect(sections).toBe(5);
    const toc = page.locator("[data-toc] a");
    await expect(toc).toHaveCount(sections + 1);
    for (const href of await toc.evaluateAll((as) => as.map((a) => a.getAttribute("href")!)))
      await expect(page.locator(href)).toHaveCount(1);
    await expect(page.locator("[data-section='key-facts'] li")).toHaveCount(4);
    const refs = await page
      .locator(".oh-fact .ref")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    expect(refs.length).toBeGreaterThan(10);
    for (const href of new Set(refs)) await expect(page.locator(href)).toHaveCount(1);
    expect(await page.locator("[data-section='sources'] ol li").count()).toBeGreaterThanOrEqual(7);
    await expect(page.locator("[data-section='progress']")).toHaveCount(1);
    await expect(page.locator("[data-section='topics'] a").first()).toHaveAttribute(
      "href",
      /^\/topics\/[a-z-]+\/$/,
    );
    await expect(page.locator(".oh-callout.charter")).toContainText("never sells media");
  });

  test("metadata and Article structured data are complete", async ({ page }) => {
    await page.goto(LEAD);
    await expect(page).toHaveTitle(
      "Most billboards still cannot be found or booked online · ohworks",
    );
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      new RegExp(`${LEAD}$`),
    );
    expect(await page.locator('meta[property="og:type"]').getAttribute("content")).toBe("article");
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(
      /\/og\/analysis\/most-billboards-cannot-be-found-online\/$/,
    );
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe(
      "summary_large_image",
    );
    const data = await jsonLd(page);
    const article = data.find((d) => d["@type"] === "Article") as Record<string, unknown>;
    expect(article.headline).toBe("Most billboards still cannot be found or booked online");
    expect(String(article.datePublished)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(String(article.dateModified)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect((article.author as Array<{ name: string }>)[0]!.name).toBe("ohworks editorial desk");
    expect((article.citation as string[]).length).toBeGreaterThanOrEqual(5);
    const crumbs = data.find((d) => d["@type"] === "BreadcrumbList") as {
      itemListElement: unknown[];
    };
    expect(crumbs.itemListElement).toHaveLength(3);
  });

  test("a short news piece is one column and is marked up as NewsArticle", async ({ page }) => {
    await page.goto(NEWS);
    await expect(page.locator("article#piece")).toHaveAttribute("data-layout", "column");
    await expect(page.locator("[data-toc]")).toHaveCount(0);
    expect((await jsonLd(page)).map((d) => d["@type"])).toContain("NewsArticle");
    await expect(page.locator("time").first()).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
    await expect(page.locator("[data-section='related'] [data-piece]")).toHaveCount(3);
  });

  test("a guide gets rails too, and says when its figures were refreshed", async ({ page }) => {
    await page.goto(GUIDE);
    await expect(page.locator("article#piece")).toHaveAttribute("data-layout", "rails");
    await expect(page.locator("[data-section='byline']")).toContainText("figures refreshed");
    await expect(page.locator(".oh-prose ul li")).toHaveCount(5);
  });

  test("a showcase piece opens on a full-width image with real dimensions", async ({ page }) => {
    await page.goto(SHOWCASE);
    await expect(page.locator("article#piece")).toHaveAttribute("data-layout", "immersive");
    const img = page.locator("article#piece > img");
    await expect(img).toHaveAttribute("alt", /placeholder/i);
    expect(Number(await img.getAttribute("width"))).toBeGreaterThan(800);
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(
      true,
    );
  });

  test("unknown slugs, wrong sections and unpublished pieces are 404", async ({ request }) => {
    expect((await request.get("/news/does-not-exist/")).status()).toBe(404);
    expect((await request.get("/news/most-billboards-cannot-be-found-online/")).status()).toBe(404);
    const api = await request.get("/api/articles/?limit=100&depth=0");
    const body = (await api.json()) as { docs: Array<{ _status?: string }> };
    expect(body.docs.length).toBeGreaterThan(0);
    for (const doc of body.docs) expect(doc._status).toBe("published");
  });

  test("the reading bar fills and the contents follow the reader", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "the contents rail is a desktop layout");
    await page.goto(LEAD);
    const bar = page.locator("[data-section='progress'] > div");
    const start = await bar.evaluate((el) => getComputedStyle(el).transform);
    await page.locator("#what-buyers-ask-for").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "instant" }));
    await page.waitForTimeout(400);
    expect(await bar.evaluate((el) => getComputedStyle(el).transform)).not.toBe(start);
    await expect(page.locator("[data-toc] a[aria-current='true']")).toHaveCount(1);
  });
});

test.describe("authors, topics and corrections", () => {
  test("an author page lists their pieces and carries Person data", async ({ page }) => {
    await page.goto("/authors/editorial-desk/");
    await expect(page.locator("h1")).toHaveText("ohworks editorial desk");
    await expect(page.locator("[data-section='stream'] [data-piece]")).toHaveCount(9);
    expect((await jsonLd(page)).map((d) => d["@type"])).toContain("Person");
  });

  test("a thin topic page works but stays out of the index", async ({ page }) => {
    const res = await page.goto("/topics/pricing/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Pricing");
    expect(
      await page.locator("[data-section='stream'] [data-piece]").count(),
    ).toBeGreaterThanOrEqual(2);
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    expect((await page.request.get("/topics/no-such-topic/")).status()).toBe(404);
  });

  test("the corrections log is public", async ({ page }) => {
    const res = await page.goto("/newsroom/corrections/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Corrections");
  });
});

test.describe("feeds, sitemaps and social cards", () => {
  test("RSS and JSON feeds carry every piece", async ({ request }) => {
    const rss = await request.get("/feed.xml");
    expect(rss.status()).toBe(200);
    expect(rss.headers()["content-type"]).toContain("application/rss+xml");
    const xml = await rss.text();
    expect(xml.match(/<item>/g)?.length).toBe(9);
    expect(xml).toContain("<dc:creator>ohworks editorial desk</dc:creator>");
    const json = (await (await request.get("/feed.json")).json()) as {
      version: string;
      items: Array<{ url: string; date_published: string }>;
    };
    expect(json.version).toContain("jsonfeed.org");
    expect(json.items).toHaveLength(9);
    expect(json.items[0]!.url).toMatch(/\/$/);
  });

  test("sitemaps list the pieces, and robots names both", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(LEAD);
    expect(sitemap).toContain("/newsroom/");
    expect(sitemap).toContain("/authors/editorial-desk/");
    const news = await (await request.get("/news-sitemap.xml")).text();
    expect(news).toContain("<news:name>ohworks</news:name>");
    expect(news).toContain(NEWS);
    expect(news).not.toContain("/analysis/");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    expect(robots).toMatch(/Sitemap: .*\/news-sitemap\.xml/);
    expect(robots).toContain("Disallow: /og/");
  });

  test("each piece has a social card, and unknown ones do not", async ({ request }) => {
    const card = await request.get("/og/analysis/most-billboards-cannot-be-found-online/");
    expect(card.status()).toBe(200);
    expect(card.headers()["content-type"]).toBe("image/png");
    expect((await card.body()).length).toBeGreaterThan(10_000);
    expect((await request.get("/og/news/nope/")).status()).toBe(404);
    expect((await request.get("/og/nonsense/nope/")).status()).toBe(404);
  });
});

test.describe("sign-up and follow forms", () => {
  test("the briefing form works from the page, without a script", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for a form post",
    );
    await page.goto("/newsroom/");
    await page
      .locator("[data-section='briefing'] input[type='email']")
      .fill("reader@ohworks.local");
    await page.getByRole("button", { name: "Get the briefing" }).click();
    await expect(page).toHaveURL(/\/newsroom\/subscribed\/$/);
    await expect(page.locator("h1")).toHaveText("You are on the list");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });

  test("a bad email is refused and a filled honeypot is ignored", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const bad = await request.post("/api/subscribe/", {
      form: { email: "nope", from: "/newsroom/" },
      maxRedirects: 0,
    });
    expect(bad.status()).toBe(303);
    expect(bad.headers()["location"]).toMatch(/\/newsroom\/subscribed\/\?error=email$/);
    const bot = await request.post("/api/subscribe/", {
      form: { email: "bot@example.com", company: "x" },
      maxRedirects: 0,
    });
    expect(bot.headers()["location"]).toMatch(/\/newsroom\/subscribed\/$/);
  });

  test("the follow button on the search page submits the form", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for a form post",
    );
    // A search that matches no site, so the follow form is offered.
    await page.goto("/search/?city=pune&format=gantry");
    await page.locator("[data-section='follow'] input[type='email']").fill("buyer@ohworks.local");
    await page.locator("[data-section='follow'] button").click();
    await expect(page).toHaveURL(/followed=1/);
    await expect(page.getByRole("status")).toContainText("You are on the list");
  });
});

test.describe("home page", () => {
  test("the newsroom strip shows the three newest pieces", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("[data-section='newsroom'] [data-piece]");
    await expect(cards).toHaveCount(3);
    await expect(page.locator("[data-section='newsroom'] a[href='/newsroom/']")).toHaveCount(1);
    // On a phone this link sits inside the closed Menu, so look for it in the markup, not by visibility.
    expect(await page.locator('header a[href="/newsroom/"]').count()).toBeGreaterThan(0);
  });
});
