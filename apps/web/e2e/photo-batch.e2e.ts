import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect as baseExpect, test, type APIRequestContext } from "@playwright/test";
import { adminHeaders } from "./helpers/admin";
import { addCompany, removeOwner, signInByCode, visitor } from "./helpers/owner";

/**
 * Many photographs at once: each taken at one of the owner's sites goes there by the position in the
 * file, the night one becomes the night view, and those that cannot be placed wait for the owner.
 */
const expect = baseExpect.configure({ timeout: 30_000 });

const make = (command: string, input?: unknown): Buffer =>
  Buffer.from(
    (
      JSON.parse(
        execFileSync(
          "node",
          [fileURLToPath(new URL("./helpers/files.mjs", import.meta.url)), command],
          { input: input === undefined ? "" : JSON.stringify(input), maxBuffer: 64 * 1024 * 1024 },
        ).toString(),
      ) as { base64: string }
    ).base64,
    "base64",
  );
const jpeg = (name: string, buffer: Buffer) => ({ name, mimeType: "image/jpeg", buffer });

// Two of the owner's sites in Hebbal, about a kilometre apart.
const A = { lat: 13.041, lng: 77.59 };
const B = { lat: 13.05, lng: 77.59 };

async function draftAt(request: APIRequestContext, ownerId: number, road: string, at: typeof A) {
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
      ...at,
      priceDisplay: "on_request",
      source: "form",
      review: "draft",
      _status: "draft",
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  return ((await created.json()) as { doc: { id: number; permanentId: string } }).doc;
}

test.describe("many photographs at once", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough for an upload",
  );

  test("are placed on the sites they were taken at, and the rest are placed by hand", async ({
    page,
    request,
    context,
    browser,
  }, info) => {
    test.setTimeout(150_000);
    await context.setExtraHTTPHeaders({ "x-forwarded-for": visitor() });
    const email = `e2e-batch-${info.project.name}-${Date.now()}@example.com`;
    const headers = await adminHeaders(request);
    try {
      await signInByCode(page, request, email);
      await addCompany(page, "Batch Photos Outdoor (test)");
      const owner = (
        (await (
          await request.get(
            `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number }[] }
      ).docs[0]!;
      const a = await draftAt(request, owner.id, "Bellary Road", A);
      const b = await draftAt(request, owner.id, "Hebbal Flyover", B);

      await page.goto("/owner/");
      await page
        .locator("[data-section='add']")
        .getByRole("link", { name: "Add photographs" })
        .click();
      await expect(page).toHaveURL(/\/owner\/photos\/$/);
      await page
        .locator("#photos-files")
        .setInputFiles([
          jpeg(
            "day-at-a.jpg",
            make("gps", { ...A, lat: A.lat + 0.0002, at: "2026:10:12 11:20:00" }),
          ),
          jpeg("night-at-a.jpg", make("gps", { ...A, at: "2026:10:12 21:05:00" })),
          jpeg("no-position.jpg", make("photo")),
          jpeg(
            "across-town.jpg",
            make("gps", { lat: 12.9756, lng: 77.6066, at: "2026:10:12 10:00:00" }),
          ),
        ]);
      await page.locator("[data-action='send-photos']").click();
      const rows = page.locator("[data-section='photos-progress'] li");
      await expect(rows).toHaveCount(4);
      await expect(page.locator("[data-photo-state='added']")).toHaveCount(2);
      await expect(page.locator("[data-photo-state='left']")).toHaveCount(2);
      await expect(rows.nth(0)).toContainText("Added to 30 × 15 ft hoarding, Bellary Road");
      await expect(rows.nth(2)).toContainText("does not record where it was taken");
      await expect(rows.nth(3)).toContainText("not taken near any of your sites");

      // The one with no position, placed by hand on the other site.
      const byHand = rows.nth(2).locator("[data-section='place-by-hand']");
      await byHand.locator("select[name='id']").selectOption(b.permanentId);
      await byHand.locator("[data-action='place-photo']").click();
      await expect(rows.nth(2)).toHaveAttribute("data-photo-state", "added");
      await expect(rows.nth(2)).toContainText("Hebbal Flyover");

      const views = async (id: number) =>
        (
          (await (
            await request.get(`/api/sites/${id}?draft=true&depth=0`, { headers })
          ).json()) as { photos: { kind: string; gps: boolean }[] }
        ).photos;
      expect((await views(a.id)).map((p) => p.kind).sort()).toEqual(["approach", "night"]);
      expect((await views(a.id)).every((p) => p.gps)).toBe(true);
      expect((await views(b.id)).map((p) => p.kind)).toEqual(["approach"]);

      // Without script it is a plain form, and the page lists what happened.
      const plain = await browser.newContext({
        javaScriptEnabled: false,
        storageState: await context.storageState(),
        extraHTTPHeaders: { "x-forwarded-for": visitor() },
      });
      const noScript = await plain.newPage();
      await noScript.goto("/owner/photos/");
      await noScript
        .locator("#photos-files")
        .setInputFiles([jpeg("day-at-b.jpg", make("gps", { ...B, at: "2026:10:13 09:00:00" }))]);
      await noScript.locator("[data-action='send-photos']").click();
      await expect(noScript).toHaveURL(/\/owner\/photos\/\?r=/);
      await expect(noScript.locator("[data-section='photos-done']")).toContainText(
        "day-at-b.jpg · Added to 30 × 15 ft hoarding, Hebbal Flyover",
      );
      await plain.close();
    } finally {
      await removeOwner(request, email);
    }
  });
});
