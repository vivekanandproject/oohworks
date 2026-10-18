import { expect, test, type APIRequestContext } from "@playwright/test";
import { TEST_CRON_SECRET } from "../scripts/test-env.mjs";
import { adminHeaders, mails } from "./helpers/admin";

/**
 * Jobs on a timer and the links in their emails, against the sample sites loaded into the test database
 * by `pnpm test:db`. No test here adds or changes a site: other tests count them while this one runs.
 */

const run = (request: APIRequestContext, job: string, secret = TEST_CRON_SECRET) =>
  request.post(`/api/jobs/${job}/`, { headers: { Authorization: `Bearer ${secret}` } });

/** The path and query of the first link to this site's email-link route in a text. */
const linkIn = (text: string): string => {
  const m = /https?:\/\/[^/\s]+(\/api\/email-link\/\?\S+)/.exec(text);
  if (!m?.[1]) throw new Error(`no email link in: ${text.slice(0, 200)}`);
  return m[1];
};

test.describe("jobs on a timer", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "one engine is enough for jobs",
  );

  test("run only with the secret, and only the jobs that exist", async ({ request }) => {
    expect((await request.post("/api/jobs/alerts/")).status()).toBe(401);
    expect((await run(request, "alerts", "wrong")).status()).toBe(401);
    expect((await run(request, "no-such-job")).status()).toBe(404);
    const res = await run(request, "reply-times");
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ job: "reply-times", ok: true });
  });

  test("a follow is confirmed by email, alerted once about new sites, and stops when asked", async ({
    page,
    request,
  }, info) => {
    test.setTimeout(90_000);
    const email = `e2e-alert-${info.project.name}-${Date.now()}@example.com`;
    const headers = await adminHeaders(request);
    const followed = await request.post("/api/follow/", {
      form: { email, city: "mumbai", return: "/search/?city=mumbai" },
      maxRedirects: 0,
    });
    expect(followed.headers()["location"]).toBe("/search/?city=mumbai&followed=1");

    // Nothing is sent to an unconfirmed address but the confirmation itself.
    const confirm = (await mails(request, email, "confirm_email"))[0];
    expect(confirm?.subject).toBe("Confirm: email me new sites in Mumbai");
    await page.goto(linkIn(confirm!.text));
    await expect(page).toHaveURL(/\/email\/following\/$/);
    await expect(page.locator("h1")).toHaveText("You will hear about new sites");

    // What matches today is not news.
    expect((await run(request, "alerts")).status()).toBe(200);
    expect(await mails(request, email, "alert")).toHaveLength(0);

    // As though Mumbai's sites had just been listed: one email naming them, then remembered.
    const follow = (
      (await (
        await request.get(`/api/follows?where[email][equals]=${encodeURIComponent(email)}`, {
          headers,
        })
      ).json()) as { docs: { id: number; confirmed: boolean; seen: string[] }[] }
    ).docs[0]!;
    expect(follow.confirmed).toBe(true);
    expect(follow.seen).toHaveLength(6);
    await request.patch(`/api/follows/${follow.id}`, { headers, data: { seen: [] } });
    await run(request, "alerts");
    const alerts = await mails(request, email, "alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.subject).toBe("6 new sites in Mumbai on ohworks");
    expect(alerts[0]!.text).toMatch(/\/in\/mumbai\//);
    expect(alerts[0]!.text).toContain("/search/?city=mumbai");
    await run(request, "alerts");
    expect(await mails(request, email, "alert")).toHaveLength(1);

    // The way out in the email works, and nothing more is sent.
    await page.goto(linkIn(alerts[0]!.text.slice(alerts[0]!.text.indexOf("Stop these emails"))));
    await expect(page).toHaveURL(/\/email\/unfollowed\/$/);
    await request.patch(`/api/follows/${follow.id}`, { headers, data: { seen: [] } });
    await run(request, "alerts");
    expect(await mails(request, email, "alert")).toHaveLength(1);
    await request.delete(`/api/follows/${follow.id}`, { headers });
  });

  test("the newsletter sign-up is confirmed by email", async ({ page, request }, info) => {
    const email = `e2e-brief-${info.project.name}-${Date.now()}@example.com`;
    await request.post("/api/subscribe/", { form: { email, from: "/newsroom/" }, maxRedirects: 0 });
    const confirm = (await mails(request, email, "confirm_email"))[0];
    expect(confirm?.subject).toBe("Confirm: the ohworks daily briefing");
    await page.goto(linkIn(confirm!.text));
    await expect(page.locator("h1")).toHaveText("You are on the list");
    const headers = await adminHeaders(request);
    const subscriber = (
      (await (
        await request.get(`/api/subscribers?where[email][equals]=${encodeURIComponent(email)}`, {
          headers,
        })
      ).json()) as { docs: { id: number; confirmed: boolean }[] }
    ).docs[0]!;
    expect(subscriber.confirmed).toBe(true);
    await request.delete(`/api/subscribers/${subscriber.id}`, { headers });
  });

  test("owners are asked about stale availability, and a link that is not right changes nothing", async ({
    page,
    request,
  }) => {
    const res = await run(request, "availability");
    expect(res.status()).toBe(200);
    const done = (await res.json()) as { owners: number; sites: number };
    // The samples include sites whose availability was never confirmed or is weeks old.
    expect(done.owners).toBeGreaterThan(0);
    expect(done.sites).toBeGreaterThan(0);

    await page.goto("/api/email-link/?p=availability&id=1&d=2026-01-01&k=" + "0".repeat(32));
    await expect(page).toHaveURL(/\/email\/link-not-valid\/$/);
    await expect(page.locator("h1")).toHaveText("This link does not work");
    await page.goto("/api/email-link/?p=nothing&id=1&k=x");
    await expect(page).toHaveURL(/\/email\/link-not-valid\/$/);
  });
});
