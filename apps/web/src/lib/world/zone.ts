import tzLookup from "@photostructure/tz-lookup";
import { countryOrDefault } from "./countries";

/** The zone at a point, read offline from the coordinates; the country's main zone if that fails. Server only. */
export function timeZoneAt(lat: number, lng: number, country?: string | null): string {
  try {
    return tzLookup(lat, lng);
  } catch {
    return countryOrDefault(country).timeZone;
  }
}
