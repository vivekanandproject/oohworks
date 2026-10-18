import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Media, Owner, Site } from "@/payload-types";
import {
  distanceKm,
  facetCounts,
  matches,
  medianRate,
  sortListings,
  widen,
  type Facets,
  type Listing,
  type Wider,
} from "./filter";
import { formatDate } from "@/lib/editorial/format";
import { siteUrl as siteAddress } from "@/lib/hosting";
import {
  hubFact,
  hubPath,
  hubStatus,
  hubTitle,
  inHub,
  readHub,
  type Hub,
  type HubStatus,
} from "./hubs";
import { DEFAULT_STATE, type SearchState } from "./state";
import { CITIES, FORMATS } from "./taxonomy";
import { freshDays, isIndexable, permitState, siteUrl } from "./view";

export const PER_PAGE = 12;
const DAY = 24 * 3600 * 1000;

const client = cache(async () => getPayload({ config }));

const time = (iso: string | null | undefined): number | null =>
  iso ? new Date(iso).getTime() : null;

function toListing(site: Site, owner: Owner | undefined, now: number): Listing | null {
  if (!site.permanentId || !site.title || site.removed) return null;
  const fresh = freshDays(site, now);
  return {
    id: site.id,
    permanentId: site.permanentId,
    title: site.title,
    url: siteUrl(site),
    format: site.format,
    isDigital: site.format === "led-screen" || site.lighting === "digital",
    lighting: site.lighting,
    city: site.city,
    locality: site.locality,
    localitySlug: site.localitySlug ?? "",
    road: site.road,
    landmark: site.landmark ?? "",
    lat: site.lat,
    lng: site.lng,
    widthMm: site.widthMm ?? 0,
    heightMm: site.heightMm ?? 0,
    priceShown: site.priceDisplay !== "on_request" && Boolean(site.rate),
    priceFrom: site.priceDisplay === "from" && Boolean(site.rate),
    rate: site.priceDisplay !== "on_request" && site.rate ? site.rate : null,
    bookedUntil: time(site.bookedUntil),
    confirmedOn: time(site.availabilityConfirmedOn),
    freshOn: fresh === null ? null : now - fresh * DAY,
    audience: site.audience?.figure && site.audience.source ? site.audience.figure : null,
    permitValid: permitState(site, now) === "valid",
    verifiedLocation: Boolean(site.verifiedLocation),
    ownerId: owner?.id ?? 0,
    ownerSlug: owner?.slug ?? "",
    ownerName: owner?.name ?? "",
    ownerVerified: Boolean(owner?.verified),
    ownerReplyHours: owner?.medianReplyHours ?? null,
    quality: site.qualityScore ?? 0,
    createdAt: new Date(site.createdAt).getTime(),
    sample: Boolean(site.sample),
    indexable: isIndexable(site, owner ?? null),
  };
}

interface Catalogue {
  listings: Listing[];
  sites: Map<number, Site>;
  owners: Map<number, Owner>;
}

/**
 * Every published site, read once per request. Filtering, counting and sorting then run in memory,
 * which is exact and fast at launch volumes; the same interface can sit on a search index later.
 */
const catalogue = cache(async (): Promise<Catalogue> => {
  const p = await client();
  const [siteDocs, ownerDocs] = await Promise.all([
    p.find({
      collection: "sites",
      depth: 0,
      pagination: false,
      limit: 5000,
      overrideAccess: false,
    }),
    p.find({
      collection: "owners",
      depth: 0,
      pagination: false,
      limit: 2000,
      overrideAccess: false,
    }),
  ]);
  const now = Date.now();
  const owners = new Map(ownerDocs.docs.map((o) => [o.id, o]));
  const sites = new Map<number, Site>();
  const listings: Listing[] = [];
  for (const site of siteDocs.docs) {
    const ownerId = typeof site.owner === "object" ? site.owner.id : site.owner;
    const listing = toListing(site, owners.get(ownerId), now);
    if (listing) {
      listings.push(listing);
      sites.set(site.id, site);
    }
  }
  return { listings, sites, owners };
});

