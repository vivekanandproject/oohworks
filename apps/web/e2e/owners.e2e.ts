import { expect as baseExpect, test, type APIRequestContext, type Page } from "@playwright/test";
import { adminHeaders, mails } from "./helpers/admin";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * The owner's side: listing sites. Each test makes its own owner, with an address that names the
 * browser it ran in, and removes that owner and their sites afterwards, so the sample inventory the
 * other tests count is left as it was.
 */
// These flows post forms that write several records, and they run beside the rest of the suite, so
// each check is given longer to appear than a plain page load needs.
const expect = baseExpect.configure({ timeout: 20_000 });

// A script error on any of these pages fails the test that met it. A page that rebuilds itself after
// such an error throws away what the owner has typed, which is how a corrected GSTIN was once lost.
const scriptErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const seen: string[] = [];
  scriptErrors.set(page, seen);
  page.on("pageerror", (error) => seen.push(`${error.message.slice(0, 200)} on ${page.url()}`));
});
test.afterEach(({ page }) => {
  baseExpect(scriptErrors.get(page) ?? [], "script errors on the owner's pages").toEqual([]);
});

// The forms allow one address ten starts a minute. Every test here would otherwise share one
// address, the machine's own, and the busiest minute of a full run would be turned away.
const visitor = () =>
  `10.${1 + Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": visitor() });
});

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Removes every owner whose sign-in address starts a given way, with their sites, photographs and files. */
async function removeOwners(request: APIRequestContext, prefix: string): Promise<void> {
  const headers = await adminHeaders(request);
  const listed = await request.get(
    `/api/owners?where[loginEmail][like]=${encodeURIComponent(prefix)}&limit=50&depth=0`,
    { headers },
  );
  expect(
    listed.ok(),
    `listing owners answered ${listed.status()}: ${(await listed.text()).slice(0, 300)}`,
  ).toBeTruthy();
  const owners = ((await listed.json()) as { docs: { id: number }[] }).docs;
  for (const owner of owners) {
    const sites = (
      (await (
        await request.get(
          `/api/sites?where[owner][equals]=${owner.id}&draft=true&limit=200&depth=0`,
          { headers },
        )
      ).json()) as { docs: { id: number; photos?: { image: number }[] }[] }
    ).docs;
    for (const site of sites) {
      await request.delete(`/api/sites/${site.id}`, { headers });
      for (const photo of site.photos ?? [])
        await request.delete(`/api/media/${photo.image}`, { headers });
    }
    const files = (
      (await (
        await request.get(`/api/owner-files?where[owner][equals]=${owner.id}&limit=100&depth=0`, {
          headers,
        })
      ).json()) as { docs: { id: number }[] }
    ).docs;
    for (const file of files) await request.delete(`/api/owner-files/${file.id}`, { headers });
    await request.delete(`/api/owners/${owner.id}`, { headers });
  }
}

/** Runs the file-making helper. It is a process of its own because the runner cannot load the spreadsheet library. */
function make<T>(command: string, input?: unknown): T {
  const text = execFileSync(
    "node",
    [fileURLToPath(new URL("./helpers/files.mjs", import.meta.url)), command],
    {
      input: input === undefined ? "" : JSON.stringify(input),
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(text.toString()) as T;
}
const fileFrom = (command: string, input?: unknown): Buffer =>
  Buffer.from(make<{ base64: string }>(command, input).base64, "base64");
const photo = (): Buffer => fileFrom("photo");
const scan = (): Buffer => fileFrom("scan");
type Cells = Record<string, string | number | { $date: string }>;

/** The email step: an address, then the code sent to it. Ends on the company page, or the owner's sites. */
async function signIn(page: Page, request: APIRequestContext, email: string): Promise<void> {
  await page.goto("/sign-in/code/");
  await page.locator("#signin-email").fill(email);
  await page.locator("[data-action='signin-code']").click();
  await expect(page).toHaveURL(/\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}&via=signin$/, {
    timeout: 15_000,
  });
  const code =
    /\b\d{6}\b/.exec((await mails(request, email, "owner_code"))[0]?.text ?? "")?.[0] ?? "";
  await page.locator("#owner-code").fill(code);
  await page.locator("[data-action='confirm']").click();
  await expect(page).toHaveURL(/\/owner\//, { timeout: 30_000 });
}

/**
 * Types into a place box and picks the first place offered. The box is an ordinary text box until
 * its script wakes, so the typing is tried again if nothing is offered.
 */
async function choosePlace(page: Page, box: string, typed: string, full: string): Promise<void> {
  const input = page.locator(box);
  const field = input.locator("xpath=..");
  const first = field.locator("[role='option']").first();
  await baseExpect(async () => {
    await input.fill("");
    await input.pressSequentially(typed, { delay: 20 });
    await baseExpect(first).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 40_000 });
  await first.click();
  await expect(input).toHaveValue(full);
  // The pick is recorded once the place's details have come back.
  await expect(field.locator("input[name='placeCountry']")).not.toHaveValue("");
}

/** A number from the range British television is given for drama, so it is nobody's. */
const PHONE = { country: "GB", typed: "07700 900123", kept: "+44 7700 900123" };
async function typePhone(page: Page, id: string): Promise<void> {
  await page.locator(`${id}-country`).selectOption(PHONE.country);
  await page.locator(id).fill(PHONE.typed);
}
const HYDERABAD = "Hyderabad, Telangana, India";
const PASSWORD = "e2e three plain words";

async function addCompany(page: Page, name: string): Promise<void> {
  await page.locator("#co-name").fill(name);
  await choosePlace(page, "#co-place", "Hyder", HYDERABAD);
  await page.locator("#co-contact").fill("Asha Rao");
  await typePhone(page, "#co-phone");
  await page.locator("[data-action='save-company']").click();
  await expect(page).toHaveURL(/\/owner\/\?saved=company$/, { timeout: 30_000 });
}

test.describe("list your sites: the start", () => {
  test("says what listing is, and asks who is listing in one form", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "List your sites" }).first()).toHaveAttribute(
      "href",
      "/list-your-sites/",
    );
    await page.goto("/list-your-sites/");
    await expect(page.locator("h1")).toHaveText("List your sites. It is free.");
    // This page is for owners searching how to list, so it is offered to search engines.
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "index").not.toContain("noindex");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      /\/list-your-sites\/$/,
    );
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/list-your-sites/");
    await expect(page.locator("[data-section='ways'] h3")).toHaveText([
      "One at a time",
      "A spreadsheet",
      "Send us your media kit",
    ]);
    // One form asks for the company, the person and where enquiries go. Only the GSTIN can wait.
    const form = page.locator("[data-section='start-form']");
    for (const id of [
      "lys-name",
      "lys-place",
      "lys-contact",
      "lys-phone",
      "owner-email",
      "lys-password",
    ])
      await expect(form.locator(`#${id}`), `${id} is asked for`).toHaveAttribute("required", "");
    await expect(form.locator("#lys-gstin")).not.toHaveAttribute("required", "");
    await expect(form.locator("label[for='lys-gstin']")).toContainText("optional");
    // The company can be anywhere: its place is searched, and its phone can be from any country.
    await expect(form.locator("#lys-place")).toHaveAttribute("role", "combobox");
    expect(await form.locator("#lys-phone-country option").count()).toBeGreaterThan(200);
    await expect(form.locator("#lys-phone-country")).toHaveValue("IN");
    await expect(form.locator("[data-action='start']")).toHaveText("Save and send my code");
    // The four steps are beside the form, with this one marked in words.
    await expect(page.locator("[data-section='steps'] li")).toHaveCount(4);
    await expect(page.locator("[data-section='steps'] [aria-current='step']")).toContainText(
      /Your details\s*You are here/,
    );
    await expect(page.locator("main p.t-label").first()).toHaveText(
      "List your sites · step 1 of 4",
    );
    await expect(page.locator("main")).toContainText("there is no commission");
    // On a wide screen the form and the explanation sit side by side. On a phone the form comes first.
    const formBox = (await form.boundingBox())!;
    const asideBox = (await page.locator("main aside").boundingBox())!;
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      expect(asideBox.x).toBeGreaterThan(formBox.x + formBox.width);
      expect(Math.abs(asideBox.y - formBox.y)).toBeLessThan(400);
    } else {
      expect(asideBox.y).toBeGreaterThan(formBox.y + formBox.height - 1);
    }
    await page.goto("/for-owners/");
    await expect(
      page.locator("main").getByRole("link", { name: "List your sites" }).first(),
    ).toHaveAttribute("href", "/list-your-sites/");
  });

  test("the owner's pages are for the owner alone, and the endpoints refuse strangers", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    for (const path of [
      "/owner/",
      "/owner/company/",
      "/owner/sites/new/",
      "/owner/import/",
      "/owner/kit/",
      "/owner/sites/ows0001/",
    ]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(307);
      expect(res.headers()["location"]).toMatch(/\/list-your-sites\/$/);
    }
    const post = (path: string, form: Record<string, string>, headers?: Record<string, string>) =>
      request.post(path, { form, maxRedirects: 0, ...(headers ? { headers } : {}) });
    expect(
      (
        await post(
          "/api/owner/start/",
          { email: "a@example.org" },
          { origin: "https://evil.example" },
        )
      ).status(),
    ).toBe(403);
    // An email alone is no longer a start: the form's first missing answer is named.
    expect(
      (await post("/api/owner/start/", { email: "not-an-email" })).headers()["location"],
    ).toMatch(/^\/list-your-sites\/\?error=name&/);
    expect(
      (await post("/api/owner/start/", { email: "bot@example.org", website: "x" })).headers()[
        "location"
      ],
    ).toBe("/list-your-sites/");
    // No remembered browser: every write is sent to the start, and nothing is changed.
    for (const path of [
      "/api/owner/site/",
      "/api/owner/company/",
      "/api/owner/submit/",
      "/api/owner/quick/",
      "/api/owner/site/remove/",
      "/api/owner/site/withdraw/",
    ]) {
      expect((await post(path, { id: "ows0001", name: "x" })).headers()["location"], path).toBe(
        "/list-your-sites/",
      );
    }
    expect(
      (await post("/api/owner/confirm/", { t: "0".repeat(24), code: "123456" })).headers()[
        "location"
      ],
    ).toBe("/list-your-sites/?error=again");
    expect(
      (await request.get("/list-your-sites/confirm/?t=nonsense", { maxRedirects: 0 })).headers()[
        "location"
      ],
    ).toMatch(/\/list-your-sites\/\?error=again$/);
    // The stores behind it are closed to the public.
    expect((await request.get("/api/owner-files")).status()).toBe(403);
    expect((await request.get("/api/access-codes")).status()).toBe(403);
    const sample = (await (
      await request.get("/api/owners?where[slug][equals]=sample-kaveri")
    ).json()) as { docs: Record<string, unknown>[] };
    expect(sample.docs[0]).toBeTruthy();
    for (const hidden of ["contactEmail", "loginEmail", "gstin", "contactName"])
      expect(sample.docs[0], hidden).not.toHaveProperty(hidden);
  });

  test("the template is a spreadsheet with a heading for each fact and a guide", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for a download",
    );
    const res = await request.get("/api/owner/template/");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe(XLSX);
    expect(res.headers()["content-disposition"]).toBe(
      'attachment; filename="ohworks-sites-template.xlsx"',
    );
    const got = make<{ head: string[]; example: string; guideRows: number }>("template", {
      template: (await res.body()).toString("base64"),
    });
    expect(got.head.slice(0, 4)).toEqual(["Your reference", "Format", "Width", "Height"]);
    expect(got.head).toHaveLength(37);
    expect(got.example).toBe("EXAMPLE");
    expect(got.guideRows).toBeGreaterThan(37);
  });
});

