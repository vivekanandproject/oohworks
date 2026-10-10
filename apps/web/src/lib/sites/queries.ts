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
import type { SearchState } from "./state";
import { freshDays, permitState, siteUrl } from "./view";

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

export async function searchSites(state: SearchState): Promise<SearchResult> {
  const cat = await catalogue();
  const now = Date.now();
  const matched = sortListings(
    cat.listings.filter((l) => matches(l, state, now)),
    state,
    now,
  );
  const pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
  const slice = matched.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
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
