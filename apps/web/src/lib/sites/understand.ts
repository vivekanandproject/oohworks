import { anthropicHeaders } from "@/lib/anthropic";
import { parseQuery } from "@/lib/search-parse";
import { readState, type RawParams, type ReadResult } from "./state";
import { CITIES, FORMATS, LIGHTING, TRUST, type TrustKey } from "./taxonomy";

/**
 * A second reading of what a buyer typed, by Claude, for the words the built-in rules could not place:
 * "big screens near the airport road for Diwali under 2 lakhs". It only ever fills in filters from the
 * fixed vocabulary of this site, which the page then shows back as removable chips. Nothing Claude
 * writes reaches the page: every value is checked against the taxonomy, and a place name is kept only
 * if the buyer typed those words. It runs only when ANTHROPIC_API_KEY is set, and the search works
 * exactly as before without it.
 */
export interface Understood {
  city?: string;
  formats?: string[];
  lighting?: string[];
  type?: "static" | "digital";
  size?: { w: number; h: number };
  min?: number;
  max?: number;
  from?: string;
  to?: string;
  trust?: TrustKey[];
  /** A road, landmark or neighbourhood, in the buyer's own words. */
  area?: string;
}

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 2500;
const DAY = 24 * 3600 * 1000;

export function understandingOn(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    city: {
      type: ["string", "null"],
      enum: [...CITIES.map((c) => c.slug), null],
      description: "The city, only if the query names it or a place plainly inside it.",
    },
    formats: { type: "array", items: { type: "string", enum: FORMATS.map((f) => f.slug) } },
    lighting: { type: "array", items: { type: "string", enum: LIGHTING.map((l) => l.slug) } },
    type: { type: ["string", "null"], enum: ["static", "digital", null] },
    size_w_ft: { type: ["number", "null"], description: "Width in feet, only if a size is given." },
    size_h_ft: {
      type: ["number", "null"],
      description: "Height in feet, only if a size is given.",
    },
    min_rate: {
      type: ["number", "null"],
      description: "Lowest monthly rate in rupees, as a full number.",
    },
    max_rate: {
      type: ["number", "null"],
      description: "Highest monthly rate in rupees, as a full number. 2 lakh is 200000.",
    },
    from: {
      type: ["string", "null"],
      description: "Start date as YYYY-MM-DD, only if the query gives a date or a named period.",
    },
    to: { type: ["string", "null"], description: "End date as YYYY-MM-DD." },
    trust: {
      type: "array",
      items: { type: "string", enum: TRUST.map((t) => t.key) },
      description:
        "owner = verified owner, location = verified location, permit = permit on file, fresh = updated lately, responsive = replies fast.",
    },
    area: {
      type: ["string", "null"],
      description:
        "A road, landmark or neighbourhood, copied word for word from the query. Null if none.",
    },
  },
  required: ["formats", "lighting", "trust"],
} as const;

const SYSTEM = (today: string): string =>
  [
    "You turn one search typed by a buyer of outdoor advertising space in India into filters, by calling set_filters once.",
    "Fill in only what the query states. Leave everything else null or empty. Never guess a city, a price or a date.",
    "A hoarding is a billboard. A unipole is a single-pole billboard. LED, digital screen and DOOH mean the format led-screen.",
    "Copy any road, landmark or neighbourhood into `area` using the buyer's own words, unchanged.",
    `Today is ${today}. A named month or festival means its next occurrence.`,
  ].join(" ");

const words = (text: string): string[] => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/**
 * Keeps only what can be trusted from a model's answer: values from this site's own lists, sane
 * numbers, real dates that are not in the past, and a place made only of words the buyer typed.
 */
