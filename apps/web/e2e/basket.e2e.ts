import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/** These run against the labelled sample sites loaded by `pnpm --filter @ohworks/web seed:sites`. */
const RESULTS = "/search/?city=bengaluru";
const save = (page: Page, id: string) =>
  page.locator(`[data-site='${id}'] form[data-list-form='saved'] button`);
const compare = (page: Page, id: string) =>
  page.locator(`[data-site='${id}'] form[data-list-form='compare'] button`);
const planText = (page: Page) => page.locator("[data-plan-text]");

/** Puts sites straight into this browser's lists, the way pressing the buttons would. */
async function put(page: Page, list: "saved" | "compare", ids: string[]) {
  const res = await page.request.post("/api/lists/", {
    form: { list, action: "add", ids: ids.join(","), return: "/shortlist/" },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
}

test.describe("shortlist", () => {
  test("saving a site updates the page in place and is remembered", async ({ page }) => {
    await page.goto(RESULTS);
    await expect(page.locator("[data-plan]")).toBeHidden();
    await expect(save(page, "ows0001")).toHaveAttribute("aria-pressed", "false");
    await expect(save(page, "ows0001")).toContainText("Save");

    await save(page, "ows0001").click();
    await expect(save(page, "ows0001")).toHaveAttribute("aria-pressed", "true");
    await expect(save(page, "ows0001").locator("[data-label]")).toHaveText("Saved");
    await expect(planText(page)).toHaveText("1 site saved · 1 owner · ₹ 85,000 a month shown");
    await expect(page).toHaveURL(/\/search\/\?city=bengaluru$/);

    // Two quick presses must both count.
    await save(page, "ows0014").click();
    await save(page, "ows0003").click();
    await expect(planText(page)).toHaveText(
      "3 sites saved · 1 owner · ₹ 3,15,000 a month shown · 1 on request",
    );

    await page.reload();
    await expect(save(page, "ows0001")).toHaveAttribute("aria-pressed", "true");
    await expect(planText(page)).toContainText("3 sites saved");

    for (const id of ["ows0001", "ows0014", "ows0003"]) await save(page, id).click();
    await expect(page.locator("[data-plan]")).toBeHidden();
    await expect(save(page, "ows0001").locator("[data-label]")).toHaveText("Save");
  });

  test("the shortlist groups sites by owner and adds up only what owners show", async ({
    page,
  }) => {
    await put(page, "saved", ["ows0001", "ows0003", "ows0002", "ows0017"]);
    await page.goto("/shortlist/");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator("h1")).toHaveText("Your shortlist");
    await expect(page.locator("[data-owner-group]")).toHaveCount(2);
    await expect(page.locator("[data-owner-group='sample-kaveri']")).toContainText(
      "Kaveri Outdoor (sample) · 3 sites",
    );
    await expect(page.locator("[data-owner-group='sample-kaveri'] [data-site]")).toHaveCount(3);
    await expect(page.locator("[data-owner-group='sample-marine'] [data-site]")).toHaveCount(1);

    const totals = page.locator("[data-section='plan-totals']");
    await expect(totals).toContainText("Sites4");
    await expect(totals).toContainText("Owners2");
    // ₹ 85,000 + from ₹ 1,40,000 + from ₹ 3,50,000; the unipole shows no price.
    await expect(totals).toContainText("From ₹ 5,75,000");
    await expect(totals).toContainText("Price on request1 site");
    await expect(page.locator("[data-section='plan-budget']")).toHaveCount(0);

    const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
    await page.locator("#plan-from").fill(day(3));
    await page.locator("#plan-to").fill(day(33));
    await page.locator("#plan-budget").fill("600000");
    await page.getByRole("button", { name: "Update the summary" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/shortlist/\\?from=${day(3)}&to=${day(33)}&budget=600000$`),
    );
    await expect(page.locator("[data-section='plan-budget']")).toHaveAttribute(
      "data-budget",
      "under",
    );
    await expect(page.locator("[data-section='plan-budget']")).toContainText(
      "₹ 25,000 a month under your budget.",
    );
    await expect(page.locator("[data-section='plan-budget']")).toContainText(
      "Not counting 1 site with price on request.",
    );
    // Free and booked are judged against the start date the buyer gave.
    await expect(page.locator("[data-site='ows0001'] [data-row-availability]")).toHaveText(
      "Free for your dates",
    );
    await expect(page.locator("[data-site='ows0002'] [data-row-availability]")).toContainText(
      "Booked until",
    );
    await expect(
      page.locator("[data-site='ows0001']").getByRole("link", { name: "Enquire" }),
    ).toHaveAttribute("href", `/enquire/ows0001/?from=${day(3)}&to=${day(33)}`);

    // The share link carries the sites and the dates, never the budget.
    const link = await page.locator("#plan-link").inputValue();
    expect(link).toContain(
      `/shortlist/?sites=ows0001,ows0003,ows0002,ows0017&from=${day(3)}&to=${day(33)}`,
    );
    expect(link).not.toContain("budget");

    await page
      .locator("[data-site='ows0017']")
      .getByRole("button", { name: /Remove/ })
      .click();
    await expect(page.locator("[data-owner-group]")).toHaveCount(1);
    await expect(page).toHaveURL(/budget=600000$/);
    await page.getByRole("button", { name: "Clear the shortlist" }).click();
    await expect(page.locator("[data-section='shortlist-empty']")).toContainText(
      "No sites saved yet",
    );
  });

  test("a shared shortlist can be read, and kept, by someone else", async ({ page }) => {
    await page.goto("/shortlist/?sites=ows0001,ows0002,ows9zzz&from=2027-01-01&to=2027-01-31");
    await expect(page.locator("h1")).toHaveText("A shared shortlist");
    await expect(page.locator("[data-section='gone']")).toContainText(
      "One site here is no longer listed",
    );
    await expect(page.locator("[data-section='shortlist'] [data-site]")).toHaveCount(2);
    await expect(page.locator("[data-section='plan-totals']")).toContainText("1 to 31 Jan 2027");
    await page
      .locator("[data-section='save-all']")
      .getByRole("button", { name: "Save all to my shortlist" })
      .click();
    await expect(page).toHaveURL(/\/shortlist\/\?from=2027-01-01&to=2027-01-31$/);
    await expect(page.locator("h1")).toHaveText("Your shortlist");
    await expect(page.locator("[data-section='shortlist'] [data-site]")).toHaveCount(2);
  });

  test("a site page can be saved and its link copied", async ({ page }) => {
    await page.goto("/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/");
    const keep = page.locator("[data-section='keep']");
    await expect(keep.getByRole("button", { name: "Copy link" })).toBeVisible();
    await keep.locator("form[data-list-form='saved'] button").click();
    await expect(keep.locator("form[data-list-form='saved'] [data-label]")).toHaveText("Saved");
    await keep.getByRole("link", { name: "View shortlist" }).click();
    await expect(page.locator("[data-section='shortlist'] [data-site='ows0001']")).toBeVisible();
  });
});

test.describe("compare", () => {
  test("up to four sites can be ticked, and a fifth is refused with a reason", async ({ page }) => {
    await page.goto(RESULTS);
    for (const id of ["ows0001", "ows0014", "ows0005", "ows0012"]) await compare(page, id).click();
    await expect(page.locator("[data-plan-compare-n]")).toHaveText("4");
    await expect(compare(page, "ows0012").locator("[data-label]")).toHaveText("Comparing");
    await compare(page, "ows0002").click();
    await expect(page.locator("[data-list-status]")).toHaveText(
      "You can compare four sites at a time. Remove one first.",
    );
    await expect(compare(page, "ows0002")).toHaveAttribute("aria-pressed", "false");

    await page.locator("[data-plan-compare]").click();
    await expect(page.locator("[data-section='compare-heading']")).toHaveText("Compare 4 sites");
    await expect(page.locator("[data-section='compare-table'] thead th[data-site]")).toHaveCount(4);
    await page
      .locator("th[data-site='ows0012']")
      .getByRole("button", { name: /Remove/ })
      .click();
    await expect(page.locator("[data-section='compare-heading']")).toHaveText("Compare 3 sites");
    await page.getByRole("button", { name: "Clear the comparison" }).click();
    await expect(page.locator("[data-section='compare-empty']")).toContainText(
      "Nothing to compare yet",
    );
  });

  test("sites are set side by side, fact by fact", async ({ page }) => {
    await page.goto("/compare/?sites=ows0001,ows0002,ows0006,ows0003,ows0017");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    // A link can carry more than four; only the first four are compared.
    await expect(page.locator("[data-section='compare-heading']")).toHaveText("Compare 4 sites");
    await expect(page.locator("[data-section='compare-lead']")).toContainText(
      "These sites lie within",
    );
    const row = (label: string) =>
      page
        .locator("[data-section='compare-table'] tbody tr")
        .filter({ has: page.locator("th", { hasText: new RegExp(`^${label}$`) }) });
    await expect(row("Size").locator("td")).toHaveText([
      "20 × 10 ft (6.1 × 3.0 m)",
      "30 × 15 ft (9.1 × 4.6 m)",
      "16 × 9 ft (4.9 × 2.7 m)",
      "20 × 20 ft (6.1 × 6.1 m)",
    ]);
    await expect(row("Price a month").locator("td")).toHaveText([
      "₹ 85,000",
      "From ₹ 1,40,000",
      "From ₹ 60,000",
      "Price on request",
    ]);
    await expect(row("Audience").locator("td").nth(0)).toContainText("4.2 lakh a week");
    await expect(row("Audience").locator("td").nth(0)).toContainText("Sample data");
    await expect(row("Audience").locator("td").nth(3)).toHaveText("Not provided yet");
    await expect(row("Printing and mounting").locator("td").nth(2)).toHaveText(
      "Not needed for a screen",
    );
    await expect(row("Availability").locator("td").nth(1)).toContainText("Booked until");
    await expect(row("Checked").locator("td").nth(0)).toHaveText("Owner · Location · Permit");
    await expect(row("From the first site").locator("td").nth(0)).toHaveText("This one");
    await expect(row("From the first site").locator("td").nth(1)).toHaveText("1.2 km");
    await expect(row("Ask the owner").locator("td").nth(3).getByRole("link")).toHaveAttribute(
      "href",
      "/enquire/ows0003/",
    );

    await expect(page.locator("[data-action='enquire-all']")).toHaveAttribute(
      "href",
      "/enquire/plan/?sites=ows0001,ows0002,ows0006,ows0003",
    );
    await page
      .locator("th[data-site='ows0006']")
      .getByRole("link", { name: /Remove/ })
      .click();
    await expect(page).toHaveURL(/\/compare\/\?sites=ows0001,ows0002,ows0003$/);
    await page.getByRole("button", { name: "Save all to my shortlist" }).click();
    await expect(page.getByRole("link", { name: "View shortlist" })).toBeVisible();

    await page.goto("/compare/?sites=ows0001");
    await expect(page.locator("[data-section='compare-lead']")).toContainText(
      "at least one more site",
    );
    await page.goto("/compare/?sites=ows0001,ows0017");
    await expect(page.locator("[data-section='compare-lead']")).toContainText(
      "The two furthest apart are",
    );
  });
});

test.describe("quick view", () => {
  test("opens beside the list, keeps the place, and gives the keyboard back", async ({ page }) => {
    await page.goto(RESULTS);
    const link = page.locator("[data-site='ows0005'] a[data-quick]");
    await link.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await link.click();
    const panel = page.getByRole("dialog", { name: "Quick view" });
    await expect(panel.locator("h3")).toHaveText("40 × 20 ft hoarding, 100 Feet Road");
    await expect(panel).toContainText("40 × 20 ft (12.2 × 6.1 m)");
    await expect(panel).toContainText("5.4 lakh a week");
    await expect(panel.locator("[data-quick-price]")).toContainText("₹ 1,90,000");
    await expect(panel).toContainText("Kaveri Outdoor (sample)");
    await expect(panel.getByRole("link", { name: "Open full page" })).toHaveAttribute(
      "href",
      /hoarding-100-feet-road-ows0005\/$/,
    );
    await expect(panel.locator("[data-action='enquire']")).toHaveAttribute(
      "href",
      "/enquire/ows0005/",
    );
    await expect(panel.getByRole("button", { name: "Close" })).toBeFocused();
    await expect(page).toHaveURL(/\/search\/\?city=bengaluru$/);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    // Saving inside the panel also marks the card behind it.
    await panel.locator("form[data-list-form='saved'] button").click();
    await expect(panel.locator("form[data-list-form='saved'] [data-label]")).toHaveText("Saved");
    await expect(save(page, "ows0005").locator("[data-label]")).toHaveText("Saved");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Quick view" })).toHaveCount(0);
    await expect(link).toBeFocused();
  });

  test("its content is a real page that is kept out of the index", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const res = await request.get("/quick/ows0001/");
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/<meta name="robots" content="noindex/);
    expect((await request.get("/quick/ows9zzz/")).status()).toBe(404);
    const robots = await (await request.get("/robots.txt")).text();
    for (const path of ["/shortlist/", "/compare/", "/quick/"])
      expect(robots).toContain(`Disallow: ${path}`);
  });
});

test.describe("without script", () => {
  test.use({ javaScriptEnabled: false });

  test("saving, comparing and quick view still work as plain forms and links", async ({ page }) => {
    await page.goto(RESULTS);
    await save(page, "ows0001").click();
    await expect(page).toHaveURL(/\/search\/\?city=bengaluru$/);
    await expect(save(page, "ows0001")).toHaveAttribute("aria-pressed", "true");
    await expect(planText(page)).toHaveText("1 site saved · 1 owner · ₹ 85,000 a month shown");
    await compare(page, "ows0001").click();
    await expect(compare(page, "ows0001")).toContainText("Comparing");
    await page.locator("[data-site='ows0001'] a[data-quick]").click();
    await expect(page).toHaveURL(/hoarding-80-feet-road-ows0001\/$/);
    await expect(page.locator("h1")).toHaveText("20 × 10 ft hoarding, 80 Feet Road");
  });

  test("a fifth compare pick lands on the comparison with the reason", async ({ page }) => {
    await put(page, "compare", ["ows0001", "ows0014", "ows0005", "ows0012"]);
    await page.goto(RESULTS);
    await compare(page, "ows0002").click();
    await expect(page).toHaveURL(/\/compare\/\?full=1$/);
    await expect(page.locator("[data-section='compare-full']")).toContainText(
      "four sites at a time",
    );
  });
});

test.describe("lists endpoint", () => {
  test("refuses other sites, ignores unknown ids and only returns to this site", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const post = (form: Record<string, string>, headers: Record<string, string> = {}) =>
      request.post("/api/lists/", { form, headers, maxRedirects: 0 });
    expect(
      (await post({ list: "saved", id: "ows0001" }, { origin: "https://evil.example" })).status(),
    ).toBe(403);

    const unknown = await post({ list: "saved", id: "ows9zzz" }, { accept: "application/json" });
    expect(((await unknown.json()) as { saved: string[] }).saved).toEqual([]);
    const real = await post({ list: "saved", id: "ows0001" }, { accept: "application/json" });
    const body = (await real.json()) as { saved: string[]; on: boolean; text: string };
    expect(body.saved).toEqual(["ows0001"]);
    expect(body.on).toBe(true);
    // The rupee sign is tied to its figure with a non-breaking space.
    expect(body.text.replace(/\u00a0/g, " ")).toBe(
      "1 site saved · 1 owner · ₹ 85,000 a month shown",
    );
    expect(real.headers()["set-cookie"]).toMatch(/oh_saved=ows0001;.*HttpOnly/i);

    const away = await post({ list: "saved", id: "ows0002", return: "//evil.example/x" });
    expect(away.status()).toBe(303);
    expect(away.headers()["location"]).toBe("/shortlist/");
    expect(
      (await post({ list: "admin", id: "ows0001", return: "/search/" })).headers()["location"],
    ).toBe("/search/");
  });
});

async function follows(
  request: APIRequestContext,
  email: string,
): Promise<{ search?: string; source: string; city?: string }[]> {
  const login = await request.post("/api/users/login", {
    data: {
      email: "admin@ohworks.local",
      password: process.env.SEED_ADMIN_PASSWORD ?? "ohworks-admin-local",
    },
  });
  const { token } = (await login.json()) as { token: string };
  const res = await request.get(
    `/api/follows?where[email][equals]=${encodeURIComponent(email)}&limit=5`,
    { headers: { Authorization: `JWT ${token}` } },
  );
  return ((await res.json()) as { docs: { search?: string; source: string; city?: string }[] })
    .docs;
}

test.describe("saved search", () => {
  test("a buyer can ask to hear about new sites for a search that already has results", async ({
    page,
    request,
  }, info) => {
    const email = `saved-${info.project.name}-${Date.now()}@example.org`;
    await page.goto("/search/?city=bengaluru&format=hoarding");
    const box = page.locator("[data-section='save-search']");
    await box.locator("summary").click();
    await box.locator("input[type='email']").fill(email);
    await box.getByRole("button", { name: "Email me new hoardings in Bengaluru" }).click();
    await expect(page).toHaveURL(/\/search\/\?city=bengaluru&format=hoarding&followed=1$/);
    await expect(page.getByRole("status").first()).toContainText(
      "We will email you when new hoardings in Bengaluru are listed",
    );
    await expect(page.locator("[data-section='save-search']")).toHaveCount(0);
    const stored = await follows(request, email);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.source).toBe("saved_search");
    expect(stored[0]?.search).toBe("/search/?city=bengaluru&format=hoarding");
  });
});

test.describe("map area", () => {
  test("a search by map area keeps only the sites inside it", async ({ page }) => {
    await page.goto("/search/?bbox=77.55,12.9,77.66,12.99&map=0");
    await expect(page).toHaveURL(/\/search\/\?bbox=77\.5500,12\.9000,77\.6600,12\.9900&map=0$/);
    await expect(page.locator("[data-section='heading']")).toHaveText("11 sites in this map area");
    await expect(page.locator("[data-section='results'] [data-site='ows0001']")).toBeVisible();
    await expect(page.locator("[data-section='results'] [data-site='ows0014']")).toHaveCount(0);
  });

  test("the live map draws streets, clusters, lights up with the list and searches where you look", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for the map library",
    );
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(m.text());
    });
    await page.route("**/tiles.openfreemap.org/**", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
      }),
    );
    const worker = page.waitForResponse((r) => r.url().includes("/vendor/maplibre-gl-worker.mjs"));
    await page.goto(RESULTS);
    await expect(page.locator("[data-section='map'] [data-map]")).toHaveAttribute(
      "data-map",
      "still",
    );
    await page.getByRole("button", { name: "Show the live map" }).click();
    expect((await worker).status()).toBe(200);
    const map = page.locator("[data-section='live-map']");
    await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 });
    expect(await map.getAttribute("data-map-error")).toBeNull();
    expect(problems.filter((p) => /worker/i.test(p))).toEqual([]);

    // Every site is on the map, as its own pin or inside a counted cluster.
    const drawn = await page.evaluate(
      () =>
        document.querySelectorAll(".oh-mappin").length +
        Array.from(document.querySelectorAll(".oh-cluster")).reduce(
          (n, c) => n + Number(c.textContent),
          0,
        ),
    );
    expect(drawn).toBe(16);
    await expect(page.locator(".oh-cluster").first()).toBeVisible();

    // Pointing at a card lights the pin or cluster that holds it.
    await page.locator("[data-section='results'] [data-site='ows0001']").hover();
    await expect(page.locator(".oh-mappin.lit, .oh-cluster.lit")).toHaveCount(1);

    // A cluster opens into its sites, and choosing a pin names the site.
    const drawnNow = () =>
      page.evaluate(
        () =>
          `${document.querySelectorAll(".oh-mappin").length}|${Array.from(document.querySelectorAll(".oh-cluster"), (c) => c.textContent).join(",")}`,
      );
    const before = await drawnNow();
    await page.locator(".oh-cluster").first().click();
    await expect.poll(drawnNow, { timeout: 10_000 }).not.toBe(before);
    await page.waitForTimeout(800);
    await page.locator(".oh-mappin").first().click();
    await expect(page.locator(".oh-mappin.here")).toHaveCount(1);
    await expect(page.locator(".oh-mappop")).toContainText("Quick view");
    await page.locator(".oh-mappop a[data-quick]").click();
    await expect(page.getByRole("dialog", { name: "Quick view" }).locator("h3")).not.toBeEmpty();
    await page.keyboard.press("Escape");

    // The live map stays on for the next search in this tab.
    await page.goto("/search/?city=bengaluru&format=hoarding");
    await expect(page.locator("[data-section='live-map']")).toHaveAttribute(
      "data-map-state",
      "ready",
      { timeout: 20_000 },
    );

    // Moving the map offers a search of what is now in view.
    const box = await page.locator("[data-section='live-map']").boundingBox();
    if (!box) throw new Error("the map has no box");
    await page.mouse.move(box.x + 180, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 240, box.y + 340, { steps: 8 });
    await page.mouse.up();
    await page.locator("[data-action='search-area']").click();
    await expect(page).toHaveURL(/\/search\/\?bbox=[\d.]+,[\d.]+,[\d.]+,[\d.]+&format=hoarding$/);
    await expect(page.locator("[data-section='heading']")).toContainText("in this map area");
    await expect(page.locator("[data-section='live-map']")).toHaveAttribute(
      "data-map-state",
      "ready",
      { timeout: 20_000 },
    );
    await page.locator("[data-remove-area]").click();
    await expect(page).toHaveURL(/\/search\/\?format=hoarding$/);
  });
});
