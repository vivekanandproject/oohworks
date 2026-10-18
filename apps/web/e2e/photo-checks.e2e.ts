import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect as baseExpect, test, type APIRequestContext } from "@playwright/test";
import { adminHeaders } from "./helpers/admin";
import { addCompany, removeOwner, signInByCode, visitor } from "./helpers/owner";

/**
 * The checks on an owner's photograph: one whose file credits a stock library is refused, and one that
 * is already on another listing is added but flagged, for the owner and for the team.
 */
const expect = baseExpect.configure({ timeout: 20_000 });

/** Test photographs, made in their own process (e2e/helpers/files.mjs). */
const made = (command: string): Record<string, string> =>
  JSON.parse(
    execFileSync(
      "node",
      [fileURLToPath(new URL("./helpers/files.mjs", import.meta.url)), command],
      {
        maxBuffer: 64 * 1024 * 1024,
      },
    ).toString(),
  ) as Record<string, string>;

async function draftFor(request: APIRequestContext, ownerId: number, road: string, lat: number) {
  const created = await request.post("/api/sites?draft=true", {
    headers: await adminHeaders(request),
    data: {
      owner: ownerId,
      format: "hoarding",
      environment: "roadside",
      width: 30,
      height: 15,
      sizeUnit: "ft",
      lighting: "front-lit",
      country: "in",
      city: "bengaluru",
      locality: "Hebbal",
      road,
      lat,
      lng: 77.59,
      priceDisplay: "on_request",
      source: "form",
      review: "draft",
      _status: "draft",
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  return ((await created.json()) as { doc: { id: number; permanentId: string } }).doc;
}

test.describe("checks on an owner's photograph", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough for an upload",
  );

  test("a stock photograph is refused, and one already on another listing is flagged", async ({
    page,
    request,
    context,
  }, info) => {
    test.setTimeout(120_000);
    await context.setExtraHTTPHeaders({ "x-forwarded-for": visitor() });
    const email = `e2e-photo-${info.project.name}-${Date.now()}@example.com`;
    const headers = await adminHeaders(request);
    try {
      await signInByCode(page, request, email);
      await addCompany(page, "Photo Checks Outdoor (test)");
      const owner = (
        (await (
          await request.get(
            `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number }[] }
      ).docs[0]!;
      const first = await draftFor(request, owner.id, "Bellary Road", 13.041);
      const second = await draftFor(request, owner.id, "Hennur Road", 13.043);
      const { base64: original, copy } = made("textured");
      const add = async (unit: string, name: string, data: string) => {
        await page.goto(`/owner/sites/${unit}/`);
        await page.locator("#photo-file").setInputFiles({
          name,
          mimeType: "image/jpeg",
          buffer: Buffer.from(data!, "base64"),
        });
        await page.locator("[data-action='add-photo']").click();
      };

      await add(first.permanentId, "stock.jpg", made("stock").base64!);
      await expect(page.locator("[data-section='photo-error']")).toContainText(
        "comes from Shutterstock",
      );
      await expect(page.locator("[data-section='no-photos']")).toBeVisible();

      await add(first.permanentId, "approach.jpg", original!);
      await expect(page.locator("[data-section='photo-added']")).toBeVisible();
      await expect(page.locator("[data-section='photo-twin']")).toHaveCount(0);

      // The same photograph, as a messaging app sends it on, on the owner's other site.
      await add(second.permanentId, "approach-copy.jpg", copy!);
      await expect(page.locator("[data-section='photo-added']")).toBeVisible();
      await expect(page.locator("[data-section='photo-twin']")).toContainText(
        "already on another listing",
      );
      const note = (
        (await (
          await request.get(`/api/sites/${second.id}?draft=true&depth=0`, { headers })
        ).json()) as { photoNote?: string }
      ).photoNote;
      expect(note).toContain(`the same photograph is on ${first.permanentId}`);
    } finally {
      await removeOwner(request, email);
    }
  });
});
