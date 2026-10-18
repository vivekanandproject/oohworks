import { createHmac, timingSafeEqual } from "node:crypto";
import { payloadSecret, siteUrl } from "./hosting";

/**
 * Signed links in emails: confirming a follow or a newsletter sign-up, leaving either, and an owner
 * confirming their sites' availability in one tap. A link opens only the one thing it was made for,
 * and nobody can make one for someone else's address without the site's secret.
 */
export type LinkPurpose =
  "confirm-follow" | "unfollow" | "confirm-subscriber" | "unsubscribe" | "availability";

/** How long an availability link works: until the next week's reminder, and a little more. */
const AVAILABILITY_DAYS = 14;
const DAY = 24 * 3600 * 1000;

function mac(text: string): string {
  const secret = payloadSecret();
  if (!secret) throw new Error("PAYLOAD_SECRET is not set");
  return createHmac("sha256", secret).update(`email-link:${text}`).digest("hex").slice(0, 32);
}

const same = (a: string, b: string): boolean => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** The key for one record and one purpose. Availability keys also carry the day they were made. */
export function linkKey(purpose: LinkPurpose, id: number, day = ""): string {
  return mac(`${purpose}:${id}:${day}`);
}

export function checkLinkKey(purpose: LinkPurpose, id: number, key: string, day = ""): boolean {
  return /^[0-9a-f]{32}$/.test(key) && same(key, linkKey(purpose, id, day));
}

/** The full address of a link, for an email. */
export function emailLink(purpose: LinkPurpose, id: number, now = Date.now()): string {
  const params = new URLSearchParams({ p: purpose, id: String(id) });
  if (purpose === "availability") {
    const day = new Date(now).toISOString().slice(0, 10);
    params.set("d", day);
    params.set("k", linkKey(purpose, id, day));
  } else params.set("k", linkKey(purpose, id));
  return `${siteUrl()}/api/email-link/?${params.toString()}`;
}

/** An availability link stops working two weeks after it was made. */
export function availabilityDayFresh(day: string, now = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const made = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(made) && now - made >= 0 && now - made <= AVAILABILITY_DAYS * DAY;
}
