/**
 * Deterministic query understanding for the search page. It recognises the launch cities, the six
 * formats, a size like 20x10, a budget like "under 1 lakh" and lighting, and returns what it
 * understood so the page can show it back as chips. The Typesense and Claude-backed search lands
 * later and uses the same shape.
 */
export interface Facets {
  city?: string;
  format?: string;
  size?: { w: number; h: number };
  budget?: number;
  lighting?: string;
  area?: string;
}

export const CITY_OPTIONS = [
  { slug: "bengaluru", label: "Bengaluru", names: ["bengaluru", "bangalore", "blr"] },
  { slug: "mumbai", label: "Mumbai", names: ["mumbai", "bombay"] },
  {
    slug: "delhi-ncr",
    label: "Delhi NCR",
    names: ["delhi", "new delhi", "gurugram", "gurgaon", "noida", "ncr"],
  },
  { slug: "hyderabad", label: "Hyderabad", names: ["hyderabad", "secunderabad"] },
  { slug: "pune", label: "Pune", names: ["pune"] },
  { slug: "chennai", label: "Chennai", names: ["chennai", "madras"] },
] as const;

export const FORMAT_OPTIONS = [
  {
    slug: "hoarding",
    label: "Hoardings",
    names: ["hoarding", "hoardings", "billboard", "billboards", "bulletin"],
  },
  { slug: "unipole", label: "Unipoles", names: ["unipole", "unipoles"] },
  { slug: "gantry", label: "Gantries", names: ["gantry", "gantries", "overhead"] },
  {
    slug: "bus-shelter",
    label: "Bus shelters",
    names: ["bus shelter", "bus shelters", "bus stop", "shelter"],
  },
  {
    slug: "led-screen",
    label: "LED screens",
    names: ["led", "led screen", "led screens", "digital", "screen", "screens", "dooh"],
  },
  {
    slug: "transit",
    label: "Transit",
    names: ["transit", "metro", "airport", "railway", "train", "bus"],
  },
] as const;

const LIGHTING = ["front-lit", "back-lit", "backlit", "frontlit", "lit", "non-lit", "unlit"];

function findOption<T extends { slug: string; names: readonly string[] }>(
  options: readonly T[],
  text: string,
): { option: T; match: string } | undefined {
  for (const option of options) {
    for (const name of [...option.names].sort((a, b) => b.length - a.length)) {
      const re = new RegExp(
        `(^|[^a-z])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`,
        "i",
      );
      const m = re.exec(text);
      if (m) return { option, match: name };
    }
  }
  return undefined;
}

export function parseQuery(raw: string): { facets: Facets; rest: string } {
  const text = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const facets: Facets = {};
  let rest = text;

  const city = findOption(CITY_OPTIONS, rest);
  if (city) {
    facets.city = city.option.slug;
    rest = rest.replace(new RegExp(`\\b${city.match}\\b`, "i"), " ");
  }
  const format = findOption(FORMAT_OPTIONS, rest);
  if (format) {
    facets.format = format.option.slug;
    rest = rest.replace(new RegExp(`\\b${format.match}\\b`, "i"), " ");
  }
  const size = /(\d{1,3})\s*[x×*]\s*(\d{1,3})\s*(ft|feet)?/i.exec(rest);
  if (size) {
    facets.size = { w: Number(size[1]), h: Number(size[2]) };
    rest = rest.replace(size[0], " ");
  }
  const budget =
    /(?:under|below|upto|up to|less than|max)\s*(?:₹|rs\.?|inr)?\s*([\d.,]+)\s*(lakh|lakhs|lac|l|k|crore|cr)?(?:\s*(?:a|per|\/)\s*month)?/i.exec(
      rest,
    );
  if (budget) {
    const n = Number(budget[1]!.replace(/,/g, ""));
    const unit = (budget[2] ?? "").toLowerCase();
    const mult = unit.startsWith("l")
      ? 100000
      : unit === "k"
        ? 1000
        : unit.startsWith("cr")
          ? 10000000
          : 1;
    if (!Number.isNaN(n)) facets.budget = Math.round(n * mult);
    rest = rest.replace(budget[0], " ");
  }
  for (const l of LIGHTING) {
    const re = new RegExp(`\\b${l}\\b`, "i");
    if (re.test(rest)) {
      facets.lighting = l.replace("backlit", "back-lit").replace("frontlit", "front-lit");
      rest = rest.replace(re, " ");
      break;
    }
  }
  const area = /(?:near|on|at|around|along|in)\s+([a-z0-9][a-z0-9 .'-]{2,40})/i.exec(rest);
  if (area) {
    const place = area[1]!.trim().replace(/\s+(?:in|near|on|at)$/, "");
    if (place.length > 2) facets.area = place;
    rest = rest.replace(area[0], " ");
  }
  rest = rest
    .replace(
      /\b(in|near|on|at|around|along|for|the|a|an|and|with|sites?|ads?|advertising)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  return { facets, rest };
}

export function cityLabel(slug: string | undefined): string | undefined {
  return CITY_OPTIONS.find((c) => c.slug === slug)?.label;
}
export function formatLabel(slug: string | undefined): string | undefined {
  return FORMAT_OPTIONS.find((f) => f.slug === slug)?.label;
}

export function formatBudget(n: number): string {
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(n % 10000000 ? 1 : 0)} crore`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(n % 100000 ? 1 : 0)} lakh`;
  return `₹ ${n.toLocaleString("en-IN")}`;
}

/** Builds a search URL with the fixed parameter order q, city, format. */
export function searchUrl(params: {
  q?: string | undefined;
  city?: string | undefined;
  format?: string | undefined;
  followed?: string | undefined;
  follow?: string | undefined;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.city) sp.set("city", params.city);
  if (params.format) sp.set("format", params.format);
  if (params.followed) sp.set("followed", params.followed);
  if (params.follow) sp.set("follow", params.follow);
  const qs = sp.toString();
  return `/search/${qs ? `?${qs}` : ""}`;
}
