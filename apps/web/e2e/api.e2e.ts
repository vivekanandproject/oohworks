import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type APIRequestContext } from "@playwright/test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { adminHeaders } from "./helpers/admin";

/**
 * The public API against its own description: every answer from the test database is checked against
 * the schemas in /api/v1/openapi.json, so the documentation cannot drift from the code. The sample
 * sites in e2e/fixtures are loaded into the test database by `pnpm test:db`.
 */

type Spec = { paths: Record<string, unknown>; components: Record<string, unknown> };

async function checker(request: APIRequestContext) {
  const spec = (await (await request.get("/api/v1/openapi.json")).json()) as Spec;
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema({ $id: "spec.json", components: spec.components });
  return (schema: string, data: unknown) => {
    const validate = ajv.getSchema(`spec.json#/components/schemas/${schema}`);
    if (!validate) throw new Error(`no schema ${schema}`);
    expect(validate(data), `${schema}: ${ajv.errorsText(validate.errors)}`).toBe(true);
  };
}

test.describe("public API", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough for an API check",
  );

  test("describes itself as OpenAPI 3.1, one operation per path", async ({ request }) => {
    const res = await request.get("/api/v1/openapi.json");
    expect(res.status()).toBe(200);
    const spec = (await res.json()) as Spec & { openapi: string };
    expect(spec.openapi).toBe("3.1.0");
    for (const [p, ops] of Object.entries(spec.paths)) {
      expect(p, "paths end with a slash, as the site serves them").toMatch(/^\/api\/.*\/$/);
      for (const op of Object.values(ops as Record<string, { operationId?: string }>))
        expect(op.operationId, p).toBeTruthy();
    }
  });

  test("lists sites a page at a time, as the schema says, with no owner contact details", async ({
    request,
  }) => {
    const check = await checker(request);
    const res = await request.get("/api/v1/sites/");
    expect(res.status()).toBe(200);
    expect(res.headers()["access-control-allow-origin"]).toBe("*");
    expect(res.headers()["x-robots-tag"]).toBe("noindex");
    const text = await res.text();
    const body = JSON.parse(text) as { total: number; perPage: number; sites: unknown[] };
    check("SiteList", body);
    expect(body.total).toBe(37);
    expect(body.perPage).toBe(12);
    expect(body.sites).toHaveLength(12);
    expect(text, "no email address anywhere in the answer").not.toMatch(/[\w.+-]+@[\w-]+\.\w/);
  });

  test("filters exactly as the search page does, and says what it applied", async ({ request }) => {
    const check = await checker(request);
    const body = (await (
      await request.get("/api/v1/sites/?city=bengaluru&format=hoarding&per_page=50")
    ).json()) as {
      filters: { city: string; formats: string[] };
      sites: { location: { city: { slug: string } }; format: { slug: string } }[];
    };
    check("SiteList", body);
    expect(body.filters.city).toBe("bengaluru");
    expect(body.filters.formats).toEqual(["hoarding"]);
    expect(body.sites.length).toBeGreaterThan(0);
    for (const s of body.sites) {
      expect(s.location.city.slug).toBe("bengaluru");
      expect(s.format.slug).toBe("hoarding");
    }

    const typed = (await (
      await request.get(`/api/v1/sites/?q=${encodeURIComponent("20x10 hoardings in Bengaluru")}`)
    ).json()) as { filters: { city: string; size: string; formats: string[] } };
    expect(typed.filters).toMatchObject({
      city: "bengaluru",
      size: "20x10",
      formats: ["hoarding"],
    });
  });

  test("keeps a private price private", async ({ request }) => {
    const body = (await (await request.get("/api/v1/sites/?per_page=50")).json()) as {
      sites: { price: { display: string; monthlyInr: number | null; label: string } }[];
    };
    const hidden = body.sites.filter((s) => s.price.display === "on_request");
    expect(hidden.length).toBeGreaterThan(0);
    for (const s of hidden) {
      expect(s.price.monthlyInr).toBeNull();
      expect(s.price.label).toBe("Price on request");
    }
  });

  test("refuses a page size it cannot give, in words", async ({ request }) => {
    const check = await checker(request);
    const res = await request.get("/api/v1/sites/?per_page=500");
    expect(res.status()).toBe(400);
    expect(res.headers()["content-type"]).toContain("application/problem+json");
    check("Problem", await res.json());
  });

  test("gives one site in full, and 404 for an unknown one", async ({ request }) => {
    const check = await checker(request);
    const res = await request.get("/api/v1/sites/ows0001/");
    expect(res.status()).toBe(200);
    const site = (await res.json()) as { unitId: string; sample: boolean; url: string };
    check("SiteDetail", site);
    expect(site.unitId).toBe("ows0001");
    expect(site.sample).toBe(true);
    expect(new URL(site.url).pathname).toMatch(/-ows0001\/$/);

    const missing = await request.get("/api/v1/sites/nosuchsite/");
    expect(missing.status()).toBe(404);
    check("Problem", await missing.json());
  });

  test("lists cities and formats with counts that add up to every site", async ({ request }) => {
    const check = await checker(request);
    const cities = (await (await request.get("/api/v1/cities/")).json()) as {
      cities: { sites: number }[];
    };
    const formats = (await (await request.get("/api/v1/formats/")).json()) as {
      formats: { sites: number }[];
    };
    for (const c of cities.cities) check("City", c);
    for (const f of formats.formats) check("Format", f);
    const sum = (xs: { sites: number }[]) => xs.reduce((n, x) => n + x.sites, 0);
    expect(sum(cities.cities)).toBe(37);
    expect(sum(formats.formats)).toBe(37);
    check("Health", await (await request.get("/api/health/")).json());
  });
});

