import { expect, test } from "@playwright/test";
import { adminHeaders, mails } from "./helpers/admin";

/** Reporting a listing, against the labelled sample sites loaded into the test database by `pnpm test:db`. */
const SITE = "/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/";
const TEAM = "owners@oohworks.co";

interface Report {
  id: number;
  unitId: string;
  reason: string;
  message?: string;
  email?: string;
  status: string;
  respondBy: string;
  createdAt: string;
}

test.describe("report a listing", () => {
  test("a report reaches the team's queue with two days to answer, and the visitor is thanked", async ({
    page,
    request,
  }, info) => {
    const said = `The face is now a mobile shop sign (${info.project.name} ${Date.now()})`;
    await page.goto(SITE);
    await page.locator("#report summary").click();
    await page.getByLabel("What is wrong?").selectOption("gone");
    await page.getByLabel("What did you see?").fill(said);
    await page.getByRole("button", { name: "Send the report" }).click();

    await expect(page).toHaveURL(/\?reported=1#report$/);
    await expect(page.locator("#report[role='status']")).toContainText(
      "The team checks every report within two days",
    );

    const res = await request.get(
      `/api/listing-reports?where[message][equals]=${encodeURIComponent(said)}&limit=1`,
      { headers: await adminHeaders(request) },
    );
    const report = ((await res.json()) as { docs: Report[] }).docs[0];
    expect(report).toMatchObject({ unitId: "ows0001", reason: "gone", status: "new" });
    const hours = (Date.parse(report!.respondBy) - Date.parse(report!.createdAt)) / 3600_000;
    expect(Math.round(hours)).toBe(48);

    const notice = (await mails(request, TEAM, "team_notice")).find((m) => m.text.includes(said));
    expect(notice?.subject).toBe(
      "A report about ows0001: It does not exist, or has been taken down",
    );
    expect(notice?.text).toContain(`/admin/collections/listing-reports/${report!.id}`);
  });

  test("a mistake comes back with the form open and a plain message", async ({ page }) => {
    await page.goto(SITE);
    await page.locator("#report summary").click();
    await page.getByLabel("What is wrong?").selectOption("details");
    await page.getByLabel(/Your email/).fill("not-an-address@");
    // The browser's own check would stop this address; the server must refuse it too.
    await page.locator("#report form").evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await page.getByRole("button", { name: "Send the report" }).click();
    await expect(page).toHaveURL(/\?report=email#report$/);
    await expect(page.locator("#report")).toHaveAttribute("open", "");
    await expect(page.locator("#report [role='alert']")).toContainText("does not look right");
  });

  test("refuses a report about no site, and a post from another site", async ({ request }) => {
    const unknown = await request.post("/api/report/", {
      form: { id: "nosuchsite", reason: "details", return: SITE },
      maxRedirects: 0,
    });
    expect(unknown.status()).toBe(303);
    expect(unknown.headers()["location"]).toBe(`${SITE}?report=site#report`);

    const foreign = await request.post("/api/report/", {
      form: { id: "ows0001", reason: "details", return: SITE },
      headers: { Origin: "https://elsewhere.example" },
      maxRedirects: 0,
    });
    expect(foreign.status()).toBe(403);
  });
});
