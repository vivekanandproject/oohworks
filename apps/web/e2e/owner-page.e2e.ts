import { expect, test } from "@playwright/test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/** An owner's public page and its API, against the sample owners loaded into the test database by `pnpm test:db`. */
const OWNER = "/owners/sample-kaveri/";

test.describe("an owner's public page", () => {
  test("shows who they are and their sites, twelve a page, with no contact details", async ({
    page,
  }) => {
    const res = await page.goto(OWNER);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Kaveri Outdoor (sample)");
    await expect(page.locator("[data-section='owner-badges']")).toContainText("Sample owner");
    await expect(page.locator("[data-section='owner-fact']")).toContainText("16 sites on ohworks");
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(12);
    await expect(page.locator("[data-section='heading']")).toHaveText("Sites 1 to 12 of 16");

    // A sample owner is never for search engines, and nothing on the page is a way to reach them directly.
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    expect(await page.locator("main").innerText()).not.toMatch(/[\w.+-]+@[\w-]+\.\w|\+91/);

    await page.locator("[data-section='pager']").getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/\/owners\/sample-kaveri\/\?page=2$/);
    await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(4);
  });

  test("answers not found for an unknown owner and a page past the end", async ({ request }) => {
    expect((await request.get("/owners/nobody-at-all/")).status()).toBe(404);
    expect((await request.get(`${OWNER}?page=3`)).status()).toBe(404);
  });

  test("the API gives the same owner, as its schema says", async ({ request }, info) => {
    test.skip(info.project.name !== "desktop", "one engine is enough for an API check");
    const spec = (await (await request.get("/api/v1/openapi.json")).json()) as {
      components: Record<string, unknown>;
    };
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    ajv.addSchema({ $id: "spec.json", components: spec.components });
    const validate = ajv.getSchema("spec.json#/components/schemas/Owner")!;

    const res = await request.get("/api/v1/owners/sample-kaveri/");
    expect(res.status()).toBe(200);
    const text = await res.text();
    const owner = JSON.parse(text) as { sites: number; sample: boolean; sitesUrl: string };
    expect(validate(owner), ajv.errorsText(validate.errors)).toBe(true);
    expect(owner).toMatchObject({ sites: 16, sample: true });
    expect(new URL(owner.sitesUrl).pathname + new URL(owner.sitesUrl).search).toBe(
      "/api/v1/sites/?owner=sample-kaveri",
    );
    expect(text, "no email address anywhere in the answer").not.toMatch(/[\w.+-]+@[\w-]+\.\w/);
    expect((await request.get("/api/v1/owners/nobody-at-all/")).status()).toBe(404);
  });
});