export interface Card {
  listing: Listing;
  site: Site;
  owner: Owner | null;
  photo: Media | null;
}

async function toCards(items: Listing[], cat: Catalogue): Promise<Card[]> {
  const photoIds = items
    .map((l) => cat.sites.get(l.id)?.photos?.[0]?.image)
    .map((v) => (typeof v === "object" && v !== null ? v.id : v))
    .filter((v): v is number => typeof v === "number");
  const media = new Map<number, Media>();
  if (photoIds.length) {
    const p = await client();
    const found = await p.find({
      collection: "media",
      where: { id: { in: photoIds } },
      limit: photoIds.length,
      depth: 0,
      overrideAccess: false,
    });
    for (const m of found.docs) media.set(m.id, m);
  }
  return items.flatMap((listing) => {
    const site = cat.sites.get(listing.id);
    if (!site) return [];
    const first = site.photos?.[0]?.image;
    const photoId = typeof first === "object" && first !== null ? first.id : first;
    return [
      {
        listing,
        site,
        owner: cat.owners.get(listing.ownerId) ?? null,
        photo: (typeof photoId === "number" && media.get(photoId)) || null,
      },
    ];
  });
}

export interface SearchResult {
  cards: Card[];
  total: number;
  pages: number;
  facets: Facets;
  /** Every match, for the map: position, title, price and address only. */
  points: {
    id: string;
    lat: number;
    lng: number;
    title: string;
    url: string;
    price: string | null;
  }[];
  wider: Wider[];
  median: { rate: number; n: number } | null;
  anySample: boolean;
  catalogueSize: number;
}

export async function searchSites(
  state: SearchState,
  perPage: number = PER_PAGE,
): Promise<SearchResult> {
  const cat = await catalogue();
  const now = Date.now();
  const matched = sortListings(
    cat.listings.filter((l) => matches(l, state, now)),
    state,
    now,
  );
  const pages = Math.max(1, Math.ceil(matched.length / perPage));
  const slice = matched.slice((state.page - 1) * perPage, state.page * perPage);
  return {
    cards: await toCards(slice, cat),
    total: matched.length,
    pages,
    facets: facetCounts(cat.listings, state, now),
    points: matched.slice(0, 500).map((l) => ({
      id: l.permanentId,
      lat: l.lat,
      lng: l.lng,
      title: l.title,
      url: l.url,
      price: l.rate !== null ? `₹ ${l.rate.toLocaleString("en-IN")}` : null,
    })),
    wider: matched.length <= 3 ? widen(cat.listings, state, now, matched.length) : [],
    median: medianRate(matched),
    anySample: slice.some((l) => l.sample),
    catalogueSize: cat.listings.length,
  };
}

/** How many published sites each city and each format has. */
export async function catalogueCounts(): Promise<{
  cities: Map<string, number>;
  formats: Map<string, number>;
}> {
  const cat = await catalogue();
  const cities = new Map<string, number>();
  const formats = new Map<string, number>();
  for (const l of cat.listings) {
    cities.set(l.city, (cities.get(l.city) ?? 0) + 1);
    formats.set(l.format, (formats.get(l.format) ?? 0) + 1);
  }
  return { cities, formats };
}