export function checkUnderstood(raw: unknown, text: string, today: string): Understood {
  const out: Understood = {};
  if (typeof raw !== "object" || raw === null) return out;
  const r = raw as Record<string, unknown>;
  const pick = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
    Array.isArray(value)
      ? [...new Set(value)].filter(
          (v): v is T => typeof v === "string" && (allowed as readonly string[]).includes(v),
        )
      : [];
  const num = (v: unknown, lo: number, hi: number): number | undefined =>
    typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : undefined;
  const date = (v: unknown): string | undefined => {
    if (
      typeof v !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      Number.isNaN(new Date(v).getTime())
    )
      return undefined;
    return v >= today && new Date(v).getTime() - new Date(today).getTime() <= 730 * DAY
      ? v
      : undefined;
  };

  if (typeof r.city === "string" && CITIES.some((c) => c.slug === r.city)) out.city = r.city;
  const formats = pick(
    r.formats,
    FORMATS.map((f) => f.slug),
  );
  if (formats.length) out.formats = formats;
  const lighting = pick(
    r.lighting,
    LIGHTING.map((l) => l.slug),
  );
  if (lighting.length) out.lighting = lighting;
  if (r.type === "static" || r.type === "digital") out.type = r.type;
  const w = num(r.size_w_ft, 1, 300);
  const h = num(r.size_h_ft, 1, 300);
  if (w && h) out.size = { w, h };
  const min = num(r.min_rate, 1000, 1e9);
  const max = num(r.max_rate, 1000, 1e9);
  if (min && (!max || min <= max)) out.min = min;
  if (max) out.max = max;
  const from = date(r.from);
  const to = date(r.to);
  if (from) out.from = from;
  if (from && to && to >= from) out.to = to;
  const trust = pick(
    r.trust,
    TRUST.map((t) => t.key),
  );
  if (trust.length) out.trust = trust;
  if (typeof r.area === "string") {
    const area = r.area.trim().replace(/\s+/g, " ").slice(0, 60);
    const typed = new Set(words(text));
    const areaWords = words(area);
    if (areaWords.length > 0 && areaWords.every((x) => typed.has(x))) out.area = area.toLowerCase();
  }
  return out;
}

const cache = new Map<string, Understood | null>();
const CACHE_MAX = 500;

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/** Asks Claude to read one query. Null when it is switched off, slow, or answers with nothing usable. */
export async function understand(
  text: string,
  today: string,
  fetcher: Fetcher = fetch,
): Promise<Understood | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  const query = text.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!key || query.length < 3) return null;
  const cacheKey = `${today}|${query.toLowerCase()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;
  let result: Understood | null = null;
  try {
    const res = await fetcher(ENDPOINT, {
      method: "POST",
      headers: { ...anthropicHeaders(key), "content-type": "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 400,
        system: SYSTEM(today),
        tools: [
          {
            name: "set_filters",
            description: "Record the filters the buyer's query states.",
            input_schema: SCHEMA,
          },
        ],
        tool_choice: { type: "tool", name: "set_filters" },
        messages: [{ role: "user", content: query }],
      }),
    });
    if (res.ok) {
      const body = (await res.json()) as {
        content?: { type?: string; name?: string; input?: unknown }[];
      };
      const call = body.content?.find((b) => b.type === "tool_use" && b.name === "set_filters");
      const checked = checkUnderstood(call?.input, query, today);
      result = Object.keys(checked).length ? checked : null;
    } else {
      // A refused or failed call is not remembered, so the next search tries again.
      return null;
    }
  } catch {
    return null;
  }
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(cacheKey, result);
  return result;
}

/** For tests. */
export function forgetUnderstood(): void {
  cache.clear();
}

/**
 * The search state, with Claude's reading added where the buyer's own filters and the built-in rules
 * left a gap. An explicit filter always wins, then the rules, then Claude.
 */
export async function readStateSmart(
  raw: RawParams,
  today: string,
  fetcher: Fetcher = fetch,
): Promise<ReadResult> {
  const base = readState(raw);
  if (!understandingOn() || !base.typed) return base;
  // Only worth asking when the rules left words they could not place.
  if (parseQuery(base.typed).rest.length < 3) return base;
  const u = await understand(base.typed, today, fetcher);
  if (!u) return base;
  const s = { ...base.state };
  let used = false;
  const fill = <K extends keyof typeof s>(
    k: K,
    value: (typeof s)[K] | undefined,
    empty: boolean,
  ) => {
    if (value === undefined || !empty) return;
    s[k] = value;
    used = true;
  };
  fill("city", u.city, !s.city && !s.bbox);
  fill("formats", u.formats, s.formats.length === 0);
  fill("lighting", u.lighting, s.lighting.length === 0);
  fill("type", u.type, !s.type);
  fill("size", u.size, !s.size);
  fill("min", u.min, !s.min);
  fill("max", u.max, !s.max);
  fill("from", u.from, !s.from);
  fill("to", u.to, !s.to && Boolean(s.from ?? u.from));
  fill("trust", u.trust, s.trust.length === 0);
  // Words Claude placed are no longer loose text to match against. What it names as a place stays.
  if (used || u.area) {
    s.q = u.area ?? "";
    used = true;
  }
  return used ? { state: s, typed: base.typed, understood: true } : base;
}
