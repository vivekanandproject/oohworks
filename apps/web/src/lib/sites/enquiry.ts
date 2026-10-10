import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { formatDate } from "@/lib/editorial/format";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;
export const CODE_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const BUYER_COOKIE = "oh_buyer";

function secret(): string {
  const s = process.env.PAYLOAD_SECRET;
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
