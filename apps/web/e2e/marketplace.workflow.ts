import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect as baseExpect, test, type APIRequestContext, type Page } from "@playwright/test";
import { TEST_CRON_SECRET } from "../scripts/test-env.mjs";
import { adminHeaders, mails } from "./helpers/admin";
import { closeDb, row, rows } from "./helpers/db";
import { removeOwner, visitor } from "./helpers/owner";

/**
 * The marketplace loop end to end, as one owner and one buyer live it, checked at every stage in the
 * browser, in the email the site sends (the Outbox), in the public API and in the database itself:
 *
 *   0 the platform answers  1 an owner starts   2 adds a site and a photograph   3 sends it for review
 *   4 the team returns it, then publishes it    5 a buyer finds, saves and exports it
 *   6 the buyer enquires    7 the owner replies, the buyer reads it   8 the owner keeps it fresh
 *   9 the jobs on a timer   10 the buyer follows the city   11 a report, and the team takes it down
 *
 * Run alone with `pnpm test:workflow` (playwright.workflow.config.ts): it publishes a site in Hyderabad
 * for a few minutes. Everything it makes is removed at the end.
 */
const expect = baseExpect.configure({ timeout: 20_000 });

const stamp = Date.now();
const COMPANY = `Workflow Outdoor ${stamp}`;
const OWNER = `wf-owner-${stamp}@example.org`;
const BUYER = `wf-buyer-${stamp}@example.com`;
const ROAD = `Road No. ${String(stamp).slice(-4)}`;
const NEW_ROAD = `${ROAD} Extension`;
const PIN = { lat: 17.4152, lng: 78.4411 };
const TEAM = "owners@ohworks.com";
const PASSWORD = "e2e three plain words";

