import { parseQuery } from "@/lib/search-parse";
import { CITIES, FORMATS, LIGHTING, SORTS, TRUST, type SortKey, type TrustKey } from "./taxonomy";

/** Everything a search can be narrowed by. The address bar carries exactly this, in a fixed order. */
export interface SearchState {
  /** Free text left over after the place, format, size and budget were understood. */
  q: string;
  city?: string;
  localities: string[];
  formats: string[];
  type?: "static" | "digital";
  size?: { w: number; h: number };
  lighting: string[];
  min?: number;
  max?: number;
  priced: boolean;
  from?: string;
  to?: string;
  trust: TrustKey[];
  owner?: string;
  sort: SortKey;
  page: number;
  map: boolean;
  panel: boolean;
}

export type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim();
const list = (v: string | string[] | undefined): string[] =>
  one(v)
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
const among = <T extends string>(values: string[], allowed: readonly T[]): T[] =>
  [...new Set(values)].filter((v): v is T => (allowed as readonly string[]).includes(v));
const money = (v: string | string[] | undefined): number | undefined => {
  const n = Number(one(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 1e10 ? Math.round(n) : undefined;
};
const date = (v: string | string[] | undefined): string | undefined => {
  const s = one(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime()) ? s : undefined;
};
const slugish = (v: string): string =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 60);

export interface ReadResult {
  state: SearchState;
  /** What the visitor typed, shown back in the search box. */
  typed: string;
  /** True when part of the state came from understanding the typed text. */
  understood: boolean;
}

/**
 * Reads the address into a state. Explicit filters win; what the typed query implies fills the gaps,
 * so "20x10 hoardings in Bengaluru under 1 lakh" narrows the search without touching a filter.
 */
export function readState(raw: RawParams): ReadResult {
  const typed = one(raw.q).slice(0, 200);
  const parsed = parseQuery(typed);
  const f = parsed.facets;

  const cities = CITIES.map((c) => c.slug) as readonly string[];
  const explicitCity = cities.includes(one(raw.city).toLowerCase())
    ? one(raw.city).toLowerCase()
    : undefined;
  const explicitFormats = among(
    list(raw.format),
    FORMATS.map((x) => x.slug),
  );
  const sizeMatch = /^(\d{1,3}(?:\.\d)?)x(\d{1,3}(?:\.\d)?)$/.exec(one(raw.size).toLowerCase());
  const explicitSize = sizeMatch ? { w: Number(sizeMatch[1]), h: Number(sizeMatch[2]) } : undefined;
  const explicitLighting = among(
    list(raw.lit),
    LIGHTING.map((x) => x.slug),
  );
  const explicitMax = money(raw.max);
  const type = one(raw.type);
  const sort = one(raw.sort) as SortKey;
  const page = Number(one(raw.page));

  const state: SearchState = {
    q: (f.area ?? parsed.rest ?? "").slice(0, 120),
    localities: list(raw.locality).map(slugish).filter(Boolean),
    formats: explicitFormats.length ? explicitFormats : f.format ? [f.format] : [],
    lighting: explicitLighting.length
      ? explicitLighting
      : f.lighting && (LIGHTING.map((x) => x.slug) as readonly string[]).includes(f.lighting)
        ? [f.lighting]
        : [],
    priced: one(raw.priced) === "1",
    trust: among(
      list(raw.trust),
      TRUST.map((x) => x.key),
    ),
    sort: SORTS.some((s) => s.key === sort) ? sort : "best",
    page: Number.isInteger(page) && page > 0 && page < 1000 ? page : 1,
    map: one(raw.map) !== "0",
    panel: one(raw.filters) === "1",
  };
  const city = explicitCity ?? f.city;
  if (city) state.city = city;
  if (type === "static" || type === "digital") state.type = type;
  const size = explicitSize ?? f.size;
  if (size) state.size = size;
  const min = money(raw.min);
  if (min) state.min = min;
  const max = explicitMax ?? f.budget;
  if (max) state.max = max;
  const from = date(raw.from);
  if (from) state.from = from;
  const to = date(raw.to);
  if (to) state.to = to;
  const owner = slugish(one(raw.owner));
  if (owner) state.owner = owner;
  if (!state.city) state.localities = [];

  const understood = Boolean(f.city || f.format || f.size || f.budget || f.lighting || f.area);
  return { state, typed, understood };
}

/** The address for a state. Parameters always appear in this order, and defaults are left out. */
export function toUrl(state: SearchState, change: Partial<SearchState> = {}): string {
  const s = { ...state, ...change };
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.city) p.set("city", s.city);
  if (s.city && s.localities.length) p.set("locality", [...s.localities].sort().join(","));
  if (s.formats.length) p.set("format", [...s.formats].sort().join(","));
  if (s.type) p.set("type", s.type);
  if (s.size) p.set("size", `${s.size.w}x${s.size.h}`);
  if (s.lighting.length) p.set("lit", [...s.lighting].sort().join(","));
  if (s.min) p.set("min", String(s.min));
  if (s.max) p.set("max", String(s.max));
  if (s.priced) p.set("priced", "1");
  if (s.from) p.set("from", s.from);
  if (s.to) p.set("to", s.to);
  if (s.trust.length) p.set("trust", [...s.trust].sort().join(","));
  if (s.owner) p.set("owner", s.owner);
  if (s.sort !== "best") p.set("sort", s.sort);
  if (s.page > 1) p.set("page", String(s.page));
  if (!s.map) p.set("map", "0");
  if (s.panel) p.set("filters", "1");
  const qs = p.toString().replace(/%2C/g, ",");
  return `/search/${qs ? `?${qs}` : ""}`;
}

/** Adds a value to a list filter, or takes it out if it is there. */
export function toggle<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** How many filters narrow the search, for the "All filters" count. */
export function activeCount(s: SearchState): number {
  return (
    (s.city ? 1 : 0) +
    s.localities.length +
    s.formats.length +
    (s.type ? 1 : 0) +
    (s.size ? 1 : 0) +
    s.lighting.length +
    (s.min || s.max ? 1 : 0) +
    (s.priced ? 1 : 0) +
    (s.from || s.to ? 1 : 0) +
    s.trust.length +
    (s.owner ? 1 : 0)
  );
}

/** A change to the filters always returns to the first page. */
export const firstPage = { page: 1 } as const;

/** A copy of the state with some filters taken out entirely. */
export function without(state: SearchState, ...keys: (keyof SearchState)[]): SearchState {
  const next: Partial<SearchState> = { ...state };
  for (const key of keys) delete next[key];
  return {
    ...next,
    q: next.q ?? "",
    localities: next.localities ?? [],
    formats: next.formats ?? [],
    lighting: next.lighting ?? [],
    trust: next.trust ?? [],
    priced: next.priced ?? false,
    sort: next.sort ?? "best",
    page: next.page ?? 1,
    map: next.map ?? true,
    panel: next.panel ?? false,
  };
}
