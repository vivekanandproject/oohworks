import { CITIES, CITY_CENTRE, type CitySlug } from "@/lib/sites/taxonomy";
import { WORLD_CITIES } from "./cities";

/**
 * Finding a place anywhere in the world, for the forms that ask where something is.
 *
 * Three services can answer, and the page never knows which did:
 *   google  Google Places, when GOOGLE_MAPS_API_KEY is set. This is the one meant for real use.
 *   photon  The open geocoder built on OpenStreetMap, with no key. It stands in during development.
 *   local   The short list of cities held in the code, for a machine with no key and no network.
 * If the chosen one fails, the local list answers, so the field is never dead.
 */
export type Provider = "google" | "photon" | "local";
/** A company gives the city it is based in. A site is found by any address or landmark. */
export type Scope = "city" | "any";

export interface Suggestion {
  /** Opaque. Handed back to `placeDetail` when the visitor picks this one. */
  id: string;
  label: string;
  /** What tells this place from others of the same name: region and country. */
  detail: string;
}

export interface Place {
  id: string;
  /** How the place is written out in full, as the visitor chose it. */
  label: string;
  locality: string | null;
  region: string | null;
  country: string | null;
  /** ISO 3166-1 alpha-2, upper case. */
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
}

export function provider(): Provider {
  const asked = process.env.PLACES_PROVIDER;
  if (asked === "google" || asked === "photon" || asked === "local") return asked;
  if (process.env.GOOGLE_MAPS_API_KEY) return "google";
  // The open service is a courtesy with no promise behind it, so it is used only while developing.
  return process.env.NODE_ENV === "production" ? "local" : "photon";
}

const TIMEOUT_MS = 4000;
async function getJson(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`place search answered ${res.status}`);
  return res.json();
}
const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const join = (...parts: (string | null | undefined)[]): string =>
  [...new Set(parts.map((p) => (p ?? "").trim()).filter(Boolean))].join(", ");
/** What follows a place's name. A region that only repeats the name, as Dubai's does, is left out. */
const after = (name: string, ...parts: (string | null | undefined)[]): string =>
  join(...parts.filter((p) => (p ?? "").trim() !== name));
const b64 = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url");

/* The list in the code ------------------------------------------------------------------------------ */

const fold = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function localSearch(q: string): Suggestion[] {
  const want = fold(q);
  const starts: Suggestion[] = [];
  const holds: Suggestion[] = [];
  WORLD_CITIES.forEach((row, i) => {
    const name = fold(row[0]);
    const hit = { id: `l:${i}`, label: row[0], detail: after(row[0], row[1], row[2]) };
    if (name.startsWith(want)) starts.push(hit);
    else if (name.includes(want) || fold(row[2]).startsWith(want)) holds.push(hit);
  });
  return [...starts, ...holds].slice(0, 6);
}

function localDetail(id: string): Place | null {
  const row = WORLD_CITIES[Number(id.slice(2))];
  if (!row) return null;
  return {
    id,
    label: join(row[0], after(row[0], row[1], row[2])),
    locality: row[0],
    region: row[1] || null,
    country: row[2],
    countryCode: row[3],
    lat: row[4],
    lng: row[5],
  };
}

/* Photon ---------------------------------------------------------------------------------------------- */

interface PhotonFeature {
  geometry?: { coordinates?: unknown[] };
  properties?: Record<string, unknown>;
}

