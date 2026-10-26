import { isCountryCode } from "./currency";

/** The visitor's country, as they chose it in the header or as Cloudflare placed them on the first visit. */
export const COUNTRY_COOKIE = "oh_country";

/** A two-letter country from the header Cloudflare (or another host) adds; XX and T1 are not places. */
export function geoCountry(read: (name: string) => string | null): string | null {
  const code = (read("cf-ipcountry") || read("x-vercel-ip-country") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" && isCountryCode(code)
    ? code
    : null;
}
