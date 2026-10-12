import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { formatDate } from "@/lib/editorial/format";
import { payloadSecret } from "@/lib/hosting";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;
export const CODE_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const BUYER_COOKIE = "oh_buyer";

function secret(): string {
  const s = payloadSecret();
  if (!s) throw new Error("PAYLOAD_SECRET is not set");
  return s;
}

function mac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function newReference(): string {
  let out = "ENQ-";
  for (let i = 0; i < 8; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** One reference shared by the requests of a buyer who asked several owners at once. */
export function newPlanReference(): string {
  let out = "PLN-";
  for (let i = 0; i < 8; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function isPlanReference(value: string): boolean {
  return /^PLN-[0-9A-HJKMNP-TV-Z]{8}$/.test(value);
}

/** A single enquiry's reference, or a plan's. */
export function isAnyReference(value: string): boolean {
  return isReference(value) || isPlanReference(value);
}

export function isReference(value: string): boolean {
  return /^ENQ-[0-9A-HJKMNP-TV-Z]{8}$/.test(value);
}

export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** The code is never stored; only this. It is bound to its enquiry, so a code cannot be reused elsewhere. */
export function hashCode(code: string, reference: string): string {
  return mac(`code:${reference}:${code}`);
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * A signed note that this browser confirmed an email for one purpose. A note signed for a buyer is no
 * use as an owner's, and the reverse.
 */
export function signEmail(
  scope: "buyer" | "owner",
  email: string,
  now: number = Date.now(),
): string {
  const body = Buffer.from(JSON.stringify({ e: email, x: now + THIRTY_DAYS })).toString(
    "base64url",
  );
  return `${body}.${mac(`${scope}:${body}`)}`;
}

export function readEmail(
  scope: "buyer" | "owner",
  value: string | undefined,
  now: number = Date.now(),
): string | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig || !sameHash(sig, mac(`${scope}:${body}`))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      e?: unknown;
      x?: unknown;
    };
    return typeof data.e === "string" && typeof data.x === "number" && data.x > now ? data.e : null;
  } catch {
    return null;
  }
}

export const OWNER_COOKIE = "oh_owner";
/**
 * Says only "an owner is signed in on this browser", so the bar can show "Your sites" on pages that
 * are the same for everyone and may be cached. It is readable by the page, proves nothing, and opens
 * nothing: the owner's pages still ask for the signed cookie above.
 */
export const OWNER_BAR_COOKIE = "oh_bar";

/** A signed note that this browser confirmed this email, so it is not asked for a code again for 30 days. */
export function signBuyer(email: string, now: number = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ e: email, x: now + THIRTY_DAYS })).toString(
    "base64url",
  );
  return `${body}.${mac(`buyer:${body}`)}`;
}

export function readBuyer(value: string | undefined, now: number = Date.now()): string | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig || !sameHash(sig, mac(`buyer:${body}`))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      e?: unknown;
      x?: unknown;
    };
    return typeof data.e === "string" && typeof data.x === "number" && data.x > now ? data.e : null;
  } catch {
    return null;
  }
}

export const BUYER_COOKIE_SECONDS = THIRTY_DAYS / 1000;

/** "y··@company.com": enough to recognise, not enough to read. */
export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.charAt(0)}··@${domain}`;
}

/** Form posts must come from this site. Stops another site from sending an enquiry in a visitor's name. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return true;
  try {
    const from = new URL(origin).host;
    const host =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
    return from === host;
  } catch {
    return false;
  }
}

export const ARTWORK = {
  ready: "Ready",
  in_progress: "In progress",
  not_started: "Not started",
} as const;
export type Artwork = keyof typeof ARTWORK;

/** "1 to 30 Nov 2026", "20 Nov to 5 Dec 2026", or both dates in full across years. */
export function dateRange(from: string, to: string): string {
  const a = formatDate(from).split(" ");
  const b = formatDate(to).split(" ");
  if (a.join(" ") === b.join(" ")) return b.join(" ");
  if (a[2] !== b[2]) return `${a.join(" ")} to ${b.join(" ")}`;
  if (a[1] !== b[1]) return `${a[0]} ${a[1]} to ${b.join(" ")}`;
  return `${a[0]} to ${b.join(" ")}`;
}

export type ThreadRole = "owner" | "buyer";

/**
 * The key in a link emailed to one side of an enquiry. It opens that side's view of the conversation
 * and nothing else: an owner's key never opens the buyer's view, and no key opens another enquiry.
 */
export function threadKey(reference: string, role: ThreadRole): string {
  return mac(`thread:${role}:${reference}`).slice(0, 32);
}

export function checkThreadKey(reference: string, role: ThreadRole, key: string): boolean {
  return /^[0-9a-f]{32}$/.test(key) && sameHash(key, threadKey(reference, role));
}

export const ANSWERS = {
  available: "Available for these dates",
  unavailable: "Not available",
  other_dates: "Free on other dates",
} as const;
export type Answer = keyof typeof ANSWERS;

/** How many answered enquiries an owner needs before their reply time is worked out from them. */
export const MIN_REPLIES = 5;

/**
 * The median time an owner takes to give a first reply, in hours. Null until there are enough answered
 * enquiries to be fair to them: one fast or slow reply should not earn or cost a badge.
 */
export function medianReplyHours(pairs: { sentAt: string; repliedAt: string }[]): number | null {
  const hours = pairs
    .map((p) => (new Date(p.repliedAt).getTime() - new Date(p.sentAt).getTime()) / 3600_000)
    .filter((h) => Number.isFinite(h) && h >= 0)
    .sort((a, b) => a - b);
  if (hours.length < MIN_REPLIES) return null;
  const mid = Math.floor(hours.length / 2);
  const median =
    hours.length % 2
      ? (hours[mid] as number)
      : ((hours[mid - 1] as number) + (hours[mid] as number)) / 2;
  return Math.round(median * 10) / 10;
}