test.describe("list your sites: the first form", () => {
  test.afterAll(async ({ request }) => removeOwners(request, "owner-form-"));

  const fill = async (page: Page, v: { name: string; email: string; gstin?: string }) => {
    await page.locator("#lys-name").fill(v.name);
    await choosePlace(page, "#lys-place", "Hyder", HYDERABAD);
    await page.locator("#lys-contact").fill("Asha Rao");
    await typePhone(page, "#lys-phone");
    await page.locator("#lys-password").fill(PASSWORD);
    await page.locator("#owner-email").fill(v.email);
    if (v.gstin) await page.locator("#lys-gstin").fill(v.gstin);
  };
  const ownersWith = async (request: APIRequestContext, email: string) =>
    (
      (await (
        await request.get(
          `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
          { headers: await adminHeaders(request) },
        )
      ).json()) as {
        docs: {
          name: string;
          gstin?: string | null;
          city?: string | null;
          phone?: string | null;
          phoneCountry?: string | null;
          location?: { label?: string | null; country?: string | null } | null;
        }[];
      }
    ).docs;

  test("one form, one code, and the owner is in with their company made", async ({
    page,
    request,
  }, info) => {
    const stamp = Date.now();
    const email = `owner-form-${info.project.name}-${stamp}@example.org`;
    const company = `E2E Form ${info.project.name} ${stamp}`;
    await page.goto("/list-your-sites/");
    await fill(page, { name: company, email, gstin: "29aagcb7383j1z4" });
    await page.locator("[data-action='start']").click();
    await expect(page).toHaveURL(/\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}$/);
    await expect(page.locator("[data-section='steps'] [aria-current='step']")).toContainText(
      /Confirm your email\s*You are here/,
    );
    await expect(page.locator("main p.t-label").first()).toHaveText(
      "List your sites · step 2 of 4",
    );
    // Nothing exists for an address nobody has confirmed.
    expect(await ownersWith(request, email)).toHaveLength(0);

    const code =
      /\b\d{6}\b/.exec((await mails(request, email, "owner_code"))[0]?.text ?? "")?.[0] ?? "";
    await page.locator("#owner-code").fill(code);
    await page.locator("[data-action='confirm']").click();
    await expect(page).toHaveURL(/\/owner\/\?saved=welcome$/);
    await expect(page.locator("h1")).toHaveText(company);
    await expect(page.locator("[data-section='saved-welcome']")).toContainText(
      "Your email is confirmed.",
    );
    const made = await ownersWith(request, email);
    expect(made).toHaveLength(1);
    expect(made[0]?.gstin).toBe("29AAGCB7383J1Z4");
    // The place is kept as chosen and matched to the ohworks city it is in. The phone is kept in
    // the form that can be dialled from anywhere.
    expect(made[0]?.location).toMatchObject({ label: HYDERABAD, country: "IN" });
    expect(made[0]?.city).toBe("hyderabad");
    expect(made[0]?.phone).toBe(PHONE.kept);
    expect(made[0]?.phoneCountry).toBe(PHONE.country);

    // Everything the form asked is on the company page, and enquiries go to the confirmed address.
    await page.goto("/owner/company/");
    await expect(page.locator("#co-name")).toHaveValue(company);
    await expect(page.locator("#co-place")).toHaveValue(HYDERABAD);
    await expect(page.locator("#co-contact")).toHaveValue("Asha Rao");
    await expect(page.locator("#co-phone-country")).toHaveValue(PHONE.country);
    await expect(page.locator("#co-phone")).toHaveValue(PHONE.typed);
    await expect(page.locator("#co-email")).toHaveValue(email);
    await expect(page.locator("#co-gstin")).toHaveValue("29AAGCB7383J1Z4");
    await expect(page.locator("[data-section='signing-in']")).toContainText(
      "You sign in with it and your password.",
    );

    // The password chosen on the form signs them in, with the work email as the user name.
    await page.locator("form[action='/api/owner/signout/'] button").first().click();
    await expect(page.locator("[data-section='signed-out']")).toBeVisible();
    await page.goto("/sign-in/");
    await page.locator("#signin-user").fill(email);
    await page.locator("#signin-password").fill(PASSWORD);
    await page.locator("[data-action='signin']").click();
    await expect(page).toHaveURL(/\/owner\/$/);
    await expect(page.locator("h1")).toHaveText(company);
    await expect(page.locator("[data-section='no-password']")).toHaveCount(0);
    await page.goto("/owner/company/");

    // Someone already listed who fills the form again keeps what they have.
    await page.locator("form[action='/api/owner/signout/'] button").first().click();
    await expect(page.locator("[data-section='signed-out']")).toBeVisible();
    await fill(page, { name: "Another Name Entirely", email });
    await page.locator("[data-action='start']").click();
    await expect(page).toHaveURL(/\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}$/);
    const again =
      /\b\d{6}\b/.exec((await mails(request, email, "owner_code"))[0]?.text ?? "")?.[0] ?? "";
    await page.locator("#owner-code").fill(again);
    await page.locator("[data-action='confirm']").click();
    await expect(page).toHaveURL(/\/owner\/\?saved=known$/);
    await expect(page.locator("h1")).toHaveText(company);
    await expect(page.locator("[data-section='saved-known']")).toContainText("left as they");
  });

  test("a mistake comes back with what was typed and the field marked", async ({
    page,
    request,
    baseURL,
  }, info) => {
    const email = `owner-form-${info.project.name}-bad-${Date.now()}@example.org`;
    await page.goto("/list-your-sites/");
    await fill(page, { name: "E2E Form Mistake", email, gstin: "29AAGCB7383J1Z5" });
    await page.locator("[data-action='start']").click();
    await expect(page.locator("[data-section='start-error']")).toContainText(
      "That GSTIN is not right.",
    );
    await expect(page.locator("#lys-name")).toHaveValue("E2E Form Mistake");
    await expect(page.locator("#lys-place")).toHaveValue(HYDERABAD);
    await expect(page.locator("input[name='placeCountry']")).toHaveValue("IN");
    await expect(page.locator("#lys-contact")).toHaveValue("Asha Rao");
    await expect(page.locator("#lys-phone-country")).toHaveValue(PHONE.country);
    await expect(page.locator("#lys-phone")).toHaveValue(PHONE.typed);
    await expect(page.locator("#owner-email")).toHaveValue(email);
    // A password is never sent back: not in the box, and not in the address.
    await expect(page.locator("#lys-password")).toHaveValue("");
    expect(decodeURIComponent(page.url())).not.toContain(PASSWORD);
    await expect(page.locator("#lys-password-help")).toContainText("type it again");
    await expect(page.locator("#lys-gstin")).toHaveAttribute("aria-invalid", "true");
    // The mistake is named beside the field too, and the notice leads to it.
    await expect(page.locator("[data-part='badge'] [data-section='field-error']")).toHaveText(
      "That GSTIN is not right.",
    );
    await page.locator("[data-section='start-error'] a").click();
    await expect(page.locator("#lys-gstin")).toBeFocused();
    await expect(page.locator("#lys-name")).not.toHaveAttribute("aria-invalid", "true");
    expect(await ownersWith(request, email)).toHaveLength(0);

    // The browser stops an empty box before it is sent, so the server's own checks are asked directly.
    const post = async (change: Record<string, string>) =>
      (
        await request.post("/api/owner/start/", {
          form: {
            name: "E2E Form Mistake",
            placeLabel: HYDERABAD,
            placeLat: "17.385",
            placeLng: "78.4867",
            placeCountry: "IN",
            contactName: "Asha Rao",
            phoneCountry: PHONE.country,
            phone: PHONE.typed,
            email,
            gstin: "",
            password: PASSWORD,
            ...change,
          },
          headers: { origin: baseURL ?? "", "x-forwarded-for": visitor() },
          maxRedirects: 0,
        })
      ).headers()["location"] ?? "";
    expect(await post({ name: "X" })).toMatch(/^\/list-your-sites\/\?error=name&/);
    expect(decodeURIComponent((await post({ name: "X" })).replace(/\+/g, " "))).not.toContain(
      PASSWORD,
    );
    // A password must be long enough, and may not be the owner's own email.
    expect(await post({ password: "short" })).toMatch(/^\/list-your-sites\/\?error=password&/);
    expect(await post({ password: "" })).toMatch(/^\/list-your-sites\/\?error=password&/);
    expect(await post({ password: email })).toMatch(/^\/list-your-sites\/\?error=passwordsame&/);
    expect(await post({ placeLabel: "" })).toMatch(/^\/list-your-sites\/\?error=place&/);
    expect(await post({ contactName: "" })).toMatch(/^\/list-your-sites\/\?error=contact&/);
    expect(await post({ phone: "call me" })).toMatch(/^\/list-your-sites\/\?error=phone&/);
    // Too short to be a number in the country chosen.
    expect(await post({ phoneCountry: "IN", phone: "12345" })).toMatch(
      /^\/list-your-sites\/\?error=phone&/,
    );
    expect(await post({ email: "not-an-email" })).toMatch(/^\/list-your-sites\/\?error=email&/);
    // A company anywhere in the world carries on, with its own phone and registration number.
    expect(
      await post({
        placeLabel: "Dubai, United Arab Emirates",
        placeLat: "25.2048",
        placeLng: "55.2708",
        placeCountry: "AE",
        phoneCountry: "AE",
        phone: "050 123 4567",
        gstin: "CN-1234567",
      }),
    ).toMatch(/^\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}$/);
    expect(await ownersWith(request, email)).toHaveLength(0);
  });
});

test.describe("list your sites: anywhere in the world", () => {
  test.afterAll(async ({ request }) => removeOwners(request, "owner-world-"));

  test("the place search answers this site's own pages, and nobody else's", async ({
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an API check",
    );
    const found = (await (await request.get("/api/places/?q=hyd&scope=city")).json()) as {
      provider: string;
      suggestions: { id: string; label: string; detail: string }[];
    };
    // No key is set where the tests run, so the list held in the code answers.
    expect(found.provider).toBe("local");
    expect(found.suggestions[0]).toMatchObject({ label: "Hyderabad", detail: "Telangana, India" });
    const detail = (await (
      await request.get(`/api/places/detail/?id=${encodeURIComponent(found.suggestions[0]!.id)}`)
    ).json()) as { place: { countryCode: string; lat: number }; city: string };
    expect(detail.place).toMatchObject({ countryCode: "IN", lat: 17.385 });
    expect(detail.city).toBe("hyderabad");
    expect((await (await request.get("/api/places/?q=h")).json()).suggestions).toEqual([]);
    const stranger = await request.get("/api/places/?q=hyd", {
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(stranger.status()).toBe(403);
  });

  test("a company in another country is found by search, with a phone from that country", async ({
    page,
    request,
  }, info) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const email = `owner-world-${info.project.name}-${stamp}@example.org`;
    const company = `E2E Gulf ${info.project.name} ${stamp}`;
    const ownerOf = async () =>
      (
        (await (
          await request.get(
            `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
            { headers: await adminHeaders(request) },
          )
        ).json()) as {
          docs: {
            city?: string | null;
            phone?: string | null;
            phoneCountry?: string | null;
            location?: { label?: string | null; country?: string | null } | null;
          }[];
        }
      ).docs[0];

    await page.goto("/list-your-sites/");
    await page.locator("#lys-name").fill(company);
    // Typed, offered, and chosen with the keyboard alone.
    const place = page.locator("#lys-place");
    const options = page.locator("[data-section='start-form'] [role='option']");
    await baseExpect(async () => {
      await place.fill("");
      await place.pressSequentially("Dub", { delay: 20 });
      await baseExpect(options.first()).toBeVisible({ timeout: 4000 });
    }).toPass({ timeout: 40_000 });
    await expect(options.first()).toContainText("Dubai");
    await expect(place).toHaveAttribute("aria-expanded", "true");
    await place.press("ArrowDown");
    await place.press("Enter");
    await expect(place).toHaveValue("Dubai, United Arab Emirates");
    await expect(page).toHaveURL(/\/list-your-sites\/$/);
    // The phone's country follows the place while the number is still empty.
    await expect(page.locator("#lys-phone-country")).toHaveValue("AE");
    await page.locator("#lys-contact").fill("Asha Rao");
    await page.locator("#owner-email").fill(email);
    await page.locator("#lys-phone").fill("050 123 4567");
    await page.locator("#lys-password").fill(PASSWORD);
    await page.locator("#lys-gstin").fill("CN-1234567");
    await page.locator("[data-action='start']").click();
    await expect(page).toHaveURL(/\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}$/);
    const code =
      /\b\d{6}\b/.exec((await mails(request, email, "owner_code"))[0]?.text ?? "")?.[0] ?? "";
    await page.locator("#owner-code").fill(code);
    await page.locator("[data-action='confirm']").click();
    await expect(page).toHaveURL(/\/owner\/\?saved=welcome$/);
    await expect(page.locator("[data-section='owner-counts']")).toContainText(
      "Dubai, United Arab Emirates",
    );
    expect(await ownerOf()).toMatchObject({
      location: { label: "Dubai, United Arab Emirates", country: "AE" },
      city: null,
      phone: "+971 50 123 4567",
      phoneCountry: "AE",
    });

    // The company page shows it back the way it was given.
    await page.goto("/owner/company/");
    await expect(page.locator("#co-place")).toHaveValue("Dubai, United Arab Emirates");
    await expect(page.locator("#co-phone-country")).toHaveValue("AE");
    await expect(page.locator("#co-phone")).toHaveValue("050 123 4567");
    await expect(page.locator("#co-gstin")).toHaveValue("CN-1234567");

    // A place the search does not know is kept as typed. Nobody is turned away for where they are.
    const mine = page.locator("#co-place");
    await baseExpect(async () => {
      await mine.fill("");
      await mine.pressSequentially("Timbuktu, Mali", { delay: 20 });
      await baseExpect(
        page.locator("[data-section='company-form'] [data-section='place-options']"),
      ).toContainText("You can keep what you typed", { timeout: 4000 });
    }).toPass({ timeout: 40_000 });
    await page.locator("[data-action='save-company']").click();
    await expect(page).toHaveURL(/\/owner\/\?saved=company$/);
    await expect(page.locator("[data-section='owner-counts']")).toContainText("Timbuktu, Mali");
    expect((await ownerOf())?.location).toMatchObject({ label: "Timbuktu, Mali", country: null });

    // On the site form the same search puts the pin on the place and moves the city to match.
    await page.goto("/owner/sites/new/");
    const find = page.locator("#site-find");
    const found = page.locator("[data-section='site-found']");
    await baseExpect(async () => {
      await find.fill("");
      await find.pressSequentially("Pune", { delay: 20 });
      await baseExpect(
        page.locator("[data-section='pin-picker'] [role='option']").first(),
      ).toBeVisible({ timeout: 4000 });
    }).toPass({ timeout: 40_000 });
    // Enter chooses the first place. It does not send the form the search sits in.
    await find.press("Enter");
    await expect(found).toContainText("The pin is at Pune, Maharashtra, India");
    await expect(page).toHaveURL(/\/owner\/sites\/new\/$/);
    await expect(page.locator("#site-lat")).toHaveValue("18.52040");
    await expect(page.locator("#site-lng")).toHaveValue("73.85670");
    await expect(page.locator("select[name='city']")).toHaveValue("pune");
    // A place outside the cities ohworks has pages for is said to be so.
    await find.fill("");
    await find.pressSequentially("Singap", { delay: 20 });
    await expect(page.locator("[data-section='pin-picker'] [role='option']").first()).toBeVisible();
    await find.press("Enter");
    await expect(found).toContainText("That is outside");
    await expect(page.locator("#site-lat")).toHaveValue("1.35210");
  });
});

