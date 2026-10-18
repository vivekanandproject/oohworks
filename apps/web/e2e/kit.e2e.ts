import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect as baseExpect, test } from "@playwright/test";
import { TEST_CRON_SECRET } from "../scripts/test-env.mjs";
import { adminHeaders } from "./helpers/admin";
import { addCompany, removeOwner, signInByCode, visitor } from "./helpers/owner";

/**
 * A media kit read by Claude, as the owner sees it. A test run has no Anthropic key, so the reading
 * itself is covered by src/lib/owners/kit-reading.test.ts; here the job stays off, and a finished
 * reading is written to the file as the job would write it.
 */
const expect = baseExpect.configure({ timeout: 20_000 });

/** The smallest proper PDF, one blank page: the upload checks for the cross-reference table at its end. */
const PDF = (() => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = objects.map((o, i) => {
    const at = body.length;
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
    return at;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
})();

type Cell = { value: unknown; note: string | null };
/** The rows of a downloaded spreadsheet, read in its own process: this runner cannot load exceljs. */
const rowsOf = (book: Buffer): Record<string, Cell>[] =>
  (
    JSON.parse(
      execFileSync(
        "node",
        [fileURLToPath(new URL("./helpers/files.mjs", import.meta.url)), "read"],
        { input: JSON.stringify({ book: book.toString("base64") }) },
      ).toString(),
    ) as { rows: Record<string, Cell>[] }
  ).rows;

test.describe("a media kit read by Claude", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough for an upload",
  );

  test("waits while being read, then shows the drafts and hands back what is left as a spreadsheet", async ({
    page,
    request,
    context,
  }, info) => {
    test.setTimeout(120_000);
    await context.setExtraHTTPHeaders({ "x-forwarded-for": visitor() });
    const email = `e2e-kit-${info.project.name}-${Date.now()}@example.com`;
    const headers = await adminHeaders(request);
    try {
      await signInByCode(page, request, email);
      await addCompany(page, "Kit Reading Outdoor (test)");
      await page.goto("/owner/kit/");
      await page.locator("#kit-file").setInputFiles({
        name: "Hebbal kit.pdf",
        mimeType: "application/pdf",
        buffer: PDF,
      });
      await page.locator("[data-action='send-kit']").click();
      await expect(page.locator("[data-section='kit-sent']")).toContainText("We have your file.");

      // Without a key, the job reads nothing and the kit stays with the team.
      const job = await request.post("/api/jobs/media-kits/", {
        headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` },
      });
      expect(job.status()).toBe(200);
      expect(await job.json()).toMatchObject({ job: "media-kits", ok: true, off: true, read: 0 });
      const kits = page.locator("[data-section='kits']");
      await expect(kits).toContainText("Hebbal-kit.pdf · With our team");

      const owner = (
        (await (
          await request.get(
            `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number }[] }
      ).docs[0]!;
      const file = (
        (await (
          await request.get(
            `/api/owner-files?where[owner][equals]=${owner.id}&where[kind][equals]=media_kit&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number; reading: string | null }[] }
      ).docs[0]!;
      expect(file.reading).toBeNull();

      await request.patch(`/api/owner-files/${file.id}`, {
        headers,
        data: { reading: "waiting" },
      });
      await page.reload();
      await expect(kits).toContainText("Being read");

      // As the job leaves it: one draft made, one site that needs a position.
      const patched = await request.patch(`/api/owner-files/${file.id}`, {
        headers,
        data: {
          reading: "read",
          readingNote: "Claude found 2 sites.",
          report: {
            model: "claude-opus-5-5",
            tokens: { input: 1, output: 1 },
            found: 2,
            drafts: [{ page: 2, id: "OWS-TEST", title: "40 × 20 ft hoarding, Bellary Road" }],
            needs: [
              {
                page: 3,
                raw: {
                  ownerRef: "HB-2",
                  format: "Hoarding",
                  width: "30",
                  height: "15",
                  lighting: "Front-lit",
                  city: "Bengaluru",
                  locality: "Hebbal",
                  road: "Outer Ring Road",
                  rate: "60000",
                },
                problems: {
                  lat: "Put the pin on the map, or give the latitude.",
                  lng: "Put the pin on the map, or give the longitude.",
                },
              },
            ],
            notes: "",
          },
        },
      });
      expect(patched.ok(), await patched.text()).toBeTruthy();
      await page.reload();
      await expect(kits).toContainText("1 draft in your list, 1 needs details from you");
      const link = page.locator(`[data-kit='${file.id}'] [data-action='kit-sheet']`);
      await expect(link).toHaveText("Download the site to finish");

      // The spreadsheet is the owner's alone, and marks the gap.
      const sheetPath = `/api/owner/kit/sheet/?file=${file.id}`;
      const download = await page.request.get(sheetPath);
      expect(download.status()).toBe(200);
      expect(download.headers()["content-disposition"]).toContain(
        "ohworks-sites-from-Hebbal-kit.xlsx",
      );
      const [row] = rowsOf(await download.body());
      expect(row?.["Road"]?.value).toBe("Outer Ring Road");
      expect(row?.["Map link"]?.note).toMatch(/Google Maps/);
      expect((await request.get(sheetPath)).status()).toBe(404);

      // A draft read from the kit says so, and what to check first.
      const created = await request.post("/api/sites?draft=true", {
        headers,
        data: {
          owner: owner.id,
          format: "hoarding",
          environment: "roadside",
          width: 40,
          height: 20,
          sizeUnit: "ft",
          lighting: "front-lit",
          country: "in",
          city: "bengaluru",
          locality: "Hebbal",
          road: "Bellary Road",
          lat: 13.04,
          lng: 77.59,
          priceDisplay: "exact",
          rate: 120000,
          source: "kit",
          kitNote: "Page 2 of the media kit. Check first: Rate a month (INR).",
          review: "draft",
          _status: "draft",
        },
      });
      expect(created.ok(), await created.text()).toBeTruthy();
      const draft = ((await created.json()) as { doc: { permanentId: string } }).doc;
      await page.goto(`/owner/sites/${draft.permanentId}/`);
      await expect(page.locator("[data-section='kit-note']")).toContainText(
        "Page 2 of the media kit. Check first: Rate a month (INR).",
      );
    } finally {
      await removeOwner(request, email);
    }
  });
});
