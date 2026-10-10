import { CITIES, FORMATS, LIGHTING, TRUST, type TrustKey } from "./taxonomy";
import { toUrl, without, type SearchState } from "./state";

const DAY = 24 * 3600 * 1000;

/** One site, flattened to what searching, counting and sorting need. */
export interface Listing {
  id: number;
  permanentId: string;
  title: string;
  url: string;
  format: string;
  isDigital: boolean;
  lighting: string;
  city: string;
  locality: string;
  localitySlug: string;
  road: string;
  landmark: string;
  lat: number;
  lng: number;
  widthMm: number;
  heightMm: number;
  priceShown: boolean;
  rate: number | null;
  bookedUntil: number | null;
  confirmedOn: number | null;
  freshOn: number | null;
  audience: number | null;
  permitValid: boolean;
  verifiedLocation: boolean;
  ownerId: number;
  ownerSlug: string;
  ownerName: string;
  ownerVerified: boolean;
  ownerReplyHours: number | null;
  quality: number;
  createdAt: number;
  sample: boolean;
}

export type Facet =
  | "city"
  | "locality"
  | "format"
  | "type"
  | "size"
  | "lighting"
  | "price"
  | "priced"
  | "dates"
  | "trust"
  | "owner"
  | "q";

export function hasTrust(l: Listing, key: TrustKey, now: number): boolean {
  switch (key) {
    case "owner":
      return l.ownerVerified;
    case "location":
      return l.verifiedLocation;
    case "permit":
      return l.permitValid;
    case "fresh":
      return l.freshOn !== null && now - l.freshOn <= 30 * DAY;
    case "responsive":
      return l.ownerReplyHours !== null && l.ownerReplyHours < 24;
  }
}

function near(actualMm: number, feet: number): boolean {
  const want = feet * 304.8;
  return Math.abs(actualMm - want) <= want * 0.1;
}

/** Whether a site passes every filter. `skip` leaves one out, which is how each option's count is worked out. */
export function matches(l: Listing, s: SearchState, now: number, skip?: Facet): boolean {
  if (skip !== "city" && s.city && l.city !== s.city) return false;
  if (
    skip !== "locality" &&
    skip !== "city" &&
    s.localities.length &&
    !s.localities.includes(l.localitySlug)
  )
    return false;
  if (skip !== "format" && s.formats.length && !s.formats.includes(l.format)) return false;
  if (skip !== "type" && s.type && (s.type === "digital") !== l.isDigital) return false;
  if (skip !== "size" && s.size && !(near(l.widthMm, s.size.w) && near(l.heightMm, s.size.h)))
    return false;
  if (skip !== "lighting" && s.lighting.length && !s.lighting.includes(l.lighting)) return false;
  if (skip !== "price" && (s.min || s.max)) {
    // A price limit can only be judged against a price the owner shows.
    if (!l.priceShown || l.rate === null) return false;
    if (s.min && l.rate < s.min) return false;
    if (s.max && l.rate > s.max) return false;
  }
  if (skip !== "priced" && s.priced && !l.priceShown) return false;
  if (
    skip !== "dates" &&
    s.from &&
    l.bookedUntil !== null &&
    l.bookedUntil >= new Date(s.from).getTime()
  )
    return false;
  if (skip !== "trust") for (const key of s.trust) if (!hasTrust(l, key, now)) return false;
  if (skip !== "owner" && s.owner && l.ownerSlug !== s.owner) return false;
  if (skip !== "q" && s.q) {
    const hay = `${l.title} ${l.road} ${l.landmark} ${l.locality} ${l.ownerName}`.toLowerCase();
    for (const token of s.q
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1))
      if (!hay.includes(token)) return false;
  }
  return true;
}

/** Best match, as published on "How results are ordered": fit, completeness, freshness, checks, replies. */
export function bestScore(l: Listing, s: SearchState, now: number): number {
  let score = l.quality;
  if (l.freshOn !== null) score += Math.max(0, 10 - Math.floor((now - l.freshOn) / (3 * DAY)));
  if (l.ownerVerified) score += 5;
  if (l.verifiedLocation) score += 3;
  if (l.permitValid) score += 3;
  if (l.ownerReplyHours !== null && l.ownerReplyHours < 24) score += 5;
  if (s.q) {
    const title = `${l.title} ${l.road}`.toLowerCase();
    for (const token of s.q
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1))
      if (title.includes(token)) score += 6;
  }
  if (l.bookedUntil !== null && l.bookedUntil > now) score -= 8;
  return score;
}

