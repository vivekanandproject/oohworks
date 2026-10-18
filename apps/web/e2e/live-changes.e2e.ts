import { expect as baseExpect, test } from "@playwright/test";
import { adminHeaders, mails } from "./helpers/admin";
import { addCompany, removeOwner, signInByCode, visitor } from "./helpers/owner";

/**
 * Changing a live site: the owner's changes go to the team, buyers keep seeing the live version, price
 * and availability still change at once, and the team approves or returns them.
 */
const expect = baseExpect.configure({ timeout: 20_000 });
const TEAM = "owners@oohworks.co";

test.describe("changes to a live site", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "the owner's desk is tested on desktop");

  test("wait for the team while buyers see the live version, then go live when approved, or come back with a reason", async ({
    page,
    request,
    context,
  }, info) => {
    test.setTimeout(150_000);
    await context.setExtraHTTPHeaders({ "x-forwarded-for": visitor() });
    const email = `e2e-live-${info.project.name}-${Date.now()}@example.com`;
    const headers = await adminHeaders(request);
    try {
      await signInByCode(page, request, email);
      await addCompany(page, "Live Changes Outdoor (test)");

      // A site the team has already published for this owner.
      const owner = (
        (await (
          await request.get(
            `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number }[] }
      ).docs[0]!;
      const created = await request.post("/api/sites?draft=false", {
        headers,
        data: {
          owner: owner.id,
          format: "hoarding",
          environment: "roadside",
          width: 20,
          height: 10,
          sizeUnit: "ft",
          lighting: "front-lit",
          country: "in",
          city: "hyderabad",
          locality: "Banjara Hills",
          road: "Road No. 12",
          lat: 17.41,
          lng: 78.44,
          facingDeg: 90,
          priceDisplay: "exact",
          rate: 70000,
          review: "approved",
          _status: "published",
        },
      });
      expect(created.ok(), await created.text()).toBeTruthy();
      const site = ((await created.json()) as { doc: { id: number; permanentId: string } }).doc;
      const unit = site.permanentId;

      // The owner changes the road. It goes to the team, and buyers still see the old one.
      await page.goto(`/owner/sites/${unit}/`);
      await page.locator("[data-action='edit']").click();
      await expect(page.locator("[data-section='live-edit']")).toContainText(
        "go to the team first",
      );
      await page.locator("form[action='/api/owner/site/'] [name='road']").fill("Road No. 14");
      await page.locator("[data-action='save-site']").click();
      await expect(page).toHaveURL(new RegExp(`/owner/sites/${unit}/\\?changes=sent#changes$`));
      await expect(page.locator("[data-section='pending-change']")).toContainText(
        "Road: Road No. 12 → Road No. 14",
      );
      const live = async () =>
        (await (await request.get(`/api/sites/${site.id}?depth=0`)).json()) as {
          road: string;
          rate: number;
        };
      expect((await live()).road).toBe("Road No. 12");
      expect(
        (await mails(request, TEAM, "team_notice")).some(
          (m) => m.subject.startsWith("Changes to a live site") && m.text.includes("Road No. 14"),
        ),
      ).toBe(true);

      // A price change still takes effect at once, and does not publish the waiting changes.
      await page.locator("#quick-rate").fill("75000");
      await page.locator("[data-action='quick-save']").click();
      await expect(page).toHaveURL(/updated=1/);
      expect(await live()).toMatchObject({ road: "Road No. 12", rate: 75000 });

      // The team approves: the road changes, the new price stays, the owner is told.
      const change = (
        (await (
          await request.get(`/api/site-changes?where[unitId][equals]=${unit}&depth=0`, { headers })
        ).json()) as { docs: { id: number; status: string }[] }
      ).docs[0]!;
      expect(change.status).toBe("submitted");
      const approved = await request.patch(`/api/site-changes/${change.id}`, {
        headers,
        data: { status: "approved" },
      });
      expect(approved.ok(), await approved.text()).toBeTruthy();
      expect(await live()).toMatchObject({ road: "Road No. 14", rate: 75000 });
      expect((await mails(request, email, "owner_notice"))[0]?.subject).toMatch(
        /^Your changes are live: /,
      );

      // A second change is returned with a reason, which the owner reads; then they withdraw it.
      await page.goto(`/owner/sites/${unit}/edit/`);
      await page
        .locator("form[action='/api/owner/site/'] [name='landmark']")
        .fill("Opposite the lake");
      await page.locator("[data-action='save-site']").click();
      await expect(page.locator("[data-section='pending-change']")).toContainText("Landmark");
      const second = (
        (await (
          await request.get(
            `/api/site-changes?where[unitId][equals]=${unit}&where[status][equals]=submitted&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number }[] }
      ).docs[0]!;
      const refused = await request.patch(`/api/site-changes/${second.id}`, {
        headers,
        data: { status: "changes" },
      });
      expect(refused.status(), "returning without a reason is refused").toBe(400);
      await request.patch(`/api/site-changes/${second.id}`, {
        headers,
        data: { status: "changes", reviewNote: "Which lake? Name it." },
      });
      await page.goto(`/owner/sites/${unit}/`);
      await expect(page.locator("[data-section='pending-change']")).toContainText(
        "Which lake? Name it.",
      );
      await page.getByRole("button", { name: "Withdraw them" }).click();
      await expect(page).toHaveURL(/changes=withdrawn#changes$/);
      await expect(page.locator("[data-section='changes']")).toContainText("edit the details");
      expect((await live()).road).toBe("Road No. 14");
    } finally {
      await removeOwner(request, email);
    }
  });
});
