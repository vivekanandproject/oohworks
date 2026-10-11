import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Phone numbers from any country. The owner picks the country and types the number the way they
 * write it at home. It is checked against that country's own rules and kept in the international
 * form, so it can be dialled from anywhere.
 */
export interface PhoneCountry {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** The calling code with its plus, such as +91. */
  dial: string;
}

const names = new Intl.DisplayNames(["en"], { type: "region" });
const all = getCountries();

export const PHONE_COUNTRIES: readonly PhoneCountry[] = all
  .map((code) => ({
    code,
    name: names.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_PHONE_COUNTRY = "IN";

export const isPhoneCountry = (value: string): value is CountryCode =>
  (all as readonly string[]).includes(value);

export type PhoneResult =
  { ok: true; country: string; e164: string; display: string } | { ok: false };

/**
 * Reads a number as typed. A number that starts with a plus carries its own country, whatever the
 * list says. The test is whether the number could exist in that country, by its length: a stricter
 * test turns away real numbers from ranges opened since the rules were last updated.
 */
export function checkPhone(countryRaw: string, numberRaw: string): PhoneResult {
  const typed = numberRaw.trim();
  if (!typed || typed.length > 32 || !/^[+(\d][\d\s().-]*$/.test(typed)) return { ok: false };
  const country = isPhoneCountry(countryRaw) ? countryRaw : DEFAULT_PHONE_COUNTRY;
  const parsed = parsePhoneNumberFromString(typed, country);
  if (!parsed || !parsed.isPossible()) return { ok: false };
  // Several countries can share a calling code. When the number does not say which, a number typed
  // with its own plus is given the first country it could belong to, and one typed without keeps
  // the country chosen in the list.
  const dial = `+${parsed.countryCallingCode}`;
  const shared = typed.startsWith("+")
    ? (parsed.getPossibleCountries()[0] ?? PHONE_COUNTRIES.find((c) => c.dial === dial)?.code)
    : country;
  return {
    ok: true,
    country: parsed.country ?? shared ?? country,
    e164: parsed.number,
    display: parsed.formatInternational(),
  };
}

/** A saved number, split back into the country and the part typed after it, for showing in the form. */
export function splitPhone(
  saved: string | null | undefined,
  countryHint?: string | null,
): { country: string; national: string } {
  const hint = countryHint && isPhoneCountry(countryHint) ? countryHint : DEFAULT_PHONE_COUNTRY;
  const value = (saved ?? "").trim();
  if (!value) return { country: hint, national: "" };
  const parsed = parsePhoneNumberFromString(value, hint);
  if (!parsed) return { country: hint, national: value };
  return { country: parsed.country ?? hint, national: parsed.formatNational() };
}

/** The country a visitor is most likely in, from the edge network's header, for the list's first choice. */
export function countryOf(headers: Headers): string {
  const seen = (
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    ""
  ).toUpperCase();
  return isPhoneCountry(seen) ? seen : DEFAULT_PHONE_COUNTRY;
}
