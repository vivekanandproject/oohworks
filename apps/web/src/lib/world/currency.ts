import countryToCurrency from "country-to-currency";

/**
 * Which currency each country pays in, and nothing else, so code that runs in a browser (the search
 * state, the brief box) can know it without the full country tables in lib/world/countries.
 */
const BY_COUNTRY = countryToCurrency as Record<string, string>;
const ALL = new Set(Object.values(BY_COUNTRY));

/** "IN" → "INR", in either case; undefined for a code that is not a country. */
export function currencyOfCountry(code: string | null | undefined): string | undefined {
  return code ? BY_COUNTRY[code.toUpperCase()] : undefined;
}

export const isCountryCode = (code: string): boolean => code.toUpperCase() in BY_COUNTRY;

export const isCurrencyCode = (value: string): boolean => ALL.has(value.toUpperCase());