export function sortListings(items: Listing[], s: SearchState, now: number): Listing[] {
  const byBest = (a: Listing, b: Listing) =>
    bestScore(b, s, now) - bestScore(a, s, now) || b.createdAt - a.createdAt || a.id - b.id;
  const out = [...items];
  switch (s.sort) {
    case "price":
      // Sites that show no price cannot be placed by price, so they follow the priced ones.
      return out.sort((a, b) => (a.rate ?? Infinity) - (b.rate ?? Infinity) || byBest(a, b));
    case "newest":
      return out.sort((a, b) => b.createdAt - a.createdAt || byBest(a, b));
    case "confirmed":
      return out.sort((a, b) => (b.confirmedOn ?? 0) - (a.confirmedOn ?? 0) || byBest(a, b));
    case "audience":
      return out.sort((a, b) => (b.audience ?? -1) - (a.audience ?? -1) || byBest(a, b));
    default:
      return out.sort(byBest);
  }
}

export interface Option {
  slug: string;
  label: string;
  count: number;
}

export interface Facets {
  cities: Option[];
  localities: Option[];
  formats: Option[];
  types: Option[];
  lighting: Option[];
  trust: Option[];
  priced: number;
}

/** For every option, how many sites the search would hold if that option were chosen. */
export function facetCounts(all: Listing[], s: SearchState, now: number): Facets {
  const count = (skip: Facet, test: (l: Listing) => boolean) =>
    all.reduce((n, l) => (matches(l, s, now, skip) && test(l) ? n + 1 : n), 0);
  const localities = new Map<string, Option>();
  if (s.city) {
    for (const l of all) {
      if (!matches(l, s, now, "locality")) continue;
      const entry = localities.get(l.localitySlug) ?? {
        slug: l.localitySlug,
        label: l.locality,
        count: 0,
      };
      entry.count += 1;
      localities.set(l.localitySlug, entry);
    }
  }
  return {
    cities: CITIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      count: count("city", (l) => l.city === c.slug),
    })),
    localities: [...localities.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    ),
    formats: FORMATS.map((f) => ({
      slug: f.slug,
      label: f.plural,
      count: count("format", (l) => l.format === f.slug),
    })),
    types: [
      { slug: "static", label: "Static", count: count("type", (l) => !l.isDigital) },
      { slug: "digital", label: "Digital", count: count("type", (l) => l.isDigital) },
    ],
    lighting: LIGHTING.map((x) => ({
      slug: x.slug,
      label: x.label,
      count: count("lighting", (l) => l.lighting === x.slug),
    })),
    trust: TRUST.map((t) => ({
      slug: t.key,
      label: t.label,
      count: all.reduce((n, l) => (matches(l, s, now) && hasTrust(l, t.key, now) ? n + 1 : n), 0),
    })),
    priced: count("priced", (l) => l.priceShown),
  };
}

export interface Wider {
  label: string;
  url: string;
  add: number;
}

/** When a search is thin: single changes that would widen it, each with how many sites it adds. */
export function widen(all: Listing[], s: SearchState, now: number, current: number): Wider[] {
  const total = (next: SearchState) => all.reduce((n, l) => (matches(l, next, now) ? n + 1 : n), 0);
  const tries: { label: string; next: SearchState }[] = [];
  const base: SearchState = { ...s, page: 1, panel: false };
  if (s.max) tries.push({ label: "Remove the price limit", next: without(base, "max", "min") });
  if (s.size) tries.push({ label: "Any size", next: without(base, "size") });
  if (s.localities.length)
    tries.push({
      label: `All of ${CITIES.find((c) => c.slug === s.city)?.label ?? "the city"}`,
      next: { ...base, localities: [] },
    });
  if (s.formats.length) tries.push({ label: "Any format", next: { ...base, formats: [] } });
  if (s.lighting.length) tries.push({ label: "Any lighting", next: { ...base, lighting: [] } });
  if (s.from) tries.push({ label: "Any dates", next: without(base, "from", "to") });
  if (s.trust.length)
    tries.push({ label: "Without the trust filters", next: { ...base, trust: [] } });
  if (s.priced)
    tries.push({ label: "Include sites with price on request", next: { ...base, priced: false } });
  if (s.q) tries.push({ label: `Without “${s.q}”`, next: { ...base, q: "" } });
  if (s.city) tries.push({ label: "Every city", next: without(base, "city", "localities") });
  return tries
    .map((t) => ({ label: t.label, url: toUrl(t.next), add: total(t.next) - current }))
    .filter((w) => w.add > 0)
    .sort((a, b) => a.add - b.add)
    .slice(0, 4);
}

/** The middle rate of sites that show an exact price. Null unless there are enough real ones to be honest. */
export function medianRate(items: Listing[]): { rate: number; n: number } | null {
  const rates = items
    .filter((l) => !l.sample && l.priceShown && l.rate !== null)
    .map((l) => l.rate as number)
    .sort((a, b) => a - b);
  if (rates.length < 5) return null;
  const mid = Math.floor(rates.length / 2);
  return {
    rate:
      rates.length % 2
        ? (rates[mid] as number)
        : ((rates[mid - 1] as number) + (rates[mid] as number)) / 2,
    n: rates.length,
  };
}

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
