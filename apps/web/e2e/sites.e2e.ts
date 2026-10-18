import { expect, test, type APIRequestContext } from "@playwright/test";
import { adminHeaders } from "./helpers/admin";

/** These run against the labelled sample sites in e2e/fixtures, loaded into the test database by `pnpm test:db`. */
const SITE = "/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/";
const url = (rest: string) => `/in/${rest}/`;
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

test.describe("site page", () => {
  test("answers at its true address, and only there", async ({ page, request }) => {
    const res = await page.goto(SITE);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("20 × 10 ft hoarding, 80 Feet Road");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      /\/in\/bengaluru\/koramangala\/hoarding-80-feet-road-ows0001\/$/,
    );

    const drifted = await request.get("/in/mumbai/anywhere/old-name-ows0001/", { maxRedirects: 0 });
    expect(drifted.status()).toBe(308);
    expect(drifted.headers()["location"]).toMatch(
      /\/in\/bengaluru\/koramangala\/hoarding-80-feet-road-ows0001\/$/,
    );
    expect(
      (
        await request.get("/in/bengaluru/koramangala/hoarding-80-feet-road-ows9zzz/", {
          maxRedirects: 0,
        })
      ).status(),
    ).toBe(404);
    expect(
      (await request.get("/in/bengaluru/koramangala/not-a-site/", { maxRedirects: 0 })).status(),
    ).toBe(404);
  });

  test("a sample is labelled, kept out of the index and carries no structured data", async ({
    page,
    request,
  }) => {
    await page.goto(SITE);
    await expect(page.locator("[data-section='sample-notice']")).toContainText("sample listing");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    await expect(page.locator("[data-section='gallery']")).toContainText("No photo yet");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("ows0001");
    expect(sitemap).toContain("/how-results-are-ordered/");
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /enquire/");
  });

  test("everything a buyer asks is on the page before they enquire", async ({ page }) => {
    await page.goto(SITE);
    await expect(page.locator("[data-section='badges']")).toContainText("Verified owner");
    await expect(page.locator("[data-section='summary']")).toContainText(
      "It faces 225° SW, towards north-bound traffic.",
    );
    const specs = page.locator("[data-section='specs']");
    await expect(specs).toContainText("Hoarding, static");
    await expect(specs).toContainText("20 × 10 ft (6.1 × 3.0 m)");
    await expect(specs).toContainText("Front-lit, 6 pm to 11 pm");
    await expect(specs).toContainText("12.93512, 77.62214");
    await expect(specs).toContainText("ows0001");
    await expect(specs).toContainText("valid to");
    await expect(page.locator("[data-section='audience']")).toContainText("4.2 lakh");
    await expect(page.locator("[data-section='audience']")).toContainText("Source: Sample data");
    const price = page.locator("[data-section='price']");
    await expect(price).toContainText("₹ 85,000");
    await expect(price).toContainText("3 months minimum");
    await expect(price).toContainText("Goes straight to Kaveri Outdoor (sample).");
    await expect(page.locator("[data-section='calendar'] .oh-cal .d")).not.toHaveCount(0);
    await expect(page.locator("[data-section='supply']")).toContainText("PDF or TIFF, CMYK");
    await expect(page.locator("[data-section='steps'] li")).toHaveCount(3);
    await expect(
      page.locator("[data-section='location']").getByRole("link", { name: "Open in Google Maps" }),
    ).toHaveAttribute("href", /query=12\.93512,77\.62214$/);
    await expect(page.locator("[data-section='similar'] [data-site]")).toHaveCount(3);
    await expect(page.locator("[data-section='similar'] [data-site]").first()).toContainText(
      "m away",
    );
    await expect(page.locator("[data-section='report'] a")).toHaveAttribute("href", /^mailto:/);
  });

  test("one h1 and no skipped heading levels", async ({ page }) => {
    await page.goto(SITE);
    await expect(page.locator("h1")).toHaveCount(1);
    const levels = await page
      .locator("main h1, main h2, main h3, main h4")
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]! - levels[i - 1]!, `heading jump at index ${i}`).toBeLessThanOrEqual(1);
  });

  test("the owner's phone stays hidden until a buyer asks for it", async ({ page }) => {
    await page.goto(SITE);
    const owner = page.locator("[data-section='owner']");
    await expect(owner).toContainText("16 sites on ohworks");
    const phone = owner.locator("[data-section='owner-phone'] p");
    await expect(phone).toBeHidden();
    await owner.getByText("Show phone").click();
    await expect(phone).toBeVisible();
    await expect(owner.getByRole("link", { name: "See all their sites" })).toHaveAttribute(
      "href",
      "/search/?owner=sample-kaveri",
    );
  });

  test("the enquiry action sits in the price block on wide screens and in a bar on phones", async ({
    page,
    isMobile,
  }) => {
    await page.goto(SITE);
    const inBlock = page.locator("[data-section='price'] [data-action='enquire']");
    const inBar = page.locator("[data-section='enquire-bar'] [data-action='enquire']");
    if (isMobile) {
      await expect(inBar).toBeVisible();
      await expect(inBlock).toBeHidden();
      await expect(inBar).toHaveAttribute("href", "/enquire/ows0001/");
    } else {
      await expect(inBlock).toBeVisible();
      await expect(inBar).toBeHidden();
      await expect(inBlock).toHaveText("Send enquiry");
    }
  });

  test("the calendar pages through months and never goes back past this one", async ({ page }) => {
    await page.goto(SITE);
    const cal = page.locator("[data-section='calendar']");
    const first = await cal.getAttribute("data-month");
    await expect(cal.getByRole("link", { name: "Earlier" })).toHaveCount(0);
    await cal.getByRole("link", { name: "Later" }).click();
    await expect(page).toHaveURL(/\?m=\d{4}-\d{2}#availability$/);
    await expect(cal).not.toHaveAttribute("data-month", first ?? "");
    await expect(cal.locator(".oh-cal .d.past")).toHaveCount(0);
    await expect(cal.getByRole("link", { name: "Earlier" })).toBeVisible();
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).not.toContain("?m=");
  });

  test("each state is worded honestly", async ({ page }) => {
    // Price kept private.
    await page.goto(url("bengaluru/koramangala/unipole-sarjapur-road-ows0003"));
    await expect(page.locator("[data-section='price']")).toContainText("Price on request");
    await expect(page.locator("[data-section='price']")).toContainText(
      "Ask the owner; most reply within a day.",
    );
    await expect(page.locator("[data-action='enquire']").first()).toHaveText("Ask for a quote");
    await expect(page.locator("[data-section='audience']")).toContainText("Not provided yet");

    // A "from" price, and booked for the coming weeks.
    await page.goto(url("bengaluru/koramangala/hoarding-hosur-road-ows0002"));
    await expect(page.locator("[data-section='price']")).toContainText("From ₹ 1,40,000");
    await expect(page.locator("[data-section='price']")).toContainText("Booked until");
    await expect(page.locator("[data-section='price']")).toContainText(
      "You can ask about later dates.",
    );
    await expect(page.locator("[data-section='calendar'] .oh-cal .d.booked")).not.toHaveCount(0);

    // Availability confirmed long ago, an unverified location and no permit.
    await page.goto(url("bengaluru/indiranagar/hoarding-old-madras-road-ows0007"));
    await expect(page.locator("[data-section='price']")).toContainText("Last confirmed");
    await expect(page.locator("[data-section='price']")).toContainText(
      "Ask the owner to confirm before you plan around it.",
    );
    await expect(page.locator("[data-section='specs']")).toContainText(
      "owner-supplied, not yet verified",
    );
    await expect(page.locator("[data-section='specs']")).toContainText("Not provided yet");

    // Never confirmed: no calendar is drawn.
    await page.goto(url("bengaluru/whitefield/hoarding-varthur-road-ows0009"));
    await expect(page.locator("[data-section='calendar']")).toContainText(
      "has not confirmed availability yet",
    );
    await expect(page.locator("[data-section='calendar'] .oh-cal")).toHaveCount(0);

    // An expired permit is shown, not hidden.
    await page.goto(url("bengaluru/mg-road/hoarding-brigade-road-ows0013"));
    await expect(page.locator("[data-section='badges']")).toContainText("Permit expired");
    await expect(page.locator("[data-section='specs']")).toContainText("expired");

    // An owner who has not been verified, and a digital screen's own facts.
    await page.goto(url("hyderabad/hitech-city/hoarding-hitech-city-road-ows0028"));
    await expect(page.locator("[data-section='owner']")).toContainText("Owner not yet verified");
    await page.goto(url("bengaluru/indiranagar/led-screen-cmh-road-ows0006"));
    await expect(page.locator("[data-section='specs']")).toContainText("LED screen, digital");
    await expect(page.locator("[data-section='specs']")).toContainText("1920 × 1080");
    await expect(page.locator("[data-section='specs']")).toContainText("10 s");
  });
});

