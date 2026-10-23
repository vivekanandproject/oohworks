import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { adminHeaders } from "./helpers/admin";

/**
 * A real site (not a sample) that meets the content bar is ready for search engines, Bing, answer
 * engines and AI agents; the owner onboarding pages are too. Sample sites never reach an index, so
 * this file makes one real, verified site in Chennai (a city and format no other test counts) and
 * removes it afterwards.
 */
test.describe.configure({ mode: "serial" });

const UNIT = "owe2e01";
let ownerId = 0;
let mediaId = 0;
let siteId = 0;
let sitePath = "";

async function api(
  request: APIRequestContext,
  method: "post" | "delete",
  path: string,
  data?: unknown,
) {
  const res = await request[method](path, {
    headers: await adminHeaders(request),
    ...(data ? { data } : {}),
  });
  if (!res.ok()) throw new Error(`${method} ${path} answered ${res.status()}: ${await res.text()}`);
  return (await res.json()) as { doc: { id: number } & Record<string, unknown> };
}

test.beforeAll(async ({ request }) => {
  const photo = readFileSync(new URL("../public/brand/oohworks-logo-512.png", import.meta.url));
  const media = await request.post("/api/media/", {
    headers: await adminHeaders(request),
    multipart: {
      file: { name: "e2e-unipole.png", mimeType: "image/png", buffer: photo },
      _payload: JSON.stringify({
        alt: "A unipole on Anna Salai seen from the road",
        credit: "OOHWORKS test",
        licence: "owned",
      }),
    },
  });
  if (!media.ok())
    throw new Error(`media upload answered ${media.status()}: ${await media.text()}`);
  mediaId = ((await media.json()) as { doc: { id: number } }).doc.id;
  ownerId = (
    await api(request, "post", "/api/owners/", {
      name: "Test Outdoor Chennai",
      slug: "test-outdoor-chennai-e2e",
      city: "chennai",
      contactEmail: "test-outdoor-chennai@example.com",
      verified: true,
      verifiedOn: new Date().toISOString(),
      sample: false,
    })
  ).doc.id;
  const site = await api(request, "post", "/api/sites/", {
    _status: "published",
    review: "approved",
    sample: false,
    removed: false,
    owner: ownerId,
    permanentId: UNIT,
    format: "unipole",
    environment: "roadside",
    width: 40,
    height: 20,
    sizeUnit: "ft",
    lighting: "front-lit",
    country: "in",
    city: "chennai",
    locality: "Teynampet",
    road: "Anna Salai",
    landmark: "near Gemini flyover",
    lat: 13.04512,
    lng: 80.24822,
    facingDeg: 30,
    trafficDirection: "Guindy",
    verifiedLocation: true,
    lastVerifiedOn: new Date().toISOString(),
    priceDisplay: "exact",
    rate: 250000,
    minPeriod: "1 month",
    availabilityConfirmedOn: new Date().toISOString(),
    photos: [{ image: mediaId, kind: "approach", takenOn: new Date().toISOString() }],
  });
  siteId = site.doc.id;
  const s = site.doc as unknown as {
    city: string;
    localitySlug: string;
    slug: string;
    permanentId: string;
  };
  sitePath = `/in/${s.city}/${s.localitySlug}/${s.slug}-${s.permanentId}/`;
});

test.afterAll(async ({ request }) => {
  const headers = await adminHeaders(request);
  if (siteId) await request.delete(`/api/sites/${siteId}/`, { headers });
  if (ownerId) await request.delete(`/api/owners/${ownerId}/`, { headers });
  if (mediaId) await request.delete(`/api/media/${mediaId}/`, { headers });
});

async function jsonLd(
  page: import("@playwright/test").Page,
): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => {
    const parsed = JSON.parse(b) as unknown;
    return (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
  });
}