/** Sites by unit id, in the order asked for. Ids that match nothing, or a site taken down, are left out. */
export async function listingsFor(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const cat = await catalogue();
  const byId = new Map(cat.listings.map((l) => [l.permanentId, l]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** The same, as full cards with owner and photograph. */
export async function cardsFor(ids: string[]): Promise<Card[]> {
  if (ids.length === 0) return [];
  const cat = await catalogue();
  const byId = new Map(cat.listings.map((l) => [l.permanentId, l]));
  return toCards(
    ids.flatMap((id) => byId.get(id) ?? []),
    cat,
  );
}

export interface SitePage {
  site: Site;
  owner: Owner | null;
  ownerSiteCount: number;
}

/** One site by its permanent id, with its owner and photographs. Includes taken-down sites so the page can say so. */
export const getSite = cache(async (permanentId: string): Promise<SitePage | null> => {
  const p = await client();
  const found = await p.find({
    collection: "sites",
    where: { permanentId: { equals: permanentId } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  });
  const site = found.docs[0];
  if (!site) return null;
  const owner = typeof site.owner === "object" ? site.owner : null;
  const cat = await catalogue();
  return {
    site,
    owner,
    ownerSiteCount: owner ? cat.listings.filter((l) => l.ownerId === owner.id).length : 0,
  };
});

/** The nearest other sites in the same city. */
export async function similarSites(site: Site, limit: number): Promise<(Card & { km: number })[]> {
  const cat = await catalogue();
  const near = cat.listings
    .filter((l) => l.city === site.city && l.id !== site.id)
    .map((l) => ({ l, km: distanceKm(site, l) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
  const cards = await toCards(
    near.map((n) => n.l),
    cat,
  );
  return cards.map((c, i) => ({ ...c, km: near[i]?.km ?? 0 }));
}

/** The owner's address for an enquiry. Read with full access: it is never sent to a browser. */
export async function ownerContact(
  ownerId: number,
): Promise<{ name: string; email: string } | null> {
  const p = await client();
  try {
    const owner = await p.findByID({
      collection: "owners",
      id: ownerId,
      depth: 0,
      overrideAccess: true,
    });
    return owner?.contactEmail ? { name: owner.name, email: owner.contactEmail } : null;
  } catch {
    return null;
  }
}

/**
 * Local and test machines can look at hubs that are not yet published, so the pages can be built and
 * checked before real inventory exists. Such a page is marked as a preview and is never indexed.
 * The flag is ignored on any site served over https.
 */
export function hubPreview(): boolean {
  const site = siteAddress();
  return process.env.HUB_PREVIEW === "1" && !site.startsWith("https://");
}

export interface HubLink {
  label: string;
  count: number;
  href: string;
  /** A link to another hub is followed; a link into filtered search is not. */
  hub: boolean;
}

export interface HubResult {
  hub: Hub;
  status: HubStatus;
  /** Shown only because previews are on; the live site answers "not found" here. */
  preview: boolean;
  title: string;
  fact: string;
  localityLabel: string | undefined;
  cards: Card[];
  total: number;
  pages: number;
  points: SearchResult["points"];
  formats: HubLink[];
  areas: HubLink[];
  anySample: boolean;
}

const searchHref = (params: Record<string, string>): string =>
  `/search/?${new URLSearchParams(params).toString()}`;

/** Everything a hub page shows, or null when the hub does not exist or is not open yet. */
export async function hubData(hub: Hub, page: number): Promise<HubResult | null> {
  const cat = await catalogue();
  const preview = hubPreview();
  const status = hubStatus(cat.listings, hub);
  if (!status.published && !preview) return null;
  // The live page lists real sites only. A preview may also show samples, which are labelled.
  const pool = cat.listings.filter((l) => (preview || !l.sample) && l.city === hub.city);
  const now = Date.now();
  const items = sortListings(
    pool.filter((l) => inHub(l, hub)),
    DEFAULT_STATE,
    now,
  );
  if (items.length === 0) return null;
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  if (page > pages) return null;
  const localityLabel = hub.kind === "locality" ? items[0]?.locality : undefined;
  const open = (h: Hub): boolean => preview || hubStatus(cat.listings, h).published;

  const formats: HubLink[] = FORMATS.flatMap((f) => {
    const n = items.filter((l) => l.format === f.slug).length;
    if (n === 0 || hub.kind === "format") return [];
    const target: Hub = { kind: "format", city: hub.city, format: f.slug };
    const asHub = hub.kind === "city" && open(target);
    return [
      {
        label: f.slug === "led-screen" ? "LED screens" : f.plural,
        count: n,
        hub: asHub,
        href: asHub
          ? hubPath(target)
          : searchHref({
              city: hub.city,
              ...(hub.kind === "locality" ? { locality: hub.locality } : {}),
              format: f.slug,
            }),
      },
    ];
  });
  const byArea = new Map<string, { label: string; count: number }>();
  for (const l of items)
    byArea.set(l.localitySlug, {
      label: l.locality,
      count: (byArea.get(l.localitySlug)?.count ?? 0) + 1,
    });
  const areas: HubLink[] =
    hub.kind === "locality"
      ? []
      : [...byArea.entries()]
          .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
          .map(([slug, v]) => {
            const target: Hub = { kind: "locality", city: hub.city, locality: slug };
            const asHub = hub.kind === "city" && open(target);
            return {
              label: v.label,
              count: v.count,
              hub: asHub,
              href: asHub
                ? hubPath(target)
                : searchHref({
                    city: hub.city,
                    locality: slug,
                    ...(hub.kind === "format" ? { format: hub.format } : {}),
                  }),
            };
          });

  const slice = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return {
    hub,
    status,
    preview: preview && !status.published,
    title: hubTitle(hub, localityLabel),
    fact: hubFact(
      hub,
      items,
      medianRate(items),
      formatDate(new Date(now).toISOString()).replace(/^\d+ /, ""),
      localityLabel,
    ),
    localityLabel,
    cards: await toCards(slice, cat),
    total: items.length,
    pages,
    points: items.slice(0, 500).map((l) => ({
      id: l.permanentId,
      lat: l.lat,
      lng: l.lng,
      title: l.title,
      url: l.url,
      price: l.rate !== null ? `₹ ${l.rate.toLocaleString("en-IN")}` : null,
    })),
    formats,
    areas,
    anySample: slice.some((l) => l.sample),
  };
}

/** The hubs a site belongs to that a visitor can open, for its breadcrumb. */
export async function hubLinksFor(
  site: Pick<Site, "city" | "localitySlug">,
): Promise<{ city: string | null; locality: string | null }> {
  const cat = await catalogue();
  const preview = hubPreview();
  const city = readHub("in", site.city);
  const locality = site.localitySlug ? readHub("in", site.city, site.localitySlug) : null;
  const open = (h: Hub | null): h is Hub =>
    h !== null && (preview || hubStatus(cat.listings, h).published);
  return {
    city: open(city) ? hubPath(city) : null,
    locality: open(locality) && locality.kind === "locality" ? hubPath(locality) : null,
  };
}

/** Every published hub, for the sitemap. A preview is never in it. */
export async function publishedHubs(): Promise<{ url: string; updatedAt: string }[]> {
  const cat = await catalogue();
  const out: { url: string; updatedAt: string }[] = [];
  for (const c of CITIES) {
    const inCity = cat.listings.filter((l) => l.city === c.slug && !l.sample);
    if (inCity.length === 0) continue;
    const hubs: Hub[] = [
      { kind: "city", city: c.slug },
      ...FORMATS.map((f): Hub => ({ kind: "format", city: c.slug, format: f.slug })),
      ...[...new Set(inCity.map((l) => l.localitySlug))].map((slug): Hub => ({
        kind: "locality",
        city: c.slug,
        locality: slug,
      })),
    ];
    for (const hub of hubs) {
      if (!hubStatus(cat.listings, hub).published) continue;
      const newest = inCity
        .filter((l) => inHub(l, hub))
        .reduce(
          (latest, l) => Math.max(latest, new Date(cat.sites.get(l.id)?.updatedAt ?? 0).getTime()),
          0,
        );
      out.push({ url: hubPath(hub), updatedAt: new Date(newest || Date.now()).toISOString() });
    }
  }
  return out;
}

/** Indexable site pages, for the sitemap. */
export async function indexableSiteUrls(): Promise<{ url: string; updatedAt: string }[]> {
  const cat = await catalogue();
  const out: { url: string; updatedAt: string }[] = [];
  for (const l of cat.listings) {
    const site = cat.sites.get(l.id);
    if (!site || l.sample) continue;
    if ((site.photos?.length ?? 0) > 0 && l.ownerVerified)
      out.push({ url: l.url, updatedAt: site.updatedAt });
  }
  return out;
}
