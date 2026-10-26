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
      /OOHWORKS: every billboard, findable\. The open map of out-of-home advertising/,
    );
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length ?? 0).toBeGreaterThan(80);
    expect(description?.length ?? 0).toBeLessThan(160);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/$/);
    expect(await page.locator('link[rel="alternate"][hreflang="x-default"]').count()).toBe(1);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "index").toContain("index");
  });

  test("every answer carries the security headers, and the policy lets the page run", async ({
    page,
    request,
  }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    // A new nonce every time, never the same script allowed twice.
    expect((await request.get("/")).headers()["content-security-policy"]).not.toBe(
      h["content-security-policy"],
    );
    // The policy blocks nothing the page needs: no refusal reaches the console.
    const refused: string[] = [];
    page.on("console", (m) => {
      if (/Content Security Policy|Refused to/.test(m.text())) refused.push(m.text());
    });
    await page.goto("/");
    await page.goto("/search/?city=bengaluru");
    expect(refused).toEqual([]);
  });

  test("Organization and WebSite JSON-LD with a SearchAction", async ({ page }) => {
    await page.goto("/");
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(raw ?? "[]") as Array<Record<string, unknown>>;
    const types = data.map((d) => d["@type"]);
    expect(types).toContain("NewsMediaOrganization");
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
    // Links shown only to a signed-in owner are left out: they rightly send a stranger to the start,
    // and the owner tests follow them.
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((as) =>
        as
          .filter((a) => !a.closest("[data-bar-when='owner']"))
          .map((a) => (a as HTMLAnchorElement).getAttribute("href")!),
      );
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

  test("the title, description and robots tag are sent in the head, never later in the body", async ({
    request,
  }) => {
    // Pages made on request are the ones Next.js would otherwise finish in the body.
    const pages = [
      "/",
      "/list-your-sites/",
      "/search/?city=bengaluru",
      "/in/bengaluru/",
      "/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/",
    ];
    const agents = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ];
    for (const path of pages)
      for (const agent of agents) {
        const html = await (await request.get(path, { headers: { "user-agent": agent } })).text();
        const head = html.slice(0, html.indexOf("</head>"));
        const where = `${path} as ${agent.includes("Googlebot") ? "Googlebot" : "a browser"}`;
        expect(head, `title of ${where}`).toMatch(/<title>[^<]+<\/title>/);
        expect(head, `description of ${where}`).toContain('<meta name="description"');
        expect(head, `robots tag of ${where}`).toContain('<meta name="robots"');
        expect(html.match(/<title>/g), `one title on ${where}`).toHaveLength(1);
        if (html.includes('rel="canonical"'))
          expect(head, `canonical link of ${where}`).toContain('rel="canonical"');
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
      await expect(page.getByRole("link", { name: "OOHWORKS home" }).first()).toBeVisible();
      await expect(page.locator("footer")).toContainText("never sells media");
    });
  }
});

test.describe("brief box", () => {
  test("shows what the search will read, as the brief is typed", async ({ page }) => {
    await page.goto("/");
    const reading = page.locator("[data-section='brief-reading']");
    await expect(reading).toContainText("Try");
    const before = await reading.boundingBox();
    await page.getByRole("searchbox").fill("hoardings in Bengaluru under 1 lakh");
    await expect(reading).toContainText("Understood as");
    await expect(reading.locator(".oh-chip")).toHaveText([
      "Bengaluru",
      "Hoardings",
      /Under ₹\s1,00,000 a month/,
    ]);
    // The line under the box keeps its place: the form above it never moves.
    expect((await reading.boundingBox())!.y).toBe(before!.y);
    await page.getByRole("searchbox").fill("");
    await expect(reading).toContainText("Try");
  });

  test("every example brief is read in full by the search", async ({ page }) => {
    await page.goto("/");
    const examples = page.locator("[data-section='brief-reading'] a");
    await expect(examples).toHaveCount(3);
    for (const href of await examples.evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
      await page.goto(href);
      await expect(page.locator("[data-section='understood']")).toBeVisible();
    }
  });
});

test.describe("how it works, for you", () => {
  test("one persona shows at a time, and a tab can be shared by address", async ({ page }) => {
    await page.goto("/");
    const shown = page.locator(".persona-panel:visible");
    await expect(shown).toHaveCount(1);
    await expect(shown).toHaveAttribute("id", "for-owners");
    await page.getByRole("tab", { name: "Agencies" }).click();
    await expect(shown).toHaveAttribute("id", "for-agencies");
    await expect(page.getByRole("tab", { name: "Agencies" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(page.url()).toMatch(/#for-agencies$/);
    await page.goto("/#for-digital");
    await expect(shown).toHaveAttribute("id", "for-digital");
  });

  test("arrow keys move between tabs", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "keyboards are for wider screens");
    await page.goto("/");
    await page.getByRole("tab", { name: "Media owners" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Owner networks" })).toBeFocused();
    await expect(page.locator(".persona-panel:visible")).toHaveAttribute("id", "for-networks");
    await page.keyboard.press("End");
    await expect(page.locator(".persona-panel:visible")).toHaveAttribute("id", "for-digital");
  });

  test("the countries section groups regions and says where search opens first", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator("[data-section='countries']");
    await expect(section.getByRole("heading", { name: "Countries worldwide" })).toBeVisible();
    await expect(section.locator("[data-region]")).toHaveCount(6);
    await expect(section.locator("[data-region='South Asia']")).toContainText(
      "Search opens in India first",
    );
    await expect(page.getByText("Opening city by city")).toHaveCount(0);
  });
});

test.describe("how it works, without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("each tab is a link to its panel, and the panel shows", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".persona-panel:visible")).toHaveAttribute("id", "for-owners");
    await page.getByRole("tab", { name: "Brands and businesses" }).click();
    await expect(page.locator(".persona-panel:visible")).toHaveAttribute("id", "for-brands");
  });
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
    // A block hidden at this width (the site sheet on phones) can never scroll into view.
    const shown = page.locator("[data-reveal]:visible");
    const total = await shown.count();
    expect(total).toBeGreaterThan(5);
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
    }
    await expect(page.locator('[data-reveal="visible"]:visible')).toHaveCount(total);
    await expect(page.locator('[data-reveal="pending"]:visible')).toHaveCount(0);
  });

  test("reduced motion shows everything without scrolling", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const hidden = await page
      .locator("[data-stagger-item], [data-fade], [data-reveal]")
      .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length);
    expect(hidden).toBe(0);
  });

  test("the site sheet draws in once it is in view", async ({ page, isMobile }) => {
    test.skip(
      Boolean(isMobile),
      "the sheet illustrates the steps beside them on wide screens only",
    );
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
