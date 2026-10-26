import { slugify } from "@/lib/slug";
import { FIELD_KEYS, type FieldKey, type Raw } from "./site-input";

/**
 * What changed between a live site and an owner's proposed changes, in words the team can read. Kept
 * apart from the code that saves changes, so it can be tested without the CMS.
 */

const INSTANT = new Set<FieldKey>(["priceDisplay", "rate", "currency", "bookedUntil", "place"]);
/** What the place search sends beside the city; it moves with the city and is not a change of its own. */
const WITH_CITY = new Set<FieldKey>(["cityLabel", "cityId", "cityLat", "cityLng", "cityCountry"]);
const CHANGEABLE = FIELD_KEYS.filter((k) => !INSTANT.has(k) && !WITH_CITY.has(k));

/** A pin that moves further than this needs its location checked again. */
export const MOVED_METRES = 25;

const LABEL: Record<FieldKey, string> = {
  ownerRef: "Your reference",
  format: "Format",
  width: "Width",
  height: "Height",
  unit: "Size unit",
  lighting: "Lighting",
  litHours: "Lit hours",
  city: "City",
  cityLabel: "City",
  cityId: "City",
  cityLat: "City",
  cityLng: "City",
  cityCountry: "Country",
  country: "Country",
  locality: "Locality",
  road: "Road",
  landmark: "Landmark",
  lat: "Latitude",
  lng: "Longitude",
  place: "Place",
  facing: "Facing (degrees)",
  traffic: "Traffic",
  priceDisplay: "Price shown as",
  rate: "Rate a month",
  currency: "Currency",
  minPeriod: "Minimum period",
  productionCost: "Printing and mounting",
  notAccepted: "Not accepted",
  bookedUntil: "Booked until",
  audienceFigure: "Audience",
  audienceMetric: "Audience measure",
  audienceSource: "Audience source",
  audienceMethod: "Audience method",
  audienceDate: "Audience measured on",
  permitNumber: "Permit number",
  permitAuthority: "Permit authority",
  permitExpires: "Permit valid to",
  artworkSpec: "Artwork size",
  fileTypes: "File types",
  leadTimeDays: "Lead time (days)",
  resolution: "Screen resolution",
  spotSeconds: "Spot length (seconds)",
  loopSeconds: "Loop length (seconds)",
  advertisers: "Advertisers in a loop",
};

export interface Difference {
  key: FieldKey;
  label: string;
  from: string;
  to: string;
}

/** The city as its address part, however it arrived: "Dubai, United Arab Emirates" and "dubai" agree. */
const cityOf = (r: Raw): string => slugify((r.cityLabel || r.city || "").split(",")[0] ?? "");

export function differences(live: Raw, proposed: Raw): Difference[] {
  const same = (k: FieldKey) =>
    k === "city"
      ? cityOf(live) === cityOf(proposed)
      : (live[k] ?? "").trim() === (proposed[k] ?? "").trim();
  const shown = (r: Raw, k: FieldKey) =>
    ((k === "city" ? (r.cityLabel || r.city || "").split(",")[0] : r[k]) ?? "").trim() || "nothing";
  return CHANGEABLE.filter((k) => !same(k)).map((k) => ({
    key: k,
    label: LABEL[k],
    from: shown(live, k),
    to: shown(proposed, k),
  }));
}

export const summaryOf = (diffs: Difference[]): string =>
  diffs.map((d) => `${d.label}: ${d.from} → ${d.to}`).join("\n");