test.describe("list your sites: one design", () => {
  test.afterAll(async ({ request }) => removeOwners(request, "owner-frame-"));

  /** What a page's frame measures: its title, its top space, its form and its side panel. */
  const frame = (page: Page) =>
    page.evaluate(() => {
      const main = document.querySelector("main")!;
      const px = (v: string) => Math.round(parseFloat(v));
      const box = (el: Element) => el.getBoundingClientRect();
      const h1 = main.querySelector("h1")!;
      const aside = main.querySelector("aside");
      const label = [...main.querySelectorAll(".t-label")].find((e) => box(e).top < box(h1).top);
      // The page's own form: not the sign-out in the owner's bar, and not a tool inside a panel.
      const form = [...main.querySelectorAll("form")].find(
        (f) => box(f).width >= 500 && !f.closest("aside") && f.querySelector(".oh-input"),
      );
      return {
        top: px(getComputedStyle(main.firstElementChild!).paddingTop),
        title: px(getComputedStyle(h1).fontSize),
        labelIsLink: Boolean(label?.querySelector("a")),
        hasLabel: Boolean(label),
        form: form ? Math.round(box(form).width) : null,
        asideLeft: aside ? Math.round(box(aside).left) : null,
        asideWidth: aside ? Math.round(box(aside).width) : null,
        boxedFieldsets: [...main.querySelectorAll("fieldset")].filter(
          (f) => getComputedStyle(f).borderTopWidth !== "0px",
        ).length,
        headings: [
          ...new Set(
            [...main.querySelectorAll("section > h2, aside h2")]
              .filter((h) => box(h).height > 0)
              .map((h) => px(getComputedStyle(h).fontSize)),
          ),
        ],
      };
    });

  test("every owner page shares the frame of the enquiry page or the shortlist", async ({
    page,
    request,
    isMobile,
  }, info) => {
    test.skip(Boolean(isMobile), "the two columns are a wide-screen layout");
    test.setTimeout(90_000);
    // The two pages the rest of the site already had: a form page and a page of content.
    await page.goto("/enquire/ows0001/");
    const formPage = await frame(page);
    await page.goto("/shortlist/?sites=ows0001,ows0003");
    const contentPage = await frame(page);
    expect(formPage.form, "the enquiry form").toBe(560);

    const check = async (path: string, kind: "form" | "content") => {
      await page.goto(path);
      const got = await frame(page);
      const want = kind === "form" ? formPage : contentPage;
      expect(got.top, `${path}: space above`).toBe(want.top);
      expect(got.title, `${path}: title size`).toBe(want.title);
      expect(got.hasLabel, `${path}: a label above the title`).toBe(true);
      expect(got.labelIsLink, `${path}: the label is plain text`).toBe(false);
      expect(got.asideLeft, `${path}: where the side panel starts`).toBe(want.asideLeft);
      expect(got.asideWidth, `${path}: how wide the side panel is`).toBe(want.asideWidth);
      if (kind === "form") expect(got.form, `${path}: form width`).toBe(formPage.form);
      // Fields sit on the page. A long form is split by a rule and a heading, never by boxes.
      expect(got.boxedFieldsets, `${path}: boxes around fields`).toBe(0);
      // Every panel and section title is one size.
      expect(got.headings, `${path}: heading sizes`).toEqual(got.headings.length ? [23] : []);
    };

    await check("/list-your-sites/", "form");
    // The pages that only ask who you are sit in one column in the middle of the page.
    for (const path of ["/sign-in/", "/sign-in/code/"]) {
      await page.goto(path);
      const got = await frame(page);
      expect(got.top, `${path}: space above`).toBe(formPage.top);
      expect(got.title, `${path}: title size`).toBe(formPage.title);
      expect(got.labelIsLink, `${path}: the label is plain text`).toBe(false);
      const centred = await page.evaluate(() => {
        const mid = (el: Element) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        };
        const box = document.querySelector("main form")!;
        return {
          box: Math.round(mid(box) - innerWidth / 2),
          title: Math.round(mid(document.querySelector("main h1")!) - innerWidth / 2),
          width: Math.round(box.getBoundingClientRect().width),
          align: getComputedStyle(document.querySelector("main h1")!).textAlign,
        };
      });
      expect(Math.abs(centred.box), `${path}: the box is in the middle`).toBeLessThanOrEqual(1);
      expect(Math.abs(centred.title), `${path}: the title is in the middle`).toBeLessThanOrEqual(1);
      expect(centred.align, `${path}: the title is centred`).toBe("center");
      expect(centred.width, `${path}: the box's width`).toBe(440);
    }
    const stamp = Date.now();
    await signIn(page, request, `owner-frame-${info.project.name}-${stamp}@example.org`);
    expect((await frame(page)).form, "the company step, before a company exists").toBe(560);
    await addCompany(page, `E2E Frame ${stamp}`);
    await check("/owner/", "content");
    await check("/owner/company/", "form");
    await check("/owner/sites/new/", "form");
    await check("/owner/import/", "form");
    await check("/owner/kit/", "form");
  });
});