async function photonSearch(q: string, scope: Scope): Promise<Suggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  if (scope === "city")
    for (const layer of ["city", "locality", "district"]) url.searchParams.append("layer", layer);
  const data = (await getJson(url.toString(), {
    headers: { "user-agent": "oohworks.co place search (development)" },
  })) as { features?: PhotonFeature[] };
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    const name = text(p.name) || text(p.street);
    const [lng, lat] = (f.geometry?.coordinates ?? []) as unknown[];
    if (!name || num(lat) === null || num(lng) === null) continue;
    const town = text(p.city) || text(p.county);
    const detail = after(name, scope === "any" ? town : null, text(p.state), text(p.country));
    const key = `${name}|${detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const place: Place = {
      id: "",
      label: join(name, detail),
      locality: scope === "city" ? name : town || name,
      region: text(p.state) || null,
      country: text(p.country) || null,
      countryCode: text(p.countrycode).toUpperCase() || null,
      lat: num(lat),
      lng: num(lng),
    };
    // Everything known comes with the search, so it rides in the id and no second question is asked.
    out.push({ id: `p:${b64(place)}`, label: name, detail });
    if (out.length === 6) break;
  }
  return out;
}

function carried(id: string): Place | null {
  try {
    const v = JSON.parse(Buffer.from(id.slice(2), "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    const lat = num(v.lat);
    const lng = num(v.lng);
    const label = text(v.label).slice(0, 160);
    if (!label) return null;
    return {
      id,
      label,
      locality: text(v.locality).slice(0, 80) || null,
      region: text(v.region).slice(0, 80) || null,
      country: text(v.country).slice(0, 80) || null,
      countryCode: /^[A-Z]{2}$/.test(text(v.countryCode)) ? text(v.countryCode) : null,
      lat: lat !== null && Math.abs(lat) <= 90 ? lat : null,
      lng: lng !== null && Math.abs(lng) <= 180 ? lng : null,
    };
  } catch {
    return null;
  }
}

/* Google ---------------------------------------------------------------------------------------------- */

const GOOGLE = "https://places.googleapis.com/v1";
const googleKey = (): string => process.env.GOOGLE_MAPS_API_KEY ?? "";

async function googleSearch(q: string, scope: Scope, session: string): Promise<Suggestion[]> {
  const data = (await getJson(`${GOOGLE}/places:autocomplete`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": googleKey() },
    body: JSON.stringify({
      input: q,
      languageCode: "en",
      ...(session ? { sessionToken: session } : {}),
      ...(scope === "city" ? { includedPrimaryTypes: ["(cities)"] } : {}),
    }),
  })) as {
    suggestions?: {
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      };
    }[];
  };
  const out: Suggestion[] = [];
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction;
    const id = text(p?.placeId);
    const label = text(p?.structuredFormat?.mainText?.text) || text(p?.text?.text);
    if (!id || !label) continue;
    out.push({ id: `g:${id}`, label, detail: text(p?.structuredFormat?.secondaryText?.text) });
    if (out.length === 6) break;
  }
  return out;
}

async function googleDetail(id: string, session: string): Promise<Place | null> {
  const placeId = id.slice(2);
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) return null;
  const url = new URL(`${GOOGLE}/places/${placeId}`);
  url.searchParams.set("languageCode", "en");
  if (session) url.searchParams.set("sessionToken", session);
  const data = (await getJson(url.toString(), {
    headers: {
      "x-goog-api-key": googleKey(),
      "x-goog-fieldmask": "id,displayName,formattedAddress,location,addressComponents",
    },
  })) as {
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
  };
  const part = (...types: string[]) =>
    (data.addressComponents ?? []).find((c) => types.some((t) => c.types?.includes(t)));
  const country = part("country");
  return {
    id,
    label: text(data.formattedAddress) || text(data.displayName?.text),
    locality:
      text(part("locality", "postal_town", "administrative_area_level_3")?.longText) ||
      text(data.displayName?.text) ||
      null,
    region: text(part("administrative_area_level_1")?.longText) || null,
    country: text(country?.longText) || null,
    countryCode: /^[A-Z]{2}$/.test(text(country?.shortText)) ? text(country?.shortText) : null,
    lat: num(data.location?.latitude),
    lng: num(data.location?.longitude),
  };
}

/* What the pages ask ------------------------------------------------------------------------------------ */

const cache = new Map<string, { at: number; value: Suggestion[] }>();
const CACHE_MS = 5 * 60_000;

/** Up to six places matching what was typed, and which service answered. */
export async function searchPlaces(
  typed: string,
  scope: Scope,
  session: string,
): Promise<{ provider: Provider; suggestions: Suggestion[] }> {
  const q = typed.trim().replace(/\s+/g, " ").slice(0, 80);
  if (q.length < 2) return { provider: provider(), suggestions: [] };
  const which = provider();
  try {
    if (which === "google")
      return { provider: which, suggestions: await googleSearch(q, scope, session) };
    if (which === "photon") {
      // The open service asks to be used gently, so the same words are not sent twice in five minutes.
      const key = `${scope}|${q.toLowerCase()}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return { provider: which, suggestions: hit.value };
      // The open service ranks a hamlet called "Dub" above Dubai. For cities, the large ones that
      // start with what was typed are put first, and its own finds follow.
      const known = scope === "city" ? localSearch(q).slice(0, 3) : [];
      const taken = new Set(known.map((k) => `${k.label}|${k.detail.split(", ").pop()}`));
      const value = [
        ...known,
        ...(await photonSearch(q, scope)).filter(
          (f) => !taken.has(`${f.label}|${f.detail.split(", ").pop()}`),
        ),
      ].slice(0, 6);
      if (cache.size > 500) cache.clear();
      cache.set(key, { at: Date.now(), value });
      return { provider: which, suggestions: value };
    }
  } catch {
    // Fall through to the list in the code.
  }
  return { provider: "local", suggestions: localSearch(q) };
}

/** Everything known about a suggestion the visitor picked. */
export async function placeDetail(id: string, session: string): Promise<Place | null> {
  if (id.startsWith("l:")) return localDetail(id);
  if (id.startsWith("p:")) return carried(id);
  if (id.startsWith("g:") && googleKey()) {
    try {
      return await googleDetail(id, session);
    } catch {
      return null;
    }
  }
  return null;
}

/* The launch cities --------------------------------------------------------------------------------- */

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Which of the cities OOHWORKS has hubs for a place belongs to, if any. A position within 60 km of
 * a city's centre counts, which takes in Gurugram and Noida for Delhi NCR. With no position, the
 * name is tried instead.
 */
export function launchCity(place: {
  label: string;
  lat?: number | null;
  lng?: number | null;
}): CitySlug | null {
  if (typeof place.lat === "number" && typeof place.lng === "number") {
    let best: { slug: CitySlug; d: number } | null = null;
    for (const c of CITIES) {
      const [lng, lat] = CITY_CENTRE[c.slug];
      const d = km({ lat: place.lat, lng: place.lng }, { lat, lng });
      if (d <= 60 && (!best || d < best.d)) best = { slug: c.slug, d };
    }
    return best?.slug ?? null;
  }
  const first = fold(place.label.split(",")[0] ?? "").trim();
  const alias: Record<string, CitySlug> = {
    bangalore: "bengaluru",
    bombay: "mumbai",
    delhi: "delhi-ncr",
    "new delhi": "delhi-ncr",
    gurgaon: "delhi-ncr",
    gurugram: "delhi-ncr",
    noida: "delhi-ncr",
    madras: "chennai",
    poona: "pune",
  };
  return CITIES.find((c) => fold(c.label) === first)?.slug ?? alias[first] ?? null;
}