test.describe("API documentation", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough",
  );

  test("Swagger UI shows the public API from the site's own files, and Try it out works", async ({
    page,
  }) => {
    const foreign: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith("http://127.0.0.1:3100/")) foreign.push(r.url());
    });
    const res = await page.goto("/api/docs/");
    expect(res?.headers()["x-robots-tag"]).toBe("noindex");
    await expect(page.locator(".swagger-ui .info .title")).toContainText("ohworks public API");
    await expect(page.locator(".opblock-summary-path").first()).toBeVisible();
    expect(await page.locator(".opblock-summary-path").count()).toBe(6);

    // The page opens every operation ready to try (tryItOutEnabled), so there is no button to press.
    await page.locator("#operations-Sites-getSite").click();
    await page.getByPlaceholder("unitId").fill("ows0001");
    await page.getByRole("button", { name: "Execute" }).click();
    await expect(page.locator(".live-responses-table tr.response .response-col_status")).toHaveText(
      "200",
    );
    expect(foreign, "nothing loads from another site").toEqual([]);
  });

  test("outside production it also offers the internal reference, which names every endpoint", async ({
    page,
    request,
  }) => {
    await page.goto("/api/docs/");
    await expect(page.locator("select#select option")).toHaveText([
      "Public API v1",
      "Internal reference (not in production)",
    ]);

    const res = await request.get("/api/internal/openapi.json");
    expect(res.status()).toBe(200);
    const spec = (await res.json()) as Spec;
    const documented = new Set(Object.keys(spec.paths));

    // Every route folder under src/app/api has an entry, so a new endpoint cannot go undocumented.
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/app/api");
    const routes: string[] = [];
    const walk = (dir: string, at: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(dir, e.name), `${at}/${e.name}`);
        else if (e.name === "route.ts") routes.push(`${at}/`);
      }
    };
    walk(root, "/api");
    // A folder named like a file (openapi.json) is served without the closing slash.
    const asDocumented = (r: string) => r.replace(/\[(\w+)\]/g, "{$1}").replace(/(\.\w+)\/$/, "$1");
    const missing = routes.map(asDocumented).filter((r) => !documented.has(r));
    expect(missing, "routes with no entry in the internal reference").toEqual([]);
  });
});

test.describe("services check", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough",
  );

  test("is for signed-in staff only, and reports every service without sending anything", async ({
    request,
  }) => {
    expect((await request.get("/api/health/services/")).status()).toBe(401);
    const res = await request.get("/api/health/services/", {
      headers: await adminHeaders(request),
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      environment: string;
      services: { name: string; state: string }[];
    };
    expect(body.environment).toBe("test");
    const by = Object.fromEntries(body.services.map((s) => [s.name, s.state]));
    expect(by["Database"]).toBe("ok");
    // Test runs blank the email key, so nothing is sent and the Outbox keeps every email.
    expect(by["Email (Resend)"]).toBe("off");
    expect(by["Redis"]).toBe("not used yet");
  });
});