test.describe("list your sites: the ways in", () => {
  test.afterAll(async ({ request }) => removeOwners(request, "owner-bar-"));

  test("on its own page, the bar's List your sites puts the cursor in the first box", async ({
    page,
  }) => {
    await page.goto("/list-your-sites/");
    const button = page.locator("header a:visible", { hasText: "List your sites" });
    await expect(button).toHaveAttribute("href", "#lys-name");
    await button.click();
    await expect(page.locator("#lys-name")).toBeFocused();
    // The page answers without jumping past its own headline.
    await expect(page.locator("h1")).toBeInViewport();
    await expect(page.locator("#lys-name")).toBeInViewport();
  });

  test("Sign in asks for a user name and password, and the bar then leads to the owner's sites", async ({
    page,
    request,
    baseURL,
  }, testInfo) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const email = `owner-bar-${testInfo.project.name}-${stamp}@example.org`;
    // By role and exact name: only what is shown counts, and "Your sites" is not "List your sites".
    const bar = page.locator("header");
    const list = bar.getByRole("link", { name: "List your sites", exact: true });
    const yours = bar.getByRole("link", { name: "Your sites", exact: true });
    await page.goto("/");
    await expect(list).toHaveCount(1);
    await expect(yours).toHaveCount(0);

    await page.goto("/sign-in/");
    await expect(page.locator("h1")).toHaveText("Sign in");
    await expect(page.locator("main")).not.toContainText("accounts open");
    await expect(page.locator("[data-section='signin-buyers']")).toContainText(
      "You need no account",
    );
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    // A user name and a password, in a box in the middle of the page.
    const form = page.locator("[data-section='signin-form']");
    await expect(form.locator("label[for='signin-user']")).toHaveText("User name");
    await expect(form.locator("#signin-user")).toHaveAttribute("autocomplete", "username");
    await expect(form.locator("label[for='signin-password']")).toHaveText("Password");
    await expect(form.locator("#signin-password")).toHaveAttribute("type", "password");
    await expect(form.locator("#signin-password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    const box = (await form.boundingBox())!;
    const wide = page.viewportSize()!.width;
    expect(Math.abs(box.x + box.width / 2 - wide / 2)).toBeLessThanOrEqual(1);
    // The password can be looked at before it is sent.
    await form.locator("#signin-password").fill("let me see");
    await form.getByRole("button", { name: "Show password" }).click();
    await expect(form.locator("#signin-password")).toHaveAttribute("type", "text");
    await form.getByRole("button", { name: "Hide password" }).click();
    await expect(form.locator("#signin-password")).toHaveAttribute("type", "password");

    // A pair that is not on file is refused in one sentence, whichever half was wrong.
    await form.locator("#signin-user").fill(email);
    await form.locator("#signin-password").fill("not the password");
    await form.locator("[data-action='signin']").click();
    await expect(page.locator("[data-section='signin-error']")).toContainText(
      "That user name and password do not match.",
    );
    await expect(page.locator("#signin-user")).toHaveValue(email);
    await expect(page.locator("#signin-password")).toHaveValue("");
    expect(decodeURIComponent(page.url())).not.toContain("not the password");

    // Forgotten, or never set: a code by email is the other way in.
    await page.locator("[data-action='forgot']").click();
    await expect(page).toHaveURL(/\/sign-in\/code\/$/);
    await page.locator("#signin-email").fill(email);
    await page.locator("[data-action='signin-code']").click();
    await expect(page).toHaveURL(/\/list-your-sites\/confirm\/\?t=[0-9a-f]{24}&via=signin$/);
    await expect(page.locator("main p.t-label").first()).toHaveText("Sign in");
    // A wrong code keeps the visitor on the sign-in wording.
    await page.locator("#owner-code").fill("000000");
    await page.locator("[data-action='confirm']").click();
    await expect(page.locator("[data-section='confirm-error']")).toContainText("did not match");
    await expect(page).toHaveURL(/via=signin/);
    const code =
      /\b\d{6}\b/.exec((await mails(request, email, "owner_code"))[0]?.text ?? "")?.[0] ?? "";
    await page.locator("#owner-code").fill(code);
    await page.locator("[data-action='confirm']").click();
    await expect(page).toHaveURL(/\/owner\/company\/$/);

    // Signed in: every page's bar now leads to the owner's sites, including pages built once for all.
    for (const path of ["/", "/search/", "/for-owners/"]) {
      await page.goto(path);
      await expect(yours, `the bar on ${path}`).toHaveAttribute("href", "/owner/");
      await expect(list, `the bar on ${path}`).toHaveCount(0);
      await expect(bar.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
    }
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Your sites", exact: true })).toHaveCount(1);
    await expect(footer.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
    // Sign in has nothing to ask a signed-in owner.
    await page.goto("/sign-in/");
    await expect(page).toHaveURL(/\/owner\/company\/$/);

    // Having come in by code they have no password yet, and are asked to make one.
    await addCompany(page, `E2E Bar ${stamp}`);
    await expect(page.locator("[data-section='no-password']")).toContainText(
      "You have no password yet.",
    );
    await page.locator("[data-section='no-password'] a").click();
    await expect(page).toHaveURL(/\/owner\/password\/$/);
    await expect(page.locator("h1")).toHaveText("Create a password");
    await page.locator("#new-password").fill(PASSWORD);
    await page.locator("[data-action='save-password']").click();
    await expect(page).toHaveURL(/\/owner\/\?saved=password$/);
    await expect(page.locator("[data-section='saved-password']")).toBeVisible();
    await expect(page.locator("[data-section='no-password']")).toHaveCount(0);
    // They are told by email, so a change they did not make would be noticed.
    await expect
      .poll(async () => (await mails(request, email, "owner_notice"))[0]?.subject ?? "")
      .toBe("Your ohworks password is set");

    await page.locator("form[action='/api/owner/signout/'] button").first().click();
    await expect(page.locator("[data-section='signed-out']")).toBeVisible();
    await expect(list).toHaveCount(1);
    await page.goto("/");
    await expect(yours).toHaveCount(0);
    await expect(list).toHaveCount(1);

    // And back in with the user name and the new password, sent with the Enter key.
    await page.goto("/sign-in/");
    await page.locator("#signin-user").fill(email);
    await page.locator("#signin-password").fill(PASSWORD);
    await page.locator("#signin-password").press("Enter");
    await expect(page).toHaveURL(/\/owner\/$/);
    await expect(yours).toHaveCount(1);

    // Five wrong passwords in a row close the door for a while, even to the right one. A code
    // still opens it.
    const attempt = async (password: string) =>
      (
        await request.post("/api/owner/signin/", {
          form: { email, password },
          headers: { origin: baseURL ?? "", "x-forwarded-for": visitor() },
          maxRedirects: 0,
        })
      ).headers()["location"] ?? "";
    for (let i = 0; i < 4; i++) expect(await attempt("wrong again")).toMatch(/error=match/);
    expect(await attempt("wrong again")).toMatch(/error=locked/);
    expect(await attempt(PASSWORD)).toMatch(/error=locked/);
    const shut = await request.get("/sign-in/?error=locked");
    expect(await shut.text()).toContain("sign in with a code");
  });

  test("a mistake asking for a code comes back to that page", async ({ request, baseURL }) => {
    const res = await request.post("/api/owner/start/", {
      form: { via: "signin", email: "not-an-email" },
      headers: { origin: baseURL ?? "", "x-forwarded-for": visitor() },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toBe("/sign-in/code/?error=email");
    const page = await request.get("/sign-in/code/?error=email");
    expect(await page.text()).toContain("That email did not look right.");
  });
});

test.describe("list your sites: the journey", () => {
  test("an owner confirms their email, adds a company and a site, and it goes live after the team's check", async ({
    page,
    request,
  }, info) => {
    test.setTimeout(150_000);
    const prefix = `owner-${info.project.name}-`;
    await removeOwners(request, prefix);
    const stamp = Date.now();
    const email = `${prefix}${stamp}@example.org`;
    const company = `E2E Outdoor ${info.project.name} ${stamp}`;
    const road = `E2E Road ${stamp}`;
    // Each browser pins its site somewhere of its own, so no two are taken for the same face.
    const lat = (
      17.3 +
      ["desktop", "phone", "webkit-phone", "firefox-desktop"].indexOf(info.project.name) * 0.01 +
      (stamp % 1000) / 1e6
    ).toFixed(5);
    try {
      await signIn(page, request, email);
      await expect(page).toHaveURL(/\/owner\/company\/$/);
      expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain(
        "noindex",
      );

      // The company. A mistyped GSTIN is caught, and what was typed is kept.
      await page.locator("#co-name").fill(company);
      await choosePlace(page, "#co-place", "Hyder", HYDERABAD);
      await page.locator("#co-contact").fill("Asha Rao");
      await typePhone(page, "#co-phone");
      await page.locator("#co-gstin").fill("29AAGCB7383J1Z5");
      await page.locator("[data-action='save-company']").click();
      await expect(page.locator("[data-section='company-error']")).toContainText(
        "That GSTIN is not right.",
      );
      await expect(page.locator("#co-name")).toHaveValue(company);
      await page.locator("#co-gstin").fill("29aagcb7383j1z4");
      await page.locator("#co-doc").setInputFiles({
        name: "gst-certificate.png",
        mimeType: "image/png",
        buffer: scan(),
      });
      await page.locator("[data-action='save-company']").click();
      await expect(page).toHaveURL(/\/owner\/\?saved=company$/, { timeout: 30_000 });
      await expect(page.locator("h1")).toHaveText(company);
      await expect(page.locator("[data-section='not-verified']")).toContainText(
        "we are checking your details",
      );
      await expect(page.locator("[data-section='no-sites']")).toContainText("No sites yet");

      // A site. One mistake comes back beside its field, with everything else kept.
      await page.locator("[data-section='add']").getByRole("link", { name: "Add a site" }).click();
      await expect(page.locator("#site-city")).toHaveValue("hyderabad");
      await page.locator("#site-format").selectOption("transit");
      await page.locator("#site-lighting").selectOption("unlit");
      await page.locator("#site-width").fill("10");
      await page.locator("#site-height").fill("3");
      await page.locator("#site-locality").fill("Abids");
      await page.locator("#site-road").fill(road);
      await page.locator("#site-landmark").fill("near the GPO");
      await page.locator("#site-place").fill(`${lat}, 78.47650`);
      await page.locator("#site-facing").fill("90");
      await page.locator("[data-action='save-site']").click();
      await expect(page.locator("[data-section='site-errors']")).toContainText("One thing to fix");
      await expect(page.locator("[data-field-error='rate']")).toContainText(
        "Price is set to show, but there is no rate.",
      );
      await expect(page.locator("#site-road")).toHaveValue(road);
      await expect(page.locator("#site-lat")).toHaveValue(lat);
      await page.locator("#site-rate").fill("12,000");
      await page.locator("[data-action='save-site']").click();
      await expect(page).toHaveURL(/\/owner\/sites\/ow[0-9a-z]{5}\/\?saved=1$/, {
        timeout: 15_000,
      });
      const id = /sites\/(ow[0-9a-z]{5})/.exec(page.url())?.[1] ?? "";
      await expect(page.locator("h1")).toHaveText(`10 × 3 ft transit panel, ${road}`);
      await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "draft");
      await expect(page.locator("[data-section='duplicate']")).toHaveCount(0);
      await expect(page.locator("[data-section='score']")).toContainText(
        "Add a real photograph of the site",
      );

      // A photograph: the wrong kind of file is refused in words, the right kind is added.
      await page.locator("#photo-file").setInputFiles({
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("not a photo"),
      });
      await page.locator("[data-action='add-photo']").click();
      await expect(page.locator("[data-section='photo-error']")).toContainText(
        "Use a JPEG, PNG or WebP photograph.",
      );
      await page
        .locator("#photo-file")
        .setInputFiles({ name: "approach.jpg", mimeType: "image/jpeg", buffer: photo() });
      await page.locator("[data-action='add-photo']").click();
      await expect(page.locator("[data-section='photo-added']")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator("[data-section='photo-list'] li")).toHaveCount(1);
      await expect(page.locator("[data-section='score']")).not.toContainText(
        "Add a real photograph of the site",
      );

      // Until the team has checked it, nobody else can see it.
      const slug = company
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const publicPath = `/in/hyderabad/abids/transit-${road.toLowerCase().replace(/ /g, "-")}-${id}/`;
      expect((await request.get(publicPath, { maxRedirects: 0 })).status()).toBe(404);
      await page.goto("/owner/");
      await expect(page.locator("[data-section='owner-sites'] li")).toHaveCount(1);
      await page.locator("[data-action='submit']").click();
      await expect(page.locator("[data-section='sent']")).toContainText("1 site sent for review.", {
        timeout: 15_000,
      });
      await expect(page.locator(`[data-site='${id}']`)).toHaveAttribute("data-state", "review");
      await expect(page.locator("[data-section='submit']")).toHaveCount(0);
      expect(
        (await mails(request, "owners@ohworks.com", "team_notice")).some(
          (m) => m.subject === `1 site to review from ${company}` && m.text.includes(id),
        ),
      ).toBe(true);
      expect((await mails(request, email, "owner_notice"))[0]?.subject).toBe(
        "We have your 1 site for review",
      );

      // The team returns it. A reason is required, and the owner reads those words.
      const headers = await adminHeaders(request);
      const doc = (
        (await (
          await request.get(`/api/sites?where[permanentId][equals]=${id}&draft=true&depth=0`, {
            headers,
          })
        ).json()) as { docs: { id: number; review: string; source: string }[] }
      ).docs[0];
      expect(doc?.review).toBe("submitted");
      expect(doc?.source).toBe("form");
      expect(
        (
          await request.patch(`/api/sites/${doc?.id}?draft=true`, {
            headers,
            data: { review: "changes" },
          })
        ).status(),
      ).toBe(400);
      expect(
        (
          await request.patch(`/api/sites/${doc?.id}?draft=true`, {
            headers,
            data: { review: "changes", reviewNote: "The pin is on the wrong side of the road." },
          })
        ).status(),
      ).toBe(200);
      expect((await mails(request, email, "owner_notice"))[0]?.text).toContain(
        "The pin is on the wrong side of the road.",
      );
      await page.goto(`/owner/sites/${id}/`);
      await expect(page.locator("[data-section='review-note']")).toContainText(
        "The pin is on the wrong side of the road.",
      );
      await page
        .locator("[data-section='review-note']")
        .getByRole("link", { name: "Fix it" })
        .click();
      await expect(page.locator("#site-road")).toHaveValue(road);
      await page.locator("#site-landmark").fill("opposite the GPO");
      await page.locator("[data-action='save-site']").click();
      await expect(page).toHaveURL(new RegExp(`/owner/sites/${id}/\\?saved=1$`), {
        timeout: 15_000,
      });
      await page.goto("/owner/");
      await page.locator("[data-action='submit']").click();
      await expect(page.locator("[data-section='sent']")).toBeVisible({ timeout: 30_000 });

      // The team publishes it. It is live, the owner is told, and buyers can find it.
      expect(
        (
          await request.patch(`/api/sites/${doc?.id}`, {
            headers,
            data: { _status: "published", verifiedLocation: true },
          })
        ).status(),
      ).toBe(200);
      expect((await mails(request, email, "owner_notice"))[0]?.subject).toBe(
        `Your site is live: 10 × 3 ft transit panel, ${road}`,
      );
      await page.goto("/owner/");
      await expect(page.locator(`[data-site='${id}']`)).toHaveAttribute("data-state", "live");
      const live = await page.goto(publicPath);
      expect(live?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveText(`10 × 3 ft transit panel, ${road}`);
      await expect(page.locator("[data-section='owner']")).toContainText(company);
      await expect(page.locator("[data-section='owner']")).toContainText("Owner not yet verified");
      await expect(page.locator("[data-section='gallery']")).toHaveAttribute("data-photos", "1");
      await expect(page.locator("[data-section='price']")).toContainText("₹ 12,000");
      await expect(page.locator("[data-section='badges']")).toContainText("Verified location");
      // An owner we have not verified yet is live for buyers, and held back from search engines.
      expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain(
        "noindex",
      );
      await page.goto(`/search/?owner=${slug}`);
      await expect(page.locator("[data-section='results'] [data-site]")).toHaveCount(1);

      // What a live site is can be changed, but the changes go to the team first (followed through
      // in e2e/live-changes.e2e.ts); its price and availability change at once.
      await page.goto(`/owner/sites/${id}/edit/`);
      await expect(page.locator("[data-section='live-edit']")).toContainText(
        "go to the team first",
      );
      await page.goto(`/owner/sites/${id}/`);
      await page
        .locator("[data-section='quick-form'] input[name='priceDisplay'][value='on_request']")
        .check();
      await page.locator("#quick-rate").fill("");
      await page
        .locator("[data-section='quick-form'] input[name='availability'][value='booked']")
        .check();
      await page.locator("#quick-booked").fill(day(30));
      await page.locator("[data-action='quick-save']").click();
      await expect(page.locator("[data-section='quick-saved']")).toBeVisible({ timeout: 30_000 });
      await page.goto(publicPath);
      await expect(page.locator("[data-section='price']")).toContainText("Price on request");
      await expect(page.locator("[data-section='price']")).toContainText("Booked until");

      // The owner can take it off at any time.
      await page.goto(`/owner/sites/${id}/`);
      await page.locator("[data-action='withdraw']").click();
      await expect(page.locator("[data-section='withdrawn']")).toBeVisible({ timeout: 30_000 });
      expect((await request.get(publicPath, { maxRedirects: 0 })).status()).toBe(404);

      // Signing out forgets the browser, not the sites.
      await page
        .locator("[data-section='owner-bar']")
        .getByRole("button", { name: "Sign out" })
        .click();
      await expect(page.locator("[data-section='signed-out']")).toBeVisible();
      await page.goto("/owner/");
      await expect(page).toHaveURL(/\/list-your-sites\/$/);
    } finally {
      await removeOwners(request, prefix);
    }
  });

  test("a choice made while the page is still loading is kept", async ({
    page,
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough to hold back the scripts",
    );
    test.setTimeout(90_000);
    const prefix = "owner-early-";
    await removeOwners(request, prefix);
    try {
      await signIn(page, request, `${prefix}${Date.now()}@example.org`);
      await addCompany(page, `E2E Early ${Date.now()}`);
      // Hold every script back, as a slow connection would, and fill the form in the meantime.
      let release: () => void = () => undefined;
      const held = new Promise<void>((done) => (release = done));
      await page.route("**/_next/static/**/*.js", async (route) => {
        await held;
        await route.continue();
      });
      await page.goto("/owner/sites/new/", { waitUntil: "commit" });
      await page.locator("#site-format").selectOption("gantry");
      await page.locator("#site-lighting").selectOption("back-lit");
      await page.locator("#site-unit").selectOption("m");
      await page.locator("#site-road").fill("Early Road");
      await page.locator("#site-lat").fill("17.38001");
      release();
      await page.waitForLoadState("networkidle");
      // The page's script has now taken over. Nothing the owner chose or typed has been set back.
      await expect(page.locator("[data-action='open-pin-map']")).toBeEnabled();
      await expect(page.locator("#site-format")).toHaveValue("gantry");
      await expect(page.locator("#site-lighting")).toHaveValue("back-lit");
      await expect(page.locator("#site-unit")).toHaveValue("m");
      await expect(page.locator("#site-city")).toHaveValue("hyderabad");
      await expect(page.locator("#site-road")).toHaveValue("Early Road");
      await expect(page.locator("#site-lat")).toHaveValue("17.38001");
    } finally {
      await removeOwners(request, prefix);
    }
  });

  test("one owner cannot see or change another's site", async ({
    page,
    request,
    browser,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an access check",
    );
    test.setTimeout(90_000);
    const prefix = "owner-guard-";
    await removeOwners(request, prefix);
    const stamp = Date.now();
    try {
      await signIn(page, request, `${prefix}a-${stamp}@example.org`);
      await addCompany(page, `E2E Guard A ${stamp}`);
      const mine = await page.request.post("/api/owner/site/", {
        form: {
          format: "transit",
          lighting: "unlit",
          width: "10",
          height: "3",
          city: "hyderabad",
          locality: "Abids",
          road: `Guard Road ${stamp}`,
          lat: "17.35512",
          lng: "78.47111",
          priceDisplay: "on_request",
        },
        maxRedirects: 0,
      });
      const id = /sites\/(ow[0-9a-z]{5})/.exec(mine.headers()["location"] ?? "")?.[1] ?? "";
      expect(id).not.toBe("");

      const otherContext = await browser.newContext();
      const other = await otherContext.newPage();
      await signIn(other, request, `${prefix}b-${stamp}@example.org`);
      await addCompany(other, `E2E Guard B ${stamp}`);
      expect((await other.goto(`/owner/sites/${id}/`))?.status()).toBe(404);
      expect((await other.goto(`/owner/sites/${id}/edit/`))?.status()).toBe(404);
      for (const path of [
        "/api/owner/site/remove/",
        "/api/owner/site/withdraw/",
        "/api/owner/quick/",
        "/api/owner/photo/remove/",
      ]) {
        expect(
          (
            await other.request.post(path, {
              form: { id, priceDisplay: "exact", rate: "1", media: "1" },
              maxRedirects: 0,
            })
          ).headers()["location"],
          path,
        ).toBe("/owner/");
      }
      // An edit sent with another owner's site id creates nothing and changes nothing.
      expect(
        (
          await other.request.post("/api/owner/site/", {
            form: { id, format: "hoarding", road: "Stolen Road" },
            maxRedirects: 0,
          })
        ).headers()["location"],
      ).toBe("/owner/");
      // A sample site belongs to nobody who signs in here.
      expect((await other.goto("/owner/sites/ows0001/"))?.status()).toBe(404);
      await otherContext.close();

      await page.goto(`/owner/sites/${id}/`);
      await expect(page.locator("h1")).toContainText(`Guard Road ${stamp}`);
      await page.locator("[data-action='remove']").click();
      await expect(page.locator("[data-section='removed']")).toBeVisible({ timeout: 30_000 });
    } finally {
      await removeOwners(request, prefix);
    }
  });

  test("a spreadsheet becomes drafts, with each problem named by row and column, and never doubles a site", async ({
    page,
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for the spreadsheet",
    );
    test.setTimeout(120_000);
    const prefix = "owner-sheet-";
    await removeOwners(request, prefix);
    const stamp = Date.now();
    try {
      await signIn(page, request, `${prefix}${stamp}@example.org`);
      await addCompany(page, `E2E Sheet ${stamp}`);
      await page.goto("/owner/import/");
      await expect(page.locator("[data-action='template']")).toHaveAttribute(
        "href",
        "/api/owner/template/",
      );

      const template = (await (await page.request.get("/api/owner/template/")).body()).toString(
        "base64",
      );
      const base: Cells = {
        Format: "Bus shelter",
        Width: 12,
        Height: 4,
        Lighting: "Back-lit",
        City: "Hyderabad",
        Area: "Begumpet",
        "Price shown as": "exact",
        "Rate a month (INR)": 22000,
      };
      const rows: Record<number, Cells> = {
        3: {
          ...base,
          "Your reference": "SH-1",
          Road: `Sheet Road ${stamp}`,
          Latitude: 17.36001,
          Longitude: 78.46601,
          "Booked until": { $date: day(40) },
        },
        4: {
          ...base,
          "Your reference": "SH-2",
          Road: `Sheet Lane ${stamp}`,
          "Map link": "https://www.google.com/maps/@17.36501,78.46701,17z",
          "Price shown as": "on request",
          "Rate a month (INR)": "",
        },
        5: {
          ...base,
          "Your reference": "SH-3",
          Road: `Sheet Street ${stamp}`,
          Latitude: "17,37",
          Longitude: 78.468,
          "Audience a week": 50000,
        },
      };
      const upload = async () => {
        await page.goto("/owner/import/");
        await page.locator("#sheet-file").setInputFiles({
          name: "my-sites.xlsx",
          mimeType: XLSX,
          buffer: fileFrom("sheet", { template, rows }),
        });
        await page.locator("[data-action='import']").click();
        await expect(page).toHaveURL(/\/owner\/import\/\?file=\d+$/, { timeout: 30_000 });
      };

      await upload();
      await expect(page.locator("[data-section='import-added']")).toContainText(
        "2 sites added as drafts.",
      );
      const problems = page.locator("[data-section='import-problems'] tbody tr");
      await expect(problems).toHaveCount(3);
      await expect(problems.nth(0)).toContainText("5");
      await expect(page.locator("[data-section='import-problems']")).toContainText(
        "“17,37” is not a latitude.",
      );
      await expect(page.locator("[data-section='import-problems']")).toContainText(
        "An audience figure needs its source.",
      );
      await page.goto("/owner/");
      await expect(page.locator("[data-section='owner-sites'] li")).toHaveCount(2);
      await expect(page.locator("[data-section='owner-sites']")).toContainText(
        `12 × 4 ft bus shelter, Sheet Lane ${stamp}`,
      );
      await expect(page.locator("[data-section='owner-sites']")).toContainText("SH-1");

      // The same file again, with one row corrected and one changed: sites are updated, not doubled.
      rows[3] = {
        ...base,
        "Your reference": "SH-1",
        Road: `Sheet Road ${stamp}`,
        Latitude: 17.36001,
        Longitude: 78.46601,
        "Rate a month (INR)": 25000,
      };
      rows[5] = {
        ...base,
        "Your reference": "SH-3",
        Road: `Sheet Street ${stamp}`,
        Latitude: 17.37001,
        Longitude: 78.468,
      };
      await upload();
      await expect(page.locator("[data-section='import-added']")).toContainText(
        "1 site added as a draft, 2 sites updated.",
      );
      await expect(page.locator("[data-section='import-problems']")).toHaveCount(0);
      await page.goto("/owner/");
      await expect(page.locator("[data-section='owner-sites'] li")).toHaveCount(3);
      await expect(page.locator("[data-section='owner-sites']")).toContainText("₹ 25,000 a month");
      await expect(page.locator("[data-action='submit']")).toHaveText("Send 3 sites for review");

      // A file that is not the template is refused in words, and nothing is added.
      await page.goto("/owner/import/");
      await page.locator("#sheet-file").setInputFiles({
        name: "other.xlsx",
        mimeType: XLSX,
        buffer: fileFrom("plain", {
          rows: [
            ["Name", "Address"],
            ["A", "B"],
          ],
        }),
      });
      await page.locator("[data-action='import']").click();
      await expect(page.locator("[data-section='import-refused']")).toContainText(
        "does not look like the ohworks template",
        { timeout: 30_000 },
      );
      await page.locator("#sheet-file").setInputFiles({
        name: "sites.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("a,b\n1,2\n"),
      });
      await page.locator("[data-action='import']").click();
      await expect(page.locator("[data-section='import-error']")).toContainText(
        "Upload an Excel workbook",
        { timeout: 30_000 },
      );
    } finally {
      await removeOwners(request, prefix);
    }
  });

  test("a media kit goes to the team, and to nobody else", async ({
    page,
    request,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium" || Boolean(isMobile),
      "one engine is enough for an upload",
    );
    test.setTimeout(90_000);
    const prefix = "owner-kit-";
    await removeOwners(request, prefix);
    const stamp = Date.now();
    const company = `E2E Kit ${stamp}`;
    try {
      const email = `${prefix}${stamp}@example.org`;
      await signIn(page, request, email);
      await addCompany(page, company);
      await page
        .locator("[data-section='add']")
        .getByRole("link", { name: "Send a media kit" })
        .click();
      await page.locator("#kit-file").setInputFiles({
        name: "kit.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("site,rate\nAbids,12000\n"),
      });
      await page.locator("#kit-note").fill("Rates are for the festival season.");
      await page.locator("[data-action='send-kit']").click();
      await expect(page.locator("[data-section='kit-sent']")).toContainText("We have your file.", {
        timeout: 15_000,
      });
      await expect(page.locator("[data-section='kits']")).toContainText("kit.csv");
      await expect(page.locator("[data-section='kits']")).toContainText("With our team");
      const note = (await mails(request, "owners@ohworks.com", "team_notice")).find(
        (m) => m.subject === `A media kit to enter, from ${company}`,
      );
      expect(note?.text).toContain("Rates are for the festival season.");
      // The file itself is private: the public cannot list it or fetch it.
      const headers = await adminHeaders(request);
      const owner = (
        (await (
          await request.get(
            `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&depth=0`,
            { headers },
          )
        ).json()) as { docs: { id: number }[] }
      ).docs[0];
      const files = (
        (await (
          await request.get(
            `/api/owner-files?where[owner][equals]=${owner?.id}&where[kind][equals]=media_kit&depth=0`,
            { headers },
          )
        ).json()) as { docs: { url: string; kind: string }[] }
      ).docs;
      expect(files).toHaveLength(1);
      expect((await request.get(new URL(files[0]?.url ?? "", "http://x").pathname)).status()).toBe(
        403,
      );
      await page.locator("#kit-file").setInputFiles({
        name: "run.exe",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("MZ"),
      });
      await page.locator("[data-action='send-kit']").click();
      await expect(page.locator("[data-section='kit-error']")).toContainText("Send a PDF");
    } finally {
      await removeOwners(request, prefix);
    }
  });
});
