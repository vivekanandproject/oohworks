import { getCountries } from "libphonenumber-js";
import { getCountry } from "countries-and-timezones";
import countryToCurrency from "country-to-currency";

/**
 * Every country OOHWORKS knows, held in the code so nothing depends on a service to know that the UAE
 * pays in dirhams or that India counts in lakh. The address segment is the ISO code in lower case
 * (`/in/`, `/ae/`), as it already is for India.
 */
export interface Country {
  /** ISO 3166-1 alpha-2, upper case: "IN". */
  code: string;
  /** The address segment: "in". */
  slug: string;
  name: string;
  /** ISO 4217: "INR". */
  currency: string;
  /** The zone most of the country lives in, for a date when no place is known. */
  timeZone: string;
  /** How numbers are grouped and spelled: lakh and crore only in India. */
  locale: "en-IN" | "en-US" | "en-GB";
  /** The unit owners and buyers say sizes in first. */
  sizeUnit: "ft" | "m";
}

/** Where a country spans zones, the one its commerce runs on. */
const MAIN_ZONE: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  MX: "America/Mexico_City",
  BR: "America/Sao_Paulo",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  RU: "Europe/Moscow",
  ID: "Asia/Jakarta",
  KZ: "Asia/Almaty",
  CN: "Asia/Shanghai",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  CD: "Africa/Kinshasa",
  EC: "America/Guayaquil",
  MY: "Asia/Kuala_Lumpur",
  MN: "Asia/Ulaanbaatar",
  UA: "Europe/Kyiv",
  DE: "Europe/Berlin",
  GB: "Europe/London",
  FR: "Europe/Paris",
  NL: "Europe/Amsterdam",
  DK: "Europe/Copenhagen",
};

/** Where sizes are said in feet first. */
const FEET = new Set(["IN", "US", "PK", "BD", "LK", "NP", "MM", "LR"]);

const names = new Intl.DisplayNames(["en"], { type: "region" });

function build(code: string): Country | null {
  const currency = (countryToCurrency as Record<string, string>)[code];
  const zones = getCountry(code)?.timezones ?? [];
  const timeZone = MAIN_ZONE[code] ?? zones[0];
  if (!currency || !timeZone) return null;
  return {
    code,
    slug: code.toLowerCase(),
    name: names.of(code) ?? code,
    currency,
    timeZone,
    locale: code === "IN" ? "en-IN" : code === "US" ? "en-US" : "en-GB",
    sizeUnit: FEET.has(code) ? "ft" : "m",
  };
}

export const COUNTRIES: readonly Country[] = getCountries()
  .map((c) => build(c))
  .filter((c): c is Country => c !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

/** The country until a visitor or a place says otherwise. */
export const DEFAULT_COUNTRY = "IN";

/** A country by its code, in either case ("IN" or "in"). */
export function findCountry(code: string | null | undefined): Country | undefined {
  return code ? BY_CODE.get(code.toUpperCase()) : undefined;
}

/** The same, falling back to the default country, for formatting that must always have one. */
export function countryOrDefault(code: string | null | undefined): Country {
  return findCountry(code) ?? BY_CODE.get(DEFAULT_COUNTRY)!;
}

/** Every currency some country uses, for an owner who quotes in another one. */
export const CURRENCIES: readonly string[] = [...new Set(COUNTRIES.map((c) => c.currency))].sort();

export const isCurrency = (value: string): boolean => CURRENCIES.includes(value.toUpperCase());