async function lastCode(request: APIRequestContext, email: string): Promise<string> {
  const { Authorization } = await adminHeaders(request);
  const res = await request.get(
    `/api/outbox?where[to][equals]=${encodeURIComponent(email)}&where[kind][equals]=code&sort=-createdAt&limit=1`,
    { headers: { Authorization } },
  );
  const body = (await res.json()) as { docs: { subject: string; text: string }[] };
  const code = /\b\d{6}\b/.exec(body.docs[0]?.text ?? "")?.[0];
  expect(code, "a code was written to the outbox").toBeTruthy();
  return code as string;
}

async function mails(
  request: APIRequestContext,
  to: string,
  kind: string,
): Promise<{ subject: string; text: string }[]> {
  const { Authorization } = await adminHeaders(request);
  const res = await request.get(
    `/api/outbox?where[to][equals]=${encodeURIComponent(to)}&where[kind][equals]=${kind}&sort=-createdAt&limit=20`,
    { headers: { Authorization } },
  );
  return ((await res.json()) as { docs: { subject: string; text: string }[] }).docs;
}

test.describe("enquiry", () => {
  test("a buyer confirms their email once, the owner gets the enquiry, and the next one needs no code", async ({
    page,
    request,
  }, info) => {
    const email = `e2e-${info.project.name}-${Date.now()}@example.org`;
    const brand = `Namma Bakes ${info.project.name} ${Date.now()}`;
    await page.goto("/enquire/ows0001/");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator("[data-section='enquiry-summary']")).toContainText(
      "20 × 10 ft hoarding, 80 Feet Road",
    );
    await expect(page.locator("[data-section='enquiry-summary']")).toContainText(
      "Goes straight to Kaveri Outdoor (sample).",
    );
    await expect(page.locator(".oh-btn.accent")).toHaveCount(1);
    await page.locator("#enq-from").fill(day(20));
    await page.locator("#enq-to").fill(day(50));
    await page.locator("#enq-brand").fill(brand);
    await page.locator("#enq-budget").fill("80000");
    await page.getByLabel("Ready").check();
    await page.locator("#enq-message").fill("Is the site free for the festival week too?");
    await page.locator("#enq-email").fill(email);
    await page.locator("[data-action='send']").click();

    await expect(page).toHaveURL(/\/enquire\/confirm\/\?ref=ENQ-[0-9A-Z]{8}$/);
    await expect(page.locator("h1")).toHaveText("Confirm it’s you");
    await expect(page.locator("[data-section='code-sent-to']")).toContainText("e··@example.org");
    await expect(page.locator("[data-section='code-sent-to']")).not.toContainText(email);
    // The code is never shown on a production build; it is only in the email.
    await expect(page.locator("[data-section='dev-code']")).toHaveCount(0);
    // Nothing has reached the owner yet.
    expect(
      (await mails(request, "kaveri@example.com", "owner_enquiry")).some((m) =>
        m.text.includes(brand),
      ),
    ).toBe(false);

    const code = await lastCode(request, email);
    await page.locator("#enq-code").fill(code === "000000" ? "111111" : "000000");
    await page.locator("[data-action='confirm']").click();
    await expect(page.locator("[data-section='confirm-error']")).toContainText(
      "That code did not match.",
    );
    await expect(page.locator("[data-section='confirm-error']")).toContainText("4 tries left");

    await page.locator("#enq-code").fill(code);
    await page.locator("[data-action='confirm']").click();
    await expect(page).toHaveURL(/\/enquire\/sent\/\?ref=ENQ-[0-9A-Z]{8}$/);
    await expect(page.locator("h1")).toHaveText("Sent to Kaveri Outdoor (sample).");
    await expect(page.locator("[data-section='enquiry-sent']")).toContainText("Under a day");
    await expect(page.locator("[data-section='enquiry-sent']")).toContainText(
      "ohworks charges nothing",
    );
    const reference = (await page.locator("[data-section='reference']").textContent()) ?? "";
    expect(reference).toMatch(/^ENQ-[0-9A-Z]{8}$/);

    // The owner's email carries everything they need, and replies go to the buyer.
    const toOwner = (await mails(request, "kaveri@example.com", "owner_enquiry")).find((m) =>
      m.text.includes(reference),
    );
    expect(toOwner, "the owner was emailed").toBeTruthy();
    expect(toOwner?.text).toContain(`Brand and category: ${brand}`);
    expect(toOwner?.text).toContain("Budget: ₹ 80,000 a month");
    expect(toOwner?.text).toContain("Artwork: Ready");
    expect(toOwner?.text).toContain(`reply straight to the buyer: ${email}`);
    expect(toOwner?.text).toMatch(
      /Answer in one step, with availability and your rate: \S+\/reply\/ENQ-[0-9A-Z]{8}\/\?k=[0-9a-f]{32}/,
    );
    expect(toOwner?.text).toContain("ohworks never sells media");
    expect(
      (await mails(request, email, "buyer_confirmation")).some((m) =>
        m.subject.includes(reference),
      ),
    ).toBe(true);

    // A used reference cannot be confirmed again; it only shows the sent page.
    await page.goto(`/enquire/confirm/?ref=${reference}`);
    await expect(page).toHaveURL(/\/enquire\/sent\//);

    // The same browser is remembered: the next enquiry goes straight through.
    await page.goto("/enquire/ows0005/");
    await expect(page.locator("#enq-email")).toHaveValue(email);
    await expect(page.locator("[data-section='email-help']")).toContainText("no code is needed");
    await page.locator("#enq-from").fill(day(10));
    await page.locator("#enq-to").fill(day(40));
    await page.locator("#enq-brand").fill(brand);
    await page.locator("[data-action='send']").click();
    await expect(page).toHaveURL(/\/enquire\/sent\/\?ref=ENQ-[0-9A-Z]{8}$/);
  });

  test("the form refuses what an owner could not act on", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const base = {
      id: "ows0001",
      from: day(20),
      to: day(40),
      brand: "Test brand, retail",
      artwork: "ready",
      email: `refuse-${Date.now()}@example.org`,
    };
    const post = (form: Record<string, string>, headers?: Record<string, string>) =>
      request.post("/api/enquire/", { form, maxRedirects: 0, ...(headers ? { headers } : {}) });

    const backwards = await post({ ...base, from: day(40), to: day(20) });
    expect(backwards.status()).toBe(303);
    expect(backwards.headers()["location"]).toMatch(/^\/enquire\/ows0001\/\?error=dates/);
    // What was typed comes back, but never the email address.
    expect(backwards.headers()["location"]).toContain("brand=Test+brand");
    expect(backwards.headers()["location"]).not.toContain("example.org");

    expect((await post({ ...base, from: day(-3) })).headers()["location"]).toContain("error=dates");
    expect((await post({ ...base, brand: "x" })).headers()["location"]).toContain("error=brand");
    expect((await post({ ...base, budget: "lots" })).headers()["location"]).toContain(
      "error=budget",
    );
    expect((await post({ ...base, email: "not-an-email" })).headers()["location"]).toContain(
      "error=email",
    );
    // A filled trap field, an unknown site and a post from another site all go nowhere.
    expect((await post({ ...base, website: "http://spam.example" })).headers()["location"]).toMatch(
      /\/enquire\/ows0001\/$/,
    );
    expect((await post({ ...base, id: "ows9zzz" })).headers()["location"]).toMatch(/\/search\/$/);
    expect((await post(base, { origin: "https://evil.example" })).status()).toBe(403);

    expect(
      (await request.get("/enquire/confirm/?ref=ENQ-00000000", { maxRedirects: 0 })).status(),
    ).toBe(404);
    expect((await request.get("/enquire/sent/?ref=nonsense", { maxRedirects: 0 })).status()).toBe(
      404,
    );
    expect((await request.get("/enquire/ows9zzz/", { maxRedirects: 0 })).status()).toBe(404);
    // The outbox and the enquiries are for staff only.
    expect((await request.get("/api/outbox")).status()).toBe(403);
    expect((await request.get("/api/enquiries")).status()).toBe(403);
    expect(
      (await request.post("/api/enquiries", { data: { reference: "ENQ-AAAAAAAA" } })).status(),
    ).toBe(403);
  });

  test("a mistake comes back with a plain message and what was typed", async ({ page }) => {
    await page.goto(
      `/enquire/ows0002/?error=dates&from=${day(30)}&to=${day(5)}&brand=Test+brand%2C+retail&artwork=in_progress`,
    );
    await expect(page.locator("[data-section='enquiry-error']")).toContainText("Check the dates.");
    await expect(page.locator("#enq-brand")).toHaveValue("Test brand, retail");
    await expect(page.getByLabel("In progress")).toBeChecked();
    await expect(page.locator("[data-section='booked-note']")).toContainText("Booked until");
  });
});
