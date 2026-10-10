import type { Listing } from "./filter";
import { CITIES, FORMATS, cityDef, formatDef, type CitySlug, type FormatSlug } from "./taxonomy";
import { inr } from "./view";

/**
 * Hubs are the pages meant to rank for a place: a city, an area of it, or one format in a city.
 * A hub is published only when it holds enough indexable sites to be worth landing on. Below that
 * its address answers "not found", so a thin page never reaches a search engine.
 */
export const HUB_MIN = { city: 25, format: 25, locality: 10 } as const;

export type Hub =
  | { kind: "city"; city: CitySlug }
  | { kind: "locality"; city: CitySlug; locality: string }
  | { kind: "format"; city: CitySlug; format: FormatSlug };

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "hoardings", "bus-shelters", "led-screens": how a format appears in a hub's address. */
export const FORMAT_SEGMENTS = FORMATS.map((f) => ({ format: f.slug, segment: slug(f.plural) }));
export const formatSegment = (format: string): string =>
  FORMAT_SEGMENTS.find((x) => x.format === format)?.segment ?? format;

/** The hub an address names, or null when it names none. Only India is open. */
export function readHub(country: string, city: string, segment?: string): Hub | null {
  if (country !== "in") return null;
  const known = CITIES.find((c) => c.slug === city);
  if (!known) return null;
  if (segment === undefined) return { kind: "city", city: known.slug };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment)) return null;
  const format = FORMAT_SEGMENTS.find((x) => x.segment === segment);
  return format
    ? { kind: "format", city: known.slug, format: format.format }
    : { kind: "locality", city: known.slug, locality: segment };
}

export function hubPath(hub: Hub, page = 1): string {
  const base =
    hub.kind === "city"
      ? `/in/${hub.city}/`
      : hub.kind === "locality"
        ? `/in/${hub.city}/${hub.locality}/`
        : `/in/${hub.city}/${formatSegment(hub.format)}/`;
  return page > 1 ? `${base}page/${page}/` : base;
}

export function inHub(l: Pick<Listing, "city" | "localitySlug" | "format">, hub: Hub): boolean {
  if (l.city !== hub.city) return false;
  if (hub.kind === "locality") return l.localitySlug === hub.locality;
  if (hub.kind === "format") return l.format === hub.format;
  return true;
}

export interface HubStatus {
  /** Sites that meet the content bar. Only these count towards publishing. */
  indexable: number;
  needed: number;
  published: boolean;
}

export function hubStatus(all: Listing[], hub: Hub): HubStatus {
  const indexable = all.filter((l) => l.indexable && inHub(l, hub)).length;
  const needed = HUB_MIN[hub.kind];
  return { indexable, needed, published: indexable >= needed };
}

/** "Hoardings in Bengaluru", "Outdoor advertising sites in Koramangala, Bengaluru". */
export function hubTitle(hub: Hub, localityLabel?: string): string {
  const city = cityDef(hub.city)?.label ?? hub.city;
  if (hub.kind === "format")
    return `${formatDef(hub.format)?.slug === "led-screen" ? "LED screens" : (formatDef(hub.format)?.plural ?? "Sites")} in ${city}`;
  if (hub.kind === "locality")
    return `Outdoor advertising sites in ${localityLabel ?? hub.locality}, ${city}`;
  return `Outdoor advertising sites in ${city}`;
}

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/**
 * The dated fact a hub opens with, built only from the listings themselves: how many sites, from how
 * many owners, which format is most common, and the median shown rate when there are enough to give one.
 */
export function hubFact(
  hub: Hub,
  items: Listing[],
  median: { rate: number; n: number } | null,
  monthYear: string,
  localityLabel?: string,
): string {
  const city = cityDef(hub.city)?.label ?? hub.city;
  const place = hub.kind === "locality" ? `${localityLabel ?? hub.locality}, ${city},` : city;
  const owners = new Set(items.map((l) => l.ownerId)).size;
  const what =
    hub.kind === "format"
      ? count(
          items.length,
          `listed ${formatDef(hub.format)?.inSentence ?? "site"}`,
          `listed ${hub.format === "led-screen" ? "LED screens" : (formatDef(hub.format)?.plural.toLowerCase() ?? "sites")}`,
        )
      : count(items.length, "listed site", "listed sites");
  const parts = [`${place} has ${what} from ${count(owners, "owner", "owners")}.`];
  if (hub.kind !== "format") {
    const byFormat = new Map<string, number>();
    for (const l of items) byFormat.set(l.format, (byFormat.get(l.format) ?? 0) + 1);
    const top = [...byFormat.entries()].sort((a, b) => b[1] - a[1])[0];
    const def = top ? formatDef(top[0]) : undefined;
    if (top && def && byFormat.size > 1)
      parts.push(
        `${top[0] === "led-screen" ? "LED screens" : def.plural} are the most common, with ${top[1]}.`,
      );
  }
  if (median)
    parts.push(
      `The median rate of the ${median.n} that show a price is ${inr(median.rate)} a month.`,
    );
  return `${parts.join(" ")} (ohworks, ${monthYear})`;
}
