/** The fixed vocabulary of the marketplace. Plain data: used by the CMS, the search and the pages alike. */
export const FORMATS = [
  {
    slug: "hoarding",
    label: "Hoarding",
    plural: "Hoardings",
    inSentence: "hoarding",
    icon: "hoarding",
  },
  { slug: "unipole", label: "Unipole", plural: "Unipoles", inSentence: "unipole", icon: "unipole" },
  { slug: "gantry", label: "Gantry", plural: "Gantries", inSentence: "gantry", icon: "gantry" },
  {
    slug: "bus-shelter",
    label: "Bus shelter",
    plural: "Bus shelters",
    inSentence: "bus shelter",
    icon: "bus-shelter",
  },
  {
    slug: "led-screen",
    label: "LED screen",
    plural: "LED screens",
    inSentence: "LED screen",
    icon: "led-screen",
  },
  {
    slug: "transit",
    label: "Transit panel",
    plural: "Transit panels",
    inSentence: "transit panel",
    icon: "transit",
  },
] as const;
export type FormatSlug = (typeof FORMATS)[number]["slug"];

export const CITIES = [
  { slug: "bengaluru", label: "Bengaluru" },
  { slug: "mumbai", label: "Mumbai" },
  { slug: "delhi-ncr", label: "Delhi NCR" },
  { slug: "hyderabad", label: "Hyderabad" },
  { slug: "pune", label: "Pune" },
  { slug: "chennai", label: "Chennai" },
] as const;
export type CitySlug = (typeof CITIES)[number]["slug"];

/** Where a map opens for each city, as longitude then latitude, before an owner has placed a pin. */
export const CITY_CENTRE: Record<CitySlug, [number, number]> = {
  bengaluru: [77.5946, 12.9716],
  mumbai: [72.8777, 19.076],
  "delhi-ncr": [77.209, 28.6139],
  hyderabad: [78.4867, 17.385],
  pune: [73.8567, 18.5204],
  chennai: [80.2707, 13.0827],
};

export const LIGHTING = [
  { slug: "front-lit", label: "Front-lit" },
  { slug: "back-lit", label: "Back-lit" },
  { slug: "unlit", label: "Not lit" },
  { slug: "digital", label: "Digital" },
] as const;
export type LightingSlug = (typeof LIGHTING)[number]["slug"];

export const ENVIRONMENTS = [
  { slug: "roadside", label: "Roadside" },
  { slug: "transit", label: "Transit" },
  { slug: "retail", label: "Retail" },
  { slug: "indoor", label: "Indoor" },
] as const;

/** What OOHWORKS checked. The keys are what the address bar carries. */
export const TRUST = [
  { key: "owner", label: "Verified owner" },
  { key: "location", label: "Verified location" },
  { key: "permit", label: "Permit on file" },
  { key: "fresh", label: "Updated in the last 30 days" },
  { key: "responsive", label: "Replies in under a day" },
] as const;
export type TrustKey = (typeof TRUST)[number]["key"];

export const SORTS = [
  { key: "best", label: "Best match" },
  { key: "price", label: "Price, low to high" },
  { key: "newest", label: "Newest" },
  { key: "confirmed", label: "Recently confirmed" },
  { key: "audience", label: "Largest audience" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export function formatDef(slug: string | null | undefined) {
  return FORMATS.find((f) => f.slug === slug);
}
export function cityDef(slug: string | null | undefined) {
  return CITIES.find((c) => c.slug === slug);
}
export function lightingDef(slug: string | null | undefined) {
  return LIGHTING.find((l) => l.slug === slug);
}

const options = <T extends { slug: string; label: string }>(list: readonly T[]) =>
  list.map((o) => ({ label: o.label, value: o.slug }));
export const FORMAT_SELECT = options(FORMATS);
export const CITY_SELECT = options(CITIES);
export const LIGHTING_SELECT = options(LIGHTING);
export const ENVIRONMENT_SELECT = options(ENVIRONMENTS);
