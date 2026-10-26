import { cleanEmail } from "@/lib/forms";
import { slugify } from "@/lib/slug";
import { checkPhone, isPhoneCountry } from "@/lib/phone";
import { launchCity } from "@/lib/places";
import { isGstin, tidyGstin } from "./gstin";
import { isPasswordHash } from "./password";

/**
 * What OOHWORKS asks of someone listing: the company buyers will see as the seller, where it is, and
 * who to reach. A company can be anywhere in the world, and so can its phone number. It is checked
 * here whether it arrives from the start page or the company page.
 */
export interface CompanyPlace {
  /** As the owner chose it from the search, or typed it. */
  label: string;
  /** The Google place, when one was picked. */
  id: string | null;
  /** ISO country code, when the search knew it. */
  country: string | null;
}

export interface StartDetails {
  name: string;
  place: CompanyPlace;
  /** The company's city as an address part ("bengaluru", "dubai"), when the place names one. */
  city: string | null;
  contactName: string;
  /** In the international form, such as +91 98450 00000. */
  phone: string;
  phoneCountry: string;
  /** A GSTIN in India. Elsewhere, the company's registration or trade licence number. */
  gstin: string | null;
  /** The hash of the password a new owner chose. Never the password. */
  passwordHash?: string | null;
}

export interface CompanyRaw {
  name: string;
  placeLabel: string;
  placeId: string;
  placeLat: string;
  placeLng: string;
  placeCountry: string;
  contactName: string;
  phoneCountry: string;
  phone: string;
  gstin: string;
}
export interface StartRaw extends CompanyRaw {
  email: string;
}

export type CompanyError = "name" | "place" | "contact" | "phone" | "gstin" | "regno";
export type StartError = CompanyError | "email";

const coordinate = (value: string, limit: number): number | null => {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

/** Checks the fields in the order they stand on the page, so the first mistake named is the first one seen. */
export function checkCompany(
  raw: CompanyRaw,
): { ok: true; details: StartDetails } | { ok: false; error: CompanyError } {
  const name = raw.name.trim();
  if (name.length < 2 || name.length > 80) return { ok: false, error: "name" };

  const label = raw.placeLabel.trim().replace(/\s+/g, " ");
  if (label.length < 2 || label.length > 160) return { ok: false, error: "place" };
  const country = /^[A-Za-z]{2}$/.test(raw.placeCountry.trim())
    ? raw.placeCountry.trim().toUpperCase()
    : null;
  const placeId = /^[A-Za-z0-9_-]{10,300}$/.test(raw.placeId.trim()) ? raw.placeId.trim() : null;
  // A city OOHWORKS already has pages for keeps its address; any other is named from the place.
  const launch = launchCity({
    label,
    lat: coordinate(raw.placeLat, 90),
    lng: coordinate(raw.placeLng, 180),
  });
  const city = launch ?? (country ? slugify(label.split(",")[0] ?? "") || null : null);

  const contactName = raw.contactName.trim();
  if (contactName.length < 2 || contactName.length > 80) return { ok: false, error: "contact" };

  const phone = checkPhone(raw.phoneCountry.trim().toUpperCase(), raw.phone);
  if (!phone.ok) return { ok: false, error: "phone" };

  // In India the number is a GSTIN, which can be checked by its last character. Elsewhere it is a
  // registration or trade licence number, which our team reads against the document.
  let gstin: string | null = null;
  const typed = raw.gstin.trim();
  if (typed) {
    const looksIndian = /^\d{2}[A-Za-z0-9]{13}$/.test(typed.replace(/\s+/g, ""));
    const indian = country === "IN" || Boolean(launch) || (country === null && looksIndian);
    if (indian) {
      if (!isGstin(typed)) return { ok: false, error: "gstin" };
      gstin = tidyGstin(typed);
    } else {
      if (!/^[A-Za-z0-9][A-Za-z0-9 ./-]{3,39}$/.test(typed)) return { ok: false, error: "regno" };
      gstin = typed.toUpperCase();
    }
  }

  return {
    ok: true,
    details: {
      name,
      place: { label, id: placeId, country },
      city,
      contactName,
      phone: phone.display,
      phoneCountry: phone.country,
      gstin,
    },
  };
}

export type StartResult =
  { ok: true; email: string; details: StartDetails } | { ok: false; error: StartError };

/** The start form: the company, and the address a code is sent to. */
export function checkStart(raw: StartRaw): StartResult {
  const company = checkCompany(raw);
  if (!company.ok) {
    // The email stands before the registration number on the page, so it is named first.
    if (company.error !== "gstin" && company.error !== "regno") return company;
    return cleanEmail(raw.email) ? company : { ok: false, error: "email" };
  }
  const email = cleanEmail(raw.email);
  if (!email) return { ok: false, error: "email" };
  return { ok: true, email, details: company.details };
}

/** Reads details kept beside a code back into shape. Anything that does not fit is treated as absent. */
export function readDetails(value: unknown): StartDetails | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const text = (x: unknown, max: number): string | null =>
    typeof x === "string" && x.trim().length > 0 && x.length <= max ? x.trim() : null;
  const place =
    v.place && typeof v.place === "object" ? (v.place as Record<string, unknown>) : null;
  const name = text(v.name, 80);
  const label = place ? text(place.label, 160) : null;
  const contactName = text(v.contactName, 80);
  const phoneCountry = text(v.phoneCountry, 2);
  const phone = text(v.phone, 40);
  if (!name || name.length < 2 || !label || !contactName || !phone || !phoneCountry) return null;
  if (!isPhoneCountry(phoneCountry) || !checkPhone(phoneCountry, phone).ok) return null;
  const country = place ? text(place.country, 2) : null;
  return {
    name,
    place: {
      label,
      id: place ? text(place.id, 300) : null,
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    },
    city: typeof v.city === "string" && /^[a-z0-9-]{1,80}$/.test(v.city) ? v.city : null,
    contactName,
    phone,
    phoneCountry,
    gstin: text(v.gstin, 40),
    passwordHash: isPasswordHash(v.passwordHash) ? v.passwordHash : null,
  };
}
