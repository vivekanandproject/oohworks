import { cleanEmail } from "@/lib/forms";
import { CITIES, type CitySlug } from "@/lib/sites/taxonomy";
import { isGstin, tidyGstin } from "./gstin";

/**
 * What the first form asks of someone listing: the company buyers will see as the seller, and who to
 * reach. It is checked here whether it arrives from the start page or the company page.
 */
export interface StartDetails {
  name: string;
  city: CitySlug | null;
  contactName: string;
  phone: string;
  gstin: string | null;
}

export interface StartRaw {
  name: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  gstin: string;
}

export type StartError = "name" | "city" | "contact" | "phone" | "email" | "gstin";

/** A company based outside the launch cities says so. It is stored as no city. */
export const OTHER_CITY = "other";

/** Digits, with spaces or hyphens, and a plus for the country code if the owner likes. */
export const PHONE = /^[+\d][\d\s-]{6,22}$/;

export type StartResult =
  { ok: true; email: string; details: StartDetails } | { ok: false; error: StartError };

/** Checks the fields in the order they stand on the page, so the first mistake named is the first one seen. */
export function checkStart(raw: StartRaw): StartResult {
  const name = raw.name.trim();
  if (name.length < 2 || name.length > 80) return { ok: false, error: "name" };
  const city = CITIES.find((c) => c.slug === raw.city)?.slug ?? null;
  if (!city && raw.city !== OTHER_CITY) return { ok: false, error: "city" };
  const contactName = raw.contactName.trim();
  if (contactName.length < 2 || contactName.length > 80) return { ok: false, error: "contact" };
  const phone = raw.phone.trim();
  if (!PHONE.test(phone)) return { ok: false, error: "phone" };
  const email = cleanEmail(raw.email);
  if (!email) return { ok: false, error: "email" };
  const gstin = raw.gstin.trim();
  if (gstin && !isGstin(gstin)) return { ok: false, error: "gstin" };
  return {
    ok: true,
    email,
    details: { name, city, contactName, phone, gstin: gstin ? tidyGstin(gstin) : null },
  };
}

/** Reads details kept beside a code back into shape. Anything that does not fit is treated as absent. */
export function readDetails(value: unknown): StartDetails | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const text = (x: unknown): string => (typeof x === "string" ? x : "");
  const checked = checkStart({
    name: text(v.name),
    city: text(v.city) || OTHER_CITY,
    contactName: text(v.contactName),
    phone: text(v.phone),
    email: "kept@example.com",
    gstin: text(v.gstin),
  });
  return checked.ok ? checked.details : null;
}