const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const codeIn = (text: string | undefined) => /\b\d{6}\b/.exec(text ?? "")?.[0] ?? "";
const linkIn = (text: string, start: "reply" | "enquiries") => {
  const found = new RegExp(`(\\/${start}\\/[A-Z]{3}-[0-9A-Z]{8}\\/\\?k=[0-9a-f]{32})`).exec(text);
  if (!found?.[1]) throw new Error(`no /${start}/ link in: ${text.slice(0, 300)}`);
  return found[1];
};
const job = (request: APIRequestContext, name: string) =>
  request.post(`/api/jobs/${name}/`, { headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` } });

/** A photograph with detail, taken at a place and time, made in its own process (helpers/files.mjs). */
const photoAt = (at: { lat: number; lng: number }, when: string): Buffer =>
  Buffer.from(
    (
      JSON.parse(
        execFileSync(
          "node",
          [fileURLToPath(new URL("./helpers/files.mjs", import.meta.url)), "gps"],
          { input: JSON.stringify({ ...at, at: when }), maxBuffer: 64 * 1024 * 1024 },
        ).toString(),
      ) as { base64: string }
    ).base64,
    "base64",
  );

/**
 * A site as it stands now, draft or published: its latest version. A draft's edits live only in the
 * versions table (Payload drafts), so the main row is not the whole truth until it is published.
 */
const current = (siteId: number) =>
  row<{
    version_id: number;
    status: string;
    review: string;
    source: string;
    rate: string | null;
    road: string;
    booked_until: string | null;
    verified_location: boolean | null;
    removed: boolean | null;
    owner_id: number;
  }>(
    `select v.id as version_id, v.version__status as status, v.version_review as review,
            v.version_source as source, v.version_rate as rate, v.version_road as road,
            v.version_booked_until as booked_until, v.version_verified_location as verified_location,
            v.version_removed as removed, v.version_owner_id as owner_id
       from payload._sites_v v where v.parent_id = $1 and v.latest order by v.id desc limit 1`,
    [siteId],
  );

/**
 * Removes what workflow runs made, this one's and any left by an earlier run that stopped half way, in
 * the order the database allows: a thread's messages, then its enquiry, then reports and follows, then
 * the owner with their sites.
 */
async function cleanUp(request: APIRequestContext) {
  const headers = await adminHeaders(request);
  const enquiries = await rows<{ id: number }>(
    `select e.id from payload.enquiries e
       where e.email like 'wf-buyer-%'
          or e.owner_id in (select id from payload.owners where login_email like 'wf-owner-%')`,
  );
  for (const e of enquiries) {
    const messages = await rows<{ id: number }>(
      "select id from payload.messages where enquiry_id = $1",
      [e.id],
    );
    for (const m of messages) await request.delete(`/api/messages/${m.id}`, { headers });
    await request.delete(`/api/enquiries/${e.id}`, { headers });
  }
  const reports = await rows<{ id: number }>(
    `select id from payload.listing_reports
       where site_id in (select s.id from payload.sites s join payload.owners o on o.id = s.owner_id
                          where o.login_email like 'wf-owner-%')`,
  );
  for (const r of reports) await request.delete(`/api/listing-reports/${r.id}`, { headers });
  const follows = await rows<{ id: number }>(
    "select id from payload.follows where email like 'wf-buyer-%'",
  );
  for (const f of follows) await request.delete(`/api/follows/${f.id}`, { headers });
  const owners = await rows<{ login_email: string }>(
    "select login_email from payload.owners where login_email like 'wf-owner-%'",
  );
  for (const o of owners) await removeOwner(request, o.login_email);
}

/** Types into a place box until a place is offered, then takes the first one. */
async function choosePlace(page: Page, box: string, typed: string) {
  const input = page.locator(box);
  const first = input.locator("xpath=..").locator("[role='option']").first();
  await expect(async () => {
    await input.fill("");
    await input.pressSequentially(typed, { delay: 20 });
    await expect(first).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 40_000 });
  await first.click();
}

test.describe("the marketplace loop", () => {
  test.afterAll(closeDb);

  test("from an owner's first visit to a site taken down, checked in the browser, email, API and database", async ({
    page,
    request,
    browser,
    context,
  }) => {
    test.setTimeout(6 * 60_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.setExtraHTTPHeaders({ "x-forwarded-for": visitor() });
    const headers = await adminHeaders(request);
    const snapshot = (name: string, data: unknown) =>
      test.info().attach(name, {
        body: JSON.stringify(data, null, 2),
        contentType: "application/json",
      });

    await cleanUp(request);
    let unit = "";
    let siteId = 0;
    let ownerId = 0;
    let ownerSlug = "";
    let publicPath = "";
    let reference = "";

    try {
      await test.step("0. The platform answers: health, API contract, docs, services and the database", async () => {
        expect((await request.get("/api/health/")).ok()).toBe(true);
        const spec = (await (await request.get("/api/v1/openapi.json")).json()) as {
          openapi: string;
        };
        expect(spec.openapi).toBe("3.1.0");
        expect((await request.get("/api/docs/")).status()).toBe(200);
        const services = (await (
          await request.get("/api/health/services/", { headers })
        ).json()) as { environment: string; services: { name: string; state: string }[] };
        expect(services.environment).toBe("test");
        const state = Object.fromEntries(services.services.map((s) => [s.name, s.state]));
        expect(state["Database"]).toBe("ok");
        const live = await row<{ n: number }>(
          "select count(*)::int as n from payload.sites where _status = 'published' and coalesce(removed, false) = false",
        );
        expect(live?.n).toBeGreaterThan(0);
        await snapshot("services", { services: state, liveSitesBefore: live?.n });
      });

      await test.step("1. An owner starts: one form, then the code sent to their email", async () => {
        await page.goto("/list-your-sites/");
        await page.locator("#lys-name").fill(COMPANY);
        await choosePlace(page, "#lys-place", "Hyder");
        await page.locator("#lys-contact").fill("Asha Rao");
        await page.locator("#lys-phone-country").selectOption("GB");
        await page.locator("#lys-phone").fill("07700 900123");
        await page.locator("#lys-password").fill(PASSWORD);
        await page.locator("#owner-email").fill(OWNER);
        await page.locator("[data-action='start']").click();
        await expect(page).toHaveURL(/\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}$/);
        // Nothing is stored as an owner until the email is confirmed.
        expect(
          await row("select id from payload.owners where login_email = $1", [OWNER]),
        ).toBeUndefined();
        const code = codeIn((await mails(request, OWNER, "owner_code"))[0]?.text);
        expect(code).toMatch(/^\d{6}$/);
        await page.locator("#owner-code").fill(code);
        await page.locator("[data-action='confirm']").click();
        await expect(page).toHaveURL(/\/owner\/\?saved=welcome$/);
        await expect(page.locator("h1")).toHaveText(COMPANY);
        const owner = await row<{
          id: number;
          slug: string;
          contact_email: string;
          password_hash: string | null;
        }>(
          "select id, slug, contact_email, password_hash from payload.owners where login_email = $1",
          [OWNER],
        );
        expect(owner?.slug).toBeTruthy();
        expect(owner?.password_hash).toBeTruthy();
        ownerId = owner!.id;
        ownerSlug = owner!.slug;
        await snapshot("owner row", { ...owner, password_hash: "(set)" });
      });

      await test.step("2. The owner adds a site with the form, then a photograph taken at it", async () => {
        await page
          .locator("[data-section='add']")
          .getByRole("link", { name: "Add a site" })
          .click();
        await expect(page.locator("#site-city")).toHaveValue("hyderabad");
        await page.locator("#site-format").selectOption("hoarding");
        await page.locator("#site-lighting").selectOption("front-lit");
        await page.locator("#site-width").fill("30");
        await page.locator("#site-height").fill("15");
        await page.locator("#site-locality").fill("Banjara Hills");
        await page.locator("#site-road").fill(ROAD);
        await page.locator("#site-landmark").fill("opposite the lake");
        await page.locator("#site-place").fill(`${PIN.lat}, ${PIN.lng}`);
        await page.locator("#site-facing").fill("90");
        await page.locator("#site-rate").fill("65,000");
        await page.locator("[data-action='save-site']").click();
        await expect(page).toHaveURL(/\/owner\/sites\/ow[0-9a-z]{5}\/\?saved=1$/);
        unit = /sites\/(ow[0-9a-z]{5})/.exec(page.url())![1]!;
        await expect(page.locator("h1")).toHaveText(`30 × 15 ft hoarding, ${ROAD}`);

        await page.locator("#photo-file").setInputFiles({
          name: "approach.jpg",
          mimeType: "image/jpeg",
          buffer: photoAt(PIN, "2026:10:15 10:30:00"),
        });
        await page.locator("[data-action='add-photo']").click();
        await expect(page.locator("[data-section='photo-added']")).toContainText("GPS-stamped");

        siteId = (await row<{ id: number }>(
          "select id from payload.sites where permanent_id = $1",
          [unit],
        ))!.id;
        const site = await current(siteId);
        expect(site).toMatchObject({ status: "draft", review: "draft", source: "form" });
        expect(Number(site?.rate)).toBe(65000);
        expect(site?.owner_id).toBe(ownerId);
        const photos = await rows<{ kind: string; gps: boolean }>(
          "select kind, gps from payload._sites_v_version_photos where _parent_id = $1",
          [site!.version_id],
        );
        expect(photos).toEqual([{ kind: "approach", gps: true }]);
        await snapshot("site row (draft)", { unit, ...site, photos });
      });

      await test.step("3. The owner sends it for review; the team is told", async () => {
        await page.goto("/owner/");
        await page.locator("[data-action='submit']").click();
        await expect(page.locator("[data-section='sent']")).toContainText(
          "1 site sent for review.",
        );
        expect((await current(siteId))?.review).toBe("submitted");
        expect(
          (await mails(request, TEAM, "team_notice")).some(
            (m) => m.subject === `1 site to review from ${COMPANY}`,
          ),
        ).toBe(true);
        expect((await mails(request, OWNER, "owner_notice"))[0]?.subject).toBe(
          "We have your 1 site for review",
        );
      });

      await test.step("4. The team returns it with a reason, the owner sends it again, and the team publishes it", async () => {
        const refused = await request.patch(`/api/sites/${siteId}?draft=true`, {
          headers,
          data: { review: "changes" },
        });
        expect(refused.status(), "returning without a reason is refused").toBe(400);
        const returned = await request.patch(`/api/sites/${siteId}?draft=true`, {
          headers,
          data: { review: "changes", reviewNote: "Add the landmark buyers know best." },
        });
        expect(returned.ok(), await returned.text()).toBeTruthy();
        expect((await current(siteId))?.review).toBe("changes");
        await page.goto(`/owner/sites/${unit}/`);
        await expect(page.locator("[data-section='review-note']")).toContainText(
          "Add the landmark buyers know best.",
        );
        await page.goto("/owner/");
        await page.locator("[data-action='submit']").click();
        await expect(page.locator("[data-section='sent']")).toContainText("1 site sent");

        const published = await request.patch(`/api/sites/${siteId}`, {
          headers,
          data: { _status: "published", verifiedLocation: true },
        });
        expect(published.ok(), await published.text()).toBeTruthy();
        const site = await current(siteId);
        expect(site).toMatchObject({ status: "published", verified_location: true });
        // Published, the main row now holds it too.
        expect(
          (
            await row<{ _status: string }>("select _status from payload.sites where id = $1", [
              siteId,
            ])
          )?._status,
        ).toBe("published");
        expect((await mails(request, OWNER, "owner_notice"))[0]?.subject).toBe(
          `Your site is live: 30 × 15 ft hoarding, ${ROAD}`,
        );

        const api = await request.get(`/api/v1/sites/${unit}/`);
        expect(api.status()).toBe(200);
        const detail = (await api.json()) as {
          unitId: string;
          url: string;
          price: { monthlyInr: number | null };
          location: { road: string; city: { slug: string } };
          owner: { slug: string };
        };
        expect(detail).toMatchObject({
          unitId: unit,
          price: { monthlyInr: 65000 },
          location: { road: ROAD, city: { slug: "hyderabad" } },
          owner: { slug: ownerSlug },
        });
        publicPath = new URL(detail.url).pathname;
        expect((await page.goto(publicPath))?.status()).toBe(200);
        const list = (await (
          await request.get("/api/v1/sites/?city=hyderabad&per_page=50")
        ).json()) as { sites: { unitId: string }[] };
        expect(list.sites.map((s) => s.unitId)).toContain(unit);
        const ownerApi = await request.get(`/api/v1/owners/${ownerSlug}/`);
        expect(ownerApi.status()).toBe(200);
        const ownerBody = (await ownerApi.json()) as { sites: number; sitesUrl: string };
        expect(ownerBody.sites).toBe(1);
        const theirs = (await (
          await request.get(
            new URL(ownerBody.sitesUrl).pathname + new URL(ownerBody.sitesUrl).search,
          )
        ).json()) as { sites: { unitId: string }[] };
        expect(theirs.sites.map((s) => s.unitId)).toEqual([unit]);
        await snapshot("site row (published)", { ...site, publicPath });
      });

      await test.step("5. A buyer finds it in search, opens it, saves it and exports the shortlist", async () => {
        const buyer = await browser.newContext({
          extraHTTPHeaders: { "x-forwarded-for": visitor() },
        });
        const b = await buyer.newPage();
        b.on("pageerror", (e) => errors.push(e.message));
        await b.goto("/search/?city=hyderabad");
        const card = b.locator(`[data-site='${unit}']`);
        await expect(card).toBeVisible();
        await expect(card).toContainText(COMPANY);
        await card.locator("form[data-list-form='saved'] button").click();
        await expect(card.locator("form[data-list-form='saved'] button")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await card.locator(`a[href='${publicPath}']`).first().click();
        await expect(b).toHaveURL(new RegExp(`${publicPath.replace(/\//g, "\\/")}$`));
        await expect(b.locator("h1")).toContainText(ROAD);
        await b.goto("/shortlist/");
        await expect(b.locator(`[data-site='${unit}']`).first()).toBeVisible();
        const csv = await b.request.get(`/api/export/shortlist/?sites=${unit}&format=csv`);
        expect(csv.headers()["content-type"]).toContain("text/csv");
        expect(await csv.text()).toContain(ROAD);
        await buyer.close();
      });

      await test.step("6. The buyer enquires, confirms their email with a code, and the owner gets it", async () => {
        const buyer = await browser.newContext({
          extraHTTPHeaders: { "x-forwarded-for": visitor() },
        });
        const b = await buyer.newPage();
        b.on("pageerror", (e) => errors.push(e.message));
        await b.goto(`/enquire/${unit}/`);
        await b.locator("#enq-from").fill(day(20));
        await b.locator("#enq-to").fill(day(50));
        await b.locator("#enq-brand").fill("Workflow Coffee");
        await b.locator("#enq-budget").fill("70000");
        await b.getByLabel("Ready").check();
        await b.locator("#enq-message").fill("For the festival weeks, if the dates are free.");
        await b.locator("#enq-email").fill(BUYER);
        await b.locator("[data-action='send']").click();
        await expect(b).toHaveURL(/\/enquire\/confirm\/\?ref=ENQ-[0-9A-Z]{8}$/);
        reference = new URL(b.url()).searchParams.get("ref") ?? "";
        const pending = await row<{ status: string; verified_at: string | null }>(
          "select status, verified_at from payload.enquiries where reference = $1",
          [reference],
        );
        expect(pending?.verified_at).toBeNull();
        await b.locator("#enq-code").fill(codeIn((await mails(request, BUYER, "code"))[0]?.text));
        await b.locator("[data-action='confirm']").click();
        await expect(b).toHaveURL(/\/enquire\/sent\/\?ref=ENQ-[0-9A-Z]{8}$/);
        await expect(b.locator("h1")).toHaveText(`Sent to ${COMPANY}.`);
        const enquiry = await row<{
          status: string;
          site_id: number;
          owner_id: number;
          email: string;
          verified_at: string | null;
          sent_at: string | null;
        }>(
          "select status, site_id, owner_id, email, verified_at, sent_at from payload.enquiries where reference = $1",
          [reference],
        );
        expect(enquiry).toMatchObject({ site_id: siteId, owner_id: ownerId, email: BUYER });
        expect(enquiry?.verified_at).not.toBeNull();
        expect(enquiry?.sent_at).not.toBeNull();
        const contact = await row<{ contact_email: string }>(
          "select contact_email from payload.owners where id = $1",
          [ownerId],
        );
        const toOwner = (await mails(request, contact!.contact_email, "owner_enquiry"))[0];
        expect(toOwner?.subject).toContain(`New enquiry: 30 × 15 ft hoarding, ${ROAD}`);
        expect(toOwner?.text).toContain("Brand and category: Workflow Coffee");
        expect(toOwner?.text).toContain(`reply straight to the buyer: ${BUYER}`);
        await snapshot("enquiry row", { reference, ...enquiry });
        await buyer.close();
      });

      await test.step("7. The owner answers from the email link, and the buyer reads it on their thread", async () => {
        const contact = await row<{ contact_email: string }>(
          "select contact_email from payload.owners where id = $1",
          [ownerId],
        );
        const toOwner = (await mails(request, contact!.contact_email, "owner_enquiry"))[0];
        const ownerSide = await browser.newContext();
        const o = await ownerSide.newPage();
        o.on("pageerror", (e) => errors.push(e.message));
        await o.goto(linkIn(toOwner!.text, "reply"));
        await expect(o.locator("h1")).toHaveText("Reply to this enquiry");
        const field = o.locator("[data-section='reply-form'] fieldset").first();
        await field.getByLabel("Available for these dates").check();
        await field.locator("input[type='text']").fill("64,000");
        await o.locator("#reply-body").fill("Free for those weeks. Printing is extra.");
        await o.locator("[data-action='send-reply']").click();
        await expect(o.locator("[data-section='reply-sent']")).toContainText(
          "Your reply was sent to the buyer.",
        );
        await ownerSide.close();
        const replied = await row<{ status: string; replied_at: string | null }>(
          "select status, replied_at from payload.enquiries where reference = $1",
          [reference],
        );
        expect(replied?.replied_at).not.toBeNull();

        const reply = (await mails(request, BUYER, "owner_reply"))[0];
        expect(reply?.subject).toContain(`${COMPANY} replied`);
        expect(reply?.text).toContain("Available for these dates · ₹ 64,000 a month");
        const buyer = await browser.newContext();
        const b = await buyer.newPage();
        // The thread's address is in the reply, or else in the confirmation the buyer got on sending.
        const thread = /\/enquiries\//.test(reply!.text)
          ? reply!.text
          : ((await mails(request, BUYER, "buyer_confirmation"))[0]?.text ?? "");
        await b.goto(linkIn(thread, "enquiries"));
        await expect(b.locator("h1")).toHaveText(`Your enquiry to ${COMPANY}`);
        await expect(b.locator("[data-section='thread-lead']")).toContainText(
          "The owner has replied.",
        );
        await expect(b.locator("[data-section='thread']")).toContainText("Printing is extra.");
        await buyer.close();
        await snapshot("enquiry after the reply", replied);
      });

      await test.step("8. The owner keeps it fresh: a new price and a booking at once; a new road through the team", async () => {
        await page.goto(`/owner/sites/${unit}/`);
        await page.locator("#quick-rate").fill("70000");
        await page.getByLabel("It is booked until").check();
        await page.locator("#quick-booked").fill(day(10));
        await page.locator("[data-action='quick-save']").click();
        await expect(page).toHaveURL(/updated=1/);
        const fresh = await current(siteId);
        expect(Number(fresh?.rate)).toBe(70000);
        expect(fresh?.booked_until).not.toBeNull();

        await page.locator("[data-action='edit']").click();
        await page.locator("form[action='/api/owner/site/'] [name='road']").fill(NEW_ROAD);
        await page.locator("[data-action='save-site']").click();
        await expect(page).toHaveURL(new RegExp(`/owner/sites/${unit}/\\?changes=sent#changes$`));
        // Buyers keep seeing the live road until the team approves.
        expect((await current(siteId))?.road).toBe(ROAD);
        const change = await row<{ id: number; status: string; summary: string }>(
          "select id, status, summary from payload.site_changes where site_id = $1 order by id desc",
          [siteId],
        );
        expect(change).toMatchObject({ status: "submitted" });
        expect(change?.summary).toContain(`Road: ${ROAD} → ${NEW_ROAD}`);
        const approved = await request.patch(`/api/site-changes/${change!.id}`, {
          headers,
          data: { status: "approved" },
        });
        expect(approved.ok(), await approved.text()).toBeTruthy();
        const after = await current(siteId);
        expect(after).toMatchObject({ road: NEW_ROAD });
        expect(Number(after?.rate)).toBe(70000);
        expect((await mails(request, OWNER, "owner_notice"))[0]?.subject).toMatch(
          /^Your changes are live: /,
        );
        const api = (await (await request.get(`/api/v1/sites/${unit}/`)).json()) as {
          location: { road: string };
          availability: { bookedUntil: string | null };
          url: string;
        };
        expect(api.location.road).toBe(NEW_ROAD);
        expect(api.availability.bookedUntil).toBe(day(10));
        publicPath = new URL(api.url).pathname;
        await snapshot("site after the owner's changes", { ...after, change });
      });

      await test.step("9. The jobs on a timer run with the secret, and refuse without it", async () => {
        expect((await request.post("/api/jobs/alerts/")).status()).toBe(401);
        for (const name of ["alerts", "availability", "reply-times", "media-kits"]) {
          const res = await job(request, name);
          expect(res.status(), name).toBe(200);
          const body = (await res.json()) as { ok: boolean; off?: boolean };
          expect(body.ok, name).toBe(true);
          if (name === "media-kits") expect(body.off, "no Anthropic key in tests").toBe(true);
        }
      });

      await test.step("10. The buyer follows Hyderabad, confirms by email, and is not told about what they have seen", async () => {
        const followed = await request.post("/api/follow/", {
          form: { email: BUYER, city: "hyderabad", return: "/search/?city=hyderabad" },
          maxRedirects: 0,
        });
        expect(followed.status()).toBe(303);
        const confirm = (await mails(request, BUYER, "confirm_email"))[0];
        const link = /https?:\/\/[^/\s]+(\/api\/email-link\/\?\S+)/.exec(confirm?.text ?? "")?.[1];
        expect(link).toBeTruthy();
        await page.goto(link!);
        await expect(page).toHaveURL(/\/email\/following\/$/);
        const follow = await row<{ confirmed: boolean; seen: string[] }>(
          "select confirmed, seen from payload.follows where email = $1",
          [BUYER],
        );
        expect(follow?.confirmed).toBe(true);
        expect(follow?.seen).toContain(unit);
        await job(request, "alerts");
        expect(await mails(request, BUYER, "alert")).toHaveLength(0);
      });

      await test.step("11. A buyer reports it; the team takes it down: 410 on the page and the API", async () => {
        await page.goto(publicPath);
        await page.locator("#report summary").click();
        await page.getByLabel("What is wrong?").selectOption("gone");
        await page.getByLabel("What did you see?").fill(`Workflow ${stamp}: the board is gone.`);
        await page.getByRole("button", { name: "Send the report" }).click();
        await expect(page).toHaveURL(/\?reported=1#report$/);
        const report = await row<{
          id: number;
          status: string;
          reason: string;
          respond_by: string;
        }>(
          "select id, status, reason, respond_by from payload.listing_reports where site_id = $1",
          [siteId],
        );
        expect(report).toMatchObject({ status: "new", reason: "gone" });
        expect(
          (await mails(request, TEAM, "team_notice")).some((m) =>
            m.subject.startsWith(`A report about ${unit}`),
          ),
        ).toBe(true);

        const down = await request.patch(`/api/sites/${siteId}`, {
          headers,
          data: { removed: true },
        });
        expect(down.ok(), await down.text()).toBeTruthy();
        expect((await current(siteId))?.removed).toBe(true);
        expect((await request.get(`/api/v1/sites/${unit}/`)).status()).toBe(410);
        // The middleware remembers a live answer for up to 30 seconds.
        await expect
          .poll(async () => (await request.get(publicPath)).status(), { timeout: 45_000 })
          .toBe(410);
        await page.goto(publicPath);
        await expect(page.locator("h1")).toHaveText("This site is no longer listed");
        const list = (await (
          await request.get("/api/v1/sites/?city=hyderabad&per_page=50")
        ).json()) as { sites: { unitId: string }[] };
        expect(list.sites.map((s) => s.unitId)).not.toContain(unit);
        await snapshot("report and takedown", { report, removed: true });
      });

      expect(errors, "no script errors on any page").toEqual([]);
    } finally {
      // Everything this run made, so the samples are as they were.
      await cleanUp(request);
      expect(
        await row("select id from payload.owners where login_email = $1", [OWNER]),
        "the owner and their sites are gone",
      ).toBeUndefined();
    }
  });
});
