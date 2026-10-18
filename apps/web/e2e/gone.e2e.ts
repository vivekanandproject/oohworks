import { expect, test } from "@playwright/test";
import { adminHeaders } from "./helpers/admin";

/**
 * A site the team took down answers 410 Gone, on its page and in the public API, and the page offers
 * the sites nearby. It is created already taken down, so the listings other tests count never hold it.
 */
test.describe("a site that was taken down", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough for a status",
  );

  test("answers 410 with what happened and similar sites, and an unknown site is still 404", async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request);
    const owner = (
      (await (
        await request.get("/api/owners?where[slug][equals]=sample-kaveri&depth=0", { headers })
      ).json()) as { docs: { id: number }[] }
    ).docs[0];
    expect(owner, "the sample owner from pnpm test:db").toBeTruthy();
    const created = await request.post("/api/sites?draft=false", {
      headers,
      data: {
        owner: owner!.id,
        format: "hoarding",
        environment: "roadside",
        width: 20,
        height: 10,
        sizeUnit: "ft",
        lighting: "front-lit",
        country: "in",
        city: "bengaluru",
        locality: "Koramangala",
        road: "Taken Down Road",
        lat: 12.9352,
        lng: 77.6245,
        priceDisplay: "on_request",
        review: "approved",
        removed: true,
        _status: "published",
      },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    const site = ((await created.json()) as { doc: { id: number; permanentId: string } }).doc;
    try {
      // Any wording before the id finds it; the page moves to its true address, which answers 410.
      const res = await page.goto(`/in/bengaluru/koramangala/hoarding-${site.permanentId}/`);
      expect(res?.status()).toBe(410);
      await expect(page.locator("h1")).toHaveText("This site is no longer listed");
      await expect(page.locator("[data-section='gone']")).toContainText("Taken Down Road");
      await expect(page.locator("[data-section='similar'] [data-site]").first()).toBeVisible();
      expect(await page.locator('meta[name="robots"]').first().getAttribute("content")).toContain(
        "noindex",
      );
      await expect(page.locator(".oh-btn.accent")).toHaveCount(0);

      const api = await request.get(`/api/v1/sites/${site.permanentId}/`);
      expect(api.status()).toBe(410);
      expect(await api.json()).toMatchObject({ status: 410, title: "Site removed" });

      const live = await page.goto("/in/bengaluru/koramangala/80-feet-road-ows0001/");
      expect(live?.status()).toBe(200);
      const unknown = await page.goto("/in/bengaluru/koramangala/hoarding-ow22222/");
      expect(unknown?.status()).toBe(404);
    } finally {
      await request.delete(`/api/sites/${site.id}`, { headers });
    }
  });
});