test.describe("a real site page", () => {
  test("is indexed, with a social card, a Markdown link and the large image preview", async ({
    page,
  }) => {
    const res = await page.goto(sitePath);
    expect(res?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("index");
    expect(robots).not.toContain("noindex");
    expect(robots).toContain("max-image-preview:large");
    expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toContain(
      "Anna Salai",
    );
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(
      /^https?:\/\//,
    );
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe(
      "summary_large_image",
    );
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      "href",
      new RegExp(`${sitePath.replace(/\/$/, "")}\\.md$`),
    );
  });

  test("is marked up as a product you can lease and a place on the map, with breadcrumbs", async ({
    page,
  }) => {
    await page.goto(sitePath);
    const data = await jsonLd(page);
    const site = data.find((d) => Array.isArray(d["@type"])) as {
      "@type": string[];
      sku: string;
      geo: { latitude: number; longitude: number };
      address: { addressLocality: string; addressCountry: string };
      image: string[];
      offers: {
        price: number;
        priceCurrency: string;
        availability: string;
        seller: { name: string; url: string };
      };
    };
    expect(site["@type"]).toEqual(["Product", "Place"]);
    expect(site.sku).toBe(UNIT);
    expect(site.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 13.04512,
      longitude: 80.24822,
    });
    expect(site.address.addressLocality).toBe("Teynampet");
    expect(site.address.addressCountry).toBe("IN");
    expect(site.image.length).toBeGreaterThan(0);
    expect(site.offers.price).toBe(250000);
    expect(site.offers.priceCurrency).toBe("INR");
    expect(site.offers.availability).toBe("https://schema.org/InStock");
    expect(site.offers.seller.url).toMatch(/\/owners\/test-outdoor-chennai-e2e\/$/);
    const crumbs = data.find((d) => d["@type"] === "BreadcrumbList") as {
      itemListElement: unknown[];
    };
    expect(crumbs.itemListElement).toHaveLength(3);
  });

  test("has a Markdown copy with every fact, its checks and how to ask the owner", async ({
    request,
  }) => {
    const res = await request.get(sitePath.replace(/\/$/, ".md"));
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/markdown");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(res.headers()["link"]).toContain(`${sitePath}>; rel="canonical"`);
    const md = await res.text();
    expect(md).toContain(`unit_id: "${UNIT}"`);
    expect(md).toContain("latitude: 13.04512");
    expect(md).toContain("price_inr_per_month: 250000");
    expect(md).toMatch(/- \*\*Size:\*\* 40 × 20 ft/);
    expect(md).toContain("- Verified owner");
    expect(md).toContain("- Verified location");
    expect(md).toContain(`/enquire/${UNIT}/`);
    expect(md).not.toContain("test-outdoor-chennai@example.com");
  });

  test("is in the sitemap with its photo, and a sample site's Markdown copy is 404", async ({
    request,
  }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(sitePath);
    expect(sitemap).toMatch(/<image:loc>[^<]+<\/image:loc>/);
    expect(
      (await request.get("/in/bengaluru/koramangala/unipole-sarjapur-road-ows0003.md")).status(),
    ).toBe(404);
  });
});

test.describe("owner onboarding", () => {
  test("For owners answers in short, asks and answers the questions, and marks them up", async ({
    page,
  }) => {
    await page.goto("/for-owners/");
    const answer = page.locator("[data-section='short-answer'] p");
    const words = (await answer.textContent())!.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
    expect(await page.locator("[data-section='faq-item']").count()).toBeGreaterThanOrEqual(8);
    const faq = (await jsonLd(page)).find((d) => d["@type"] === "FAQPage") as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity.length).toBe(await page.locator("[data-section='faq-item']").count());
    expect(faq.mainEntity[0]!.acceptedAnswer.text).toContain("Nothing");
    // No promise the product does not keep.
    await expect(page.locator("main")).not.toContainText("WhatsApp");
    await expect(page.locator("main")).not.toContainText("Pro free for a year");
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      "href",
      /\/for-owners\.md$/,
    );
  });

  test("the Markdown guide lists every spreadsheet column, for assistants helping an owner", async ({
    request,
  }) => {
    for (const path of ["/for-owners.md", "/list-your-sites.md"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()["content-type"]).toContain("text/markdown");
      const md = await res.text();
      expect(md).toContain("**Short answer:**");
      expect(md).toContain("/api/owner/template/");
      expect(md).toContain("| Format | Yes |");
      expect(md).toContain("### What does it cost to list sites on OOHWORKS?");
    }
  });

  test("llms.txt points owners and their assistants at the guide and the template", async ({
    request,
  }) => {
    const text = await (await request.get("/llms.txt")).text();
    expect(text).toContain("/for-owners.md");
    expect(text).toContain("/api/owner/template/");
    expect(text).toContain("/api/v1/sites/");
  });
});
