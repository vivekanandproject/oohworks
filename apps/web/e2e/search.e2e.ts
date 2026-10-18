import { expect, test } from "@playwright/test";

/** These run against the labelled sample sites in e2e/fixtures, loaded into the test database by `pnpm test:db`. */
test.describe("find sites: results", () => {
  test("shows what it understood as removable chips, and the sites that match", async ({
    page,
  }) => {
    await page.goto("/search/?q=20x10+hoardings+in+Bengaluru+under+1+lakh");
    const understood = page.locator("[data-section='understood']");
    await expect(understood).toContainText("Bengaluru");
    await expect(understood).toContainText("Hoardings");
    await expect(understood).toContainText("20 × 10 ft");
    await expect(understood).toContainText("Under ₹ 1,00,000 a month");
    await expect(page.locator("[data-section='heading']")).toHaveText("3 hoardings in Bengaluru");
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(3);
    await expect(page.locator("[data-section='wider']")).toContainText("Any size");
  });

  test("removing a chip clears that filter", async ({ page }) => {
    await page.goto("/search/?q=hoardings+in+Bengaluru");
    await page.getByRole("link", { name: "Remove Bengaluru" }).click();
    await expect(page).toHaveURL(/format=hoarding/);
    await expect(page).not.toHaveURL(/bengaluru/i);
  });

  test("a card answers what, where, price, availability and who sells it", async ({ page }) => {
    await page.goto("/search/?city=bengaluru");
    await expect(page.locator("[data-section='sample-notice']")).toContainText("sample listings");
    const card = page.locator("[data-site='ows0001']");
    await expect(card.getByRole("heading")).toHaveText("20 × 10 ft hoarding, 80 Feet Road");
    await expect(card).toContainText("Koramangala, Bengaluru");
    await expect(card).toContainText("₹ 85,000");
    await expect(card.locator("[data-availability]")).toHaveText("Available now");
    await expect(card).toContainText("Kaveri Outdoor (sample)");
    await expect(card).toContainText("No photo yet");
    await expect(card).toContainText("Verified owner");
    await expect(card).toContainText("Sample listing");
    await expect(card.getByRole("link", { name: "Enquire" })).toHaveAttribute(
      "href",
      "/enquire/ows0001/",
    );
    await expect(page.locator("[data-site='ows0002'] [data-availability]")).toContainText(
      "Booked until",
    );
    await expect(page.locator("[data-site='ows0003'] [data-price]")).toHaveText("Price on request");
  });

  test("is never indexed, and no card carries the accent", async ({ page }) => {
    await page.goto("/search/?city=mumbai");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator("[data-section='heading']")).toHaveText("6 sites in Mumbai");
    // One accent per view at most (the design system). A results page has no single primary
    // action, so it has none; each card's Enquire is secondary.
    await expect(page.locator(".oh-btn.accent")).toHaveCount(0);
    await expect(
      page.locator("[data-site] .oh-btn.secondary", { hasText: "Enquire" }).first(),
    ).toBeVisible();
  });

  test("filter menus change the address in a fixed order and show counts", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "the filter bar is for wider screens; phones use the panel");
    await page.goto("/search/");
    await page.locator("[data-filter='format'] summary").click();
    await page
      .locator("[data-filter='format']")
      .getByRole("link", { name: /LED screens/ })
      .click();
    await expect(page).toHaveURL(/\/search\/\?format=led-screen$/);
    await page.locator("[data-filter='place'] summary").click();
    const mumbai = page.locator("[data-filter='place']").getByRole("link", { name: /Mumbai/ });
    await expect(mumbai.locator(".n")).toHaveText("1");
    await mumbai.click();
    await expect(page).toHaveURL(/\/search\/\?city=mumbai&format=led-screen$/);
    await expect(page.locator("[data-section='heading']")).toHaveText("1 LED screen in Mumbai");
    // An option that would give nothing is shown, but is not a link.
    await page.locator("[data-filter='place'] summary").click();
    await expect(page.locator("[data-filter='place'] .oh-opt.none")).toContainText([
      "Hyderabad",
      "Chennai",
    ]);
  });

  test("the price filter is a plain form and keeps the other filters", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "the filter bar is for wider screens");
    await page.goto("/search/?city=bengaluru&format=hoarding");
    await page.locator("[data-filter='price'] summary").click();
    await page.locator("[data-filter='price'] input[name='max']").fill("50000");
    await page.locator("[data-filter='price']").getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/\/search\/\?city=bengaluru&format=hoarding&max=50000$/);
    await expect(page.locator("[data-section='heading']")).toHaveText("2 hoardings in Bengaluru");
  });

  test("sorting by price puts the cheapest first and unpriced sites last", async ({ page }) => {
    await page.goto("/search/?city=bengaluru&sort=price");
    const order = await page
      .locator("[data-section='results'] [data-site]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-site")));
    expect(order[0]).toBe("ows0015");
    expect(order[1]).toBe("ows0004");
    await page.goto("/search/?city=bengaluru&sort=price&page=2");
    await expect(
      page.locator("[data-section='results'] [data-site]").last().locator("[data-price]"),
    ).toHaveText("Price on request");
  });

  test("pages hold twelve sites, and a page past the end returns to the first", async ({
    page,
  }) => {
    await page.goto("/search/?city=bengaluru");
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(12);
    await expect(page.locator("[data-section='pager']")).toContainText("Page 1 of 2");
    await page.locator("[data-section='pager']").getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/city=bengaluru&page=2$/);
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(4);
    await page.goto("/search/?city=bengaluru&page=9");
    await expect(page).toHaveURL(/\/search\/\?city=bengaluru$/);
  });

  test("the map can be hidden, and the live map loads only when asked for", async ({
    page,
    browserName,
    isMobile,
  }) => {
    await page.goto("/search/?city=bengaluru&map=0");
    await expect(page.locator("[data-section='results']")).toHaveAttribute("data-layout", "list");
    await expect(page.locator("[data-section='map']")).toHaveCount(0);

    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for the map library",
    );
    await page.route("**/tiles.openfreemap.org/**", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
      }),
    );
    await page.goto("/search/?city=bengaluru");
    await expect(page.locator("[data-section='map'] svg[role='img']")).toBeVisible();
    await expect(page.locator(".maplibregl-canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Show the live map" }).click();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[data-section='live-map']")).toHaveAttribute(
      "data-map-state",
      "ready",
      { timeout: 20_000 },
    );
  });

  test("the all-filters panel works as a page, keeps its place and closes", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/search/?city=bengaluru");
    if (isMobile)
      await page
        .locator("[data-section='phonebar']")
        .getByRole("link", { name: /Filters/ })
        .click();
    else await page.locator("[data-open-filters]").click();
    await expect(page).toHaveURL(/city=bengaluru&filters=1$/);
    const panel = page.getByRole("dialog", { name: "All filters" });
    await expect(panel).toBeVisible();
    await panel.getByRole("link", { name: /Permit on file/ }).click();
    await expect(page).toHaveURL(/city=bengaluru&trust=permit&filters=1$/);
    const show = page.locator("[data-show-results]");
    await expect(show).toHaveText(/Show \d+ sites/);
    await show.click();
    await expect(page).toHaveURL(/city=bengaluru&trust=permit$/);
    await expect(page.getByRole("dialog", { name: "All filters" })).toHaveCount(0);
  });

  test("an owner's sites can be listed on their own", async ({ page }) => {
    await page.goto("/search/?owner=sample-coromandel");
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(3);
  });

  test("nothing matching is said plainly, with ways to widen and a follow form", async ({
    page,
  }) => {
    await page.goto("/search/?city=pune&format=gantry");
    const results = page.locator("[data-section='results']");
    await expect(results).toHaveAttribute("data-layout", "empty");
    await expect(results).toContainText("No gantries in Pune yet");
    await expect(page.locator("[data-section='follow']")).toBeVisible();
    await expect(page.locator("[data-section='wider']")).toContainText("Any format");
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
    // A path, never a full address: behind a proxy the server does not know its public host.
    expect(ok.headers()["location"]).toBe("/search/?q=test&city=bengaluru&followed=1");
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
    await page.goto("/search/?city=pune&format=gantry&followed=1");
    await expect(page.getByRole("status")).toContainText("You are on the list");
    await expect(page.locator("[data-section='follow']")).toHaveCount(0);
  });

  test("how results are ordered is published and linked", async ({ page }) => {
    await page.goto("/search/?city=bengaluru");
    await page.getByRole("link", { name: "How results are ordered" }).click();
    await expect(page.locator("h1")).toHaveText("How results are ordered");
    await expect(page.locator("main")).toContainText("not for sale");
  });
});
