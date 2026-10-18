import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { adminHeaders, mails } from "./admin";

/**
 * Owner sign-in for tests outside owners.e2e.ts: an address, the code sent to it, and the company.
 * Each caller uses an address of its own and removes the owner afterwards (removeOwner).
 */

/** The owner forms allow one address ten starts a minute, so each test comes from an address of its own. */
export const visitor = (): string =>
  `10.${1 + Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

export async function signInByCode(page: Page, request: APIRequestContext, email: string) {
  await page.goto("/sign-in/code/");
  await page.locator("#signin-email").fill(email);
  await page.locator("[data-action='signin-code']").click();
  await expect(page).toHaveURL(/\/list-your-sites\/confirm\//, { timeout: 15_000 });
  const code =
    /\b\d{6}\b/.exec((await mails(request, email, "owner_code"))[0]?.text ?? "")?.[0] ?? "";
  await page.locator("#owner-code").fill(code);
  await page.locator("[data-action='confirm']").click();
  await expect(page).toHaveURL(/\/owner\//, { timeout: 30_000 });
}

export async function addCompany(page: Page, name: string) {
  await page.locator("#co-name").fill(name);
  const place = page.locator("#co-place");
  const first = place.locator("xpath=..").locator("[role='option']").first();
  await expect(async () => {
    await place.fill("");
    await place.pressSequentially("Hyder", { delay: 20 });
    await expect(first).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 40_000 });
  await first.click();
  await page.locator("#co-contact").fill("Asha Rao");
  await page.locator("#co-phone-country").selectOption("GB");
  await page.locator("#co-phone").fill("07700 900123");
  await page.locator("[data-action='save-company']").click();
  await expect(page).toHaveURL(/\/owner\/\?saved=company$/, { timeout: 30_000 });
}

/** Removes an owner signed in with this address, with their sites and anything that points at them. */
export async function removeOwner(request: APIRequestContext, email: string) {
  const headers = await adminHeaders(request);
  const owners = (
    (await (
      await request.get(
        `/api/owners?where[loginEmail][equals]=${encodeURIComponent(email)}&limit=5&depth=0`,
        { headers },
      )
    ).json()) as { docs: { id: number }[] }
  ).docs;
  for (const owner of owners) {
    const changes = (
      (await (
        await request.get(`/api/site-changes?where[owner][equals]=${owner.id}&limit=50&depth=0`, {
          headers,
        })
      ).json()) as { docs: { id: number }[] }
    ).docs;
    for (const c of changes) await request.delete(`/api/site-changes/${c.id}`, { headers });
    const sites = (
      (await (
        await request.get(
          `/api/sites?where[owner][equals]=${owner.id}&draft=true&limit=50&depth=0`,
          { headers },
        )
      ).json()) as { docs: { id: number; photos?: { image: number }[] }[] }
    ).docs;
    for (const s of sites) {
      await request.delete(`/api/sites/${s.id}`, { headers });
      for (const p of s.photos ?? []) await request.delete(`/api/media/${p.image}`, { headers });
    }
    const files = (
      (await (
        await request.get(`/api/owner-files?where[owner][equals]=${owner.id}&limit=50&depth=0`, {
          headers,
        })
      ).json()) as { docs: { id: number }[] }
    ).docs;
    for (const f of files) await request.delete(`/api/owner-files/${f.id}`, { headers });
    await request.delete(`/api/owners/${owner.id}`, { headers });
  }
}
