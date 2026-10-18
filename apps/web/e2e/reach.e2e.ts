import { expect, test, type Page } from "@playwright/test";
import { mails } from "./helpers/admin";

/** These run against the labelled sample sites in e2e/fixtures, loaded into the test database by `pnpm test:db`. */
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

/** The path and key of a link in an email, whatever host the email was written for. */
const linkIn = (text: string, start: "reply" | "enquiries"): string => {
  const m = new RegExp(`https?://[^/\\s]+(/${start}/[A-Z]{3}-[0-9A-Z]{8}/\\?k=[0-9a-f]{32})`).exec(
    text,
  );
  if (!m?.[1]) throw new Error(`no ${start} link in the email`);
  return m[1];
};

async function put(page: Page, ids: string[]) {
  const res = await page.request.post("/api/lists/", {
    form: { list: "saved", action: "add", ids: ids.join(","), return: "/shortlist/" },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
}

test.describe("one enquiry for a shortlist", () => {
  test("is split per owner, each owner answers from their own link, and the buyer reads every reply in one place", async ({
    page,
    request,
    browser,
  }, info) => {
    test.setTimeout(90_000);
    const email = `plan-${info.project.name}-${Date.now()}@example.org`;
    const brand = `Namma Bakes ${info.project.name} ${Date.now()}`;
    await put(page, ["ows0001", "ows0003", "ows0017"]);
    await page.goto(`/shortlist/?from=${day(20)}&to=${day(50)}&budget=400000`);
    await page.locator("[data-action='enquire-all']").click();

    // The form: who gets what, and the dates carried over. The budget is not asked for and not sent.
    await expect(page).toHaveURL(/\/enquire\/plan\/\?sites=ows0001,ows0003,ows0017&from=/);
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator("[data-section='plan-sites'] [data-owner]")).toHaveCount(2);
    await expect(
      page.locator(
        "[data-section='plan-sites'] [data-owner='sample-kaveri'] input[type='checkbox']",
      ),
    ).toHaveCount(2);
    await expect(page.locator("#enq-from")).toHaveValue(day(20));
    await expect(page.locator("#enq-budget")).toHaveCount(0);
    await expect(page.locator(".oh-btn.accent")).toHaveCount(1);
    await page.locator("#enq-brand").fill(brand);
    await page.locator("#enq-message").fill("We open two outlets that month.");
    await page.locator("#enq-email").fill(email);
    await page.getByRole("button", { name: "Send enquiry to 2 owners" }).click();

    await expect(page).toHaveURL(/\/enquire\/confirm\/\?ref=PLN-[0-9A-Z]{8}$/, { timeout: 20_000 });
    const summary = page.locator("[data-section='group-summary']");
    await expect(summary).toContainText("2 owners about 3 sites");
    await expect(summary.locator("[data-owner]")).toHaveCount(2);
    // Nothing has reached an owner yet.
    expect(
      (await mails(request, "kaveri@example.com", "owner_enquiry")).some((m) =>
        m.text.includes(brand),
      ),
    ).toBe(false);

    const code = /\b\d{6}\b/.exec((await mails(request, email, "code"))[0]?.text ?? "")?.[0] ?? "";
    await page.locator("#enq-code").fill(code);
    await page.locator("[data-action='confirm']").click();
    await expect(page).toHaveURL(/\/enquire\/sent\/\?ref=PLN-[0-9A-Z]{8}$/, { timeout: 20_000 });
    await expect(page.locator("h1")).toHaveText("Sent to 2 owners.");
    await expect(page.locator("[data-section='sent-owners'] [data-owner]")).toHaveCount(2);
    await expect(page.locator("[data-section='enquiry-sent']")).toContainText(
      "Each owner saw only their own sites.",
    );

    // Each owner is told about their own sites only, and never the buyer's budget.
    const toKaveri = (await mails(request, "kaveri@example.com", "owner_enquiry")).find((m) =>
      m.text.includes(brand),
    );
    const toMarine = (await mails(request, "marine@example.com", "owner_enquiry")).find((m) =>
      m.text.includes(brand),
    );
    expect(toKaveri?.subject).toContain("2 of your sites");
    expect(toKaveri?.text).toContain("80 Feet Road");
    expect(toKaveri?.text).toContain("Sarjapur Road");
    expect(toKaveri?.text).not.toContain("Linking Road");
    expect(toKaveri?.text).not.toContain("Marine");
    expect(toKaveri?.text).not.toMatch(/budget/i);
    expect(toKaveri?.text).not.toContain("PLN-");
    expect(toMarine?.text).toContain("Linking Road");
    expect(toMarine?.text).not.toContain("80 Feet Road");
    const toBuyer = (await mails(request, email, "buyer_confirmation"))[0];
    expect(toBuyer?.subject).toContain("2 owners");
    const threadLink = linkIn(toBuyer?.text ?? "", "enquiries");

    // The owner answers from the link in their email, in a browser of their own.
    const ownerContext = await browser.newContext();
    const owner = await ownerContext.newPage();
    const replyLink = linkIn(toKaveri?.text ?? "", "reply");
    await owner.goto(replyLink);
    expect(await owner.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(owner.locator("h1")).toHaveText("Reply to this enquiry");
    await expect(owner.locator("[data-section='asked']")).toContainText(brand);
    await expect(owner.locator("[data-section='asked']")).not.toContainText("Budget");
    await expect(owner.locator("main")).not.toContainText("Linking Road");
    const fields = owner.locator("[data-section='reply-form'] fieldset");
    await expect(fields).toHaveCount(2);
    await owner.locator("[data-action='send-reply']").click();
    await expect(owner.locator("[data-section='reply-error']")).toContainText(
      "There is nothing to send yet.",
    );
    await fields.nth(0).getByLabel("Available for these dates").check();
    await fields.nth(0).locator("input[type='text']").fill("82,000");
    await fields.nth(1).getByLabel("Free on other dates").check();
    await owner.locator("#reply-body").fill("The unipole is free from 1 December.");
    await owner.locator("[data-action='send-reply']").click();
    await expect(owner.locator("[data-section='reply-sent']")).toContainText(
      "Your reply was sent to the buyer.",
    );
    await expect(owner.locator("[data-section='thread'] li[data-from]")).toHaveCount(2);
    await ownerContext.close();

    const reply = (await mails(request, email, "owner_reply"))[0];
    expect(reply?.subject).toContain("Kaveri Outdoor (sample) replied");
    expect(reply?.text).toContain("80 Feet Road: Available for these dates · ₹ 82,000 a month");
    expect(reply?.text).toContain("The unipole is free from 1 December.");

    // The buyer's view: every owner, every answer, in one place.
    await page.locator("[data-action='see-replies']").click();
    await expect(page).toHaveURL(/\/enquiries\/PLN-[0-9A-Z]{8}\/\?k=[0-9a-f]{32}$/);
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(threadLink);
    await expect(page.locator("h1")).toHaveText("Your enquiry to 2 owners");
    await expect(page.locator("[data-section='thread-lead']")).toContainText(
      "1 of 2 owners have replied so far.",
    );
    const rows = page.locator("[data-section='answers-table'] tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: "80 Feet Road" })).toContainText(
      "Available for these dates",
    );
    await expect(rows.filter({ hasText: "80 Feet Road" })).toContainText("₹ 82,000 a month");
    await expect(rows.filter({ hasText: "Linking Road" })).toContainText("No answer yet");
    await expect(
      page.locator("[data-section='request'][data-owner='sample-kaveri']"),
    ).toContainText("Replied");
    await expect(
      page.locator("[data-section='request'][data-owner='sample-marine']"),
    ).toContainText("Waiting for a reply");

    // A follow-up goes to that owner alone.
    const kaveri = page.locator("[data-section='request'][data-owner='sample-kaveri']");
    await kaveri.locator("textarea").fill(`Please hold the hoarding. ${brand}`);
    await kaveri.locator("[data-section='follow-up'] button").click();
    await expect(page.locator("[data-section='thread-sent']")).toContainText(
      "Your message was sent.",
    );
    await expect(kaveri.locator("[data-section='thread'] li[data-from]")).toHaveCount(3);
    expect(
      (await mails(request, "kaveri@example.com", "buyer_message")).some((m) =>
        m.text.includes(brand),
      ),
    ).toBe(true);
    expect(
      (await mails(request, "marine@example.com", "buyer_message")).some((m) =>
        m.text.includes(brand),
      ),
    ).toBe(false);

    // A link opens one side of one enquiry and nothing else.
    const ownerKey = new URL(replyLink, "http://x").searchParams.get("k") ?? "";
    const ownerRef = replyLink.split("/")[2] ?? "";
    const planRef = threadLink.split("/")[2] ?? "";
    expect((await request.get(`/enquiries/${planRef}/?k=${"0".repeat(32)}`)).status()).toBe(404);
    expect((await request.get(`/enquiries/${planRef}/?k=${ownerKey}`)).status()).toBe(404);
    expect((await request.get(`/enquiries/${ownerRef}/?k=${ownerKey}`)).status()).toBe(404);
    expect(
      (
        await request.get(
          `/reply/${ownerRef}/?k=${new URL(threadLink, "http://x").searchParams.get("k")}`,
        )
      ).status(),
    ).toBe(404);
    expect((await request.get(`/reply/${ownerRef}/`)).status()).toBe(404);
  });

  test("several sites of one owner go as a single request", async ({ page }) => {
    await page.goto("/enquire/plan/?sites=ows0001,ows0005");
    await expect(page.locator("[data-section='plan-sites'] [data-owner]")).toHaveCount(1);
    await expect(page.locator("main")).toContainText(
      "It goes straight to the owner of these sites.",
    );
    await expect(page.locator("[data-action='send']")).toHaveText("Send enquiry");
    await page.goto("/enquire/plan/?sites=ows0001,ows0005&error=sites");
    await expect(page.locator("[data-section='enquiry-error']")).toContainText(
      "Choose at least one site.",
    );
  });

  test("the endpoints refuse anything without the right key or origin", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const base = {
      from: day(20),
      to: day(40),
      brand: "Test brand, retail",
      artwork: "ready",
      email: `refuse-plan-${Date.now()}@example.org`,
    };
    const plan = (form: Record<string, string>, headers?: Record<string, string>) =>
      request.post("/api/enquire/plan/", {
        form,
        maxRedirects: 0,
        ...(headers ? { headers } : {}),
      });
    expect(
      (await plan({ ...base, ids: "ows0001" }, { origin: "https://evil.example" })).status(),
    ).toBe(403);
    expect((await plan(base)).headers()["location"]).toMatch(/^\/enquire\/plan\/\?error=sites/);
    expect((await plan({ ...base, ids: "ows9zzz" })).headers()["location"]).toContain(
      "error=sites",
    );
    const late = await plan({ ...base, ids: "ows0001", from: day(-2) });
    expect(late.headers()["location"]).toMatch(/^\/enquire\/plan\/\?error=dates.*&sites=ows0001$/);
    expect(late.headers()["location"]).not.toContain("example.org");
    expect((await plan({ ...base, ids: "ows0001", website: "x" })).headers()["location"]).toBe(
      "/shortlist/",
    );

    const bad = { ref: "ENQ-00000000", k: "0".repeat(32), body: "hello" };
    expect((await request.post("/api/reply/", { form: bad, maxRedirects: 0 })).status()).toBe(403);
    expect(
      (
        await request.post("/api/thread/", {
          form: { ...bad, to: "ENQ-00000000" },
          maxRedirects: 0,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.post("/api/reply/", { form: { ...bad, ref: "nonsense" }, maxRedirects: 0 })
      ).status(),
    ).toBe(403);
    expect((await request.get("/api/messages")).status()).toBe(403);
    const robots = await (await request.get("/robots.txt")).text();
    for (const path of ["/enquiries/", "/reply/"]) expect(robots).toContain(`Disallow: ${path}`);
  });
});

test.describe("exports", () => {
  test("a shortlist downloads as Excel or CSV, one site to a row", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for a download",
    );
    const xlsx = await request.get("/api/export/shortlist/?sites=ows0001,ows0003,ows0017");
    expect(xlsx.status()).toBe(200);
    expect(xlsx.headers()["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(xlsx.headers()["content-disposition"]).toMatch(
      /^attachment; filename="ohworks-shortlist-\d{4}-\d{2}-\d{2}\.xlsx"$/,
    );
    expect(xlsx.headers()["x-robots-tag"]).toBe("noindex");
    const bytes = await xlsx.body();
    // An .xlsx file is a zip archive, which always begins "PK".
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    expect(bytes.length).toBeGreaterThan(4000);

    const csv = await request.get(
      `/api/export/shortlist/?sites=ows0001,ows0003,ows0017&format=csv&from=${day(3)}`,
    );
    expect(csv.headers()["content-type"]).toBe("text/csv; charset=utf-8");
    const lines = (await csv.text()).trimEnd().split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('"Unit ID","Site","Format"');
    expect(lines[0]).toContain('"Free on ');
    expect(lines[1]).toContain('"ows0001","20 × 10 ft hoarding, 80 Feet Road","Hoarding","Static"');
    expect(lines[1]).toContain('"Exact rate","85000"');
    // A price the owner keeps private is left blank, never guessed.
    expect(lines[2]).toContain('"On request",""');
    expect(lines[3]).toContain('"Marine Line Media (sample)"');
    expect(lines[1]).toContain('"Sample listing, not a real site"');

    expect((await request.get("/api/export/shortlist/")).status()).toBe(404);
    expect((await request.get("/api/export/shortlist/?sites=ows9zzz")).status()).toBe(404);
  });

  test("site sheets lay a shortlist out to print, one site to a page", async ({ page }) => {
    await page.goto(`/shortlist/?sites=ows0001,ows0017&from=${day(5)}&to=${day(35)}`);
    await expect(page.locator("[data-action='export-excel']")).toHaveAttribute(
      "href",
      `/api/export/shortlist/?sites=ows0001,ows0017&from=${day(5)}`,
    );
    await page.locator("[data-action='export-sheets']").click();
    await expect(page).toHaveURL(/\/shortlist\/sheets\/\?sites=ows0001,ows0017&from=/);
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator("h1")).toHaveText("Site sheets");
    await expect(page.locator("article.oh-sheet")).toHaveCount(2);
    const first = page.locator("article.oh-sheet").first();
    await expect(first.locator("h2")).toHaveText("20 × 10 ft hoarding, 80 Feet Road");
    await expect(first).toContainText("₹ 85,000");
    await expect(first).toContainText("12.93512, 77.62214");
    await expect(first).toContainText("Owner and seller: Kaveri Outdoor (sample)");
    await expect(first).toContainText("Dates asked about:");
    await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeVisible();
    // On paper the controls go and each site starts a new page.
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeHidden();
    expect(await first.evaluate((el) => getComputedStyle(el).breakAfter)).toBe("page");
  });
});

test.describe("city, area and format pages", () => {
  test("a city page opens with a dated fact and lists its sites on real, numbered pages", async ({
    page,
    request,
  }) => {
    const res = await page.goto("/in/bengaluru/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Outdoor advertising sites in Bengaluru");
    await expect(page.locator("[data-section='hub-fact']")).toHaveText(
      /^Bengaluru has 16 listed sites from 1 owner\. Hoardings are the most common, with 9\. \(ohworks, [A-Z][a-z]{2} \d{4}\)$/,
    );
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      /\/in\/bengaluru\/$/,
    );
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(12);
    await expect(page.locator("[data-section='map'] svg[role='img']")).toBeVisible();

    // Samples do not count towards publishing, so this is a preview: marked, and never offered to a search engine.
    await expect(page.locator("[data-section='hub-preview']")).toContainText(
      "needs 25 indexable sites to be published and has 0",
    );
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/in/bengaluru/");

    await expect(page.locator("[data-section='hub-formats'] a")).toHaveText([
      /Hoardings\s*9/,
      /Unipoles\s*2/,
      /Gantries\s*1/,
      /Bus shelters\s*1/,
      /LED screens\s*2/,
      /Transit panels\s*1/,
    ]);
    await expect(page.locator("[data-section='hub-formats'] a").first()).toHaveAttribute(
      "href",
      "/in/bengaluru/hoardings/",
    );
    await expect(page.locator("[data-section='hub-areas'] a").first()).toHaveAttribute(
      "href",
      "/in/bengaluru/koramangala/",
    );
    await expect(page.locator("[data-action='filter-these']")).toHaveAttribute(
      "href",
      "/search/?city=bengaluru",
    );

    await page.locator("[data-section='pager']").getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/\/in\/bengaluru\/page\/2\/$/);
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(4);
    await expect(page.locator("[data-section='heading']")).toHaveText("Sites 13 to 16 of 16");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      /\/in\/bengaluru\/page\/2\/$/,
    );
    await expect(page).toHaveTitle(/Outdoor advertising sites in Bengaluru · page 2/);
  });

  test("an area and a format each have a page, with the same cards and controls", async ({
    page,
  }) => {
    await page.goto("/in/bengaluru/hoardings/");
    await expect(page.locator("h1")).toHaveText("Hoardings in Bengaluru");
    await expect(page.locator("[data-section='hub-fact']")).toContainText(
      "Bengaluru has 9 listed hoardings from 1 owner.",
    );
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(9);
    await expect(page.locator("[data-section='hub-formats']")).toHaveCount(0);
    // Narrower than a hub goes into filtered search, which is not for search engines.
    const area = page.locator("[data-section='hub-areas'] a").first();
    await expect(area).toHaveAttribute(
      "href",
      /^\/search\/\?city=bengaluru&locality=[a-z-]+&format=hoarding$/,
    );
    await expect(area).toHaveAttribute("rel", "nofollow");
    await expect(page.locator("[data-section='breadcrumb']")).toContainText("Hoardings");
    await page
      .locator("[data-section='breadcrumb']")
      .getByRole("link", { name: "Bengaluru" })
      .click();
    await expect(page).toHaveURL(/\/in\/bengaluru\/$/);

    await page.goto("/in/bengaluru/koramangala/");
    await expect(page.locator("h1")).toHaveText(
      "Outdoor advertising sites in Koramangala, Bengaluru",
    );
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(4);
    await expect(page.locator("[data-section='pager']")).toHaveCount(0);
    // Saving works here as it does in the results.
    const save = page.locator("[data-site='ows0001'] form[data-list-form='saved'] button");
    await save.click();
    await expect(save.locator("[data-label]")).toHaveText("Saved");
    await expect(page.locator("[data-plan-text]")).toContainText("1 site saved");

    // A site's own page leads back up to its area and its city.
    await page.goto("/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/");
    await expect(page.locator("[data-crumb='city']")).toHaveAttribute("href", "/in/bengaluru/");
    await expect(page.locator("[data-crumb='locality']")).toHaveAttribute(
      "href",
      "/in/bengaluru/koramangala/",
    );
  });

  test("addresses that name no hub answer not found, and page one has one address", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for status codes",
    );
    const status = async (path: string) => (await request.get(path, { maxRedirects: 0 })).status();
    expect(await status("/in/bengaluru/nowhere/")).toBe(404);
    expect(await status("/in/atlantis/")).toBe(404);
    expect(await status("/us/bengaluru/")).toBe(404);
    expect(await status("/in/bengaluru/page/9/")).toBe(404);
    expect(await status("/in/bengaluru/page/abc/")).toBe(404);
    expect(await status("/in/bengaluru/gantries/page/2/")).toBe(404);
    const one = await request.get("/in/bengaluru/page/1/", { maxRedirects: 0 });
    expect(one.status()).toBe(308);
    expect(one.headers()["location"]).toMatch(/\/in\/bengaluru\/$/);
    // Empty of sites, so there is no page even as a preview.
    expect(await status("/in/chennai/gantries/")).toBe(404);
  });
});
