import type { Owner, Site } from "@/payload-types";
import { absolute } from "@/lib/seo";
import { indiaDate } from "@/lib/sites/calendar";
import type { Listing } from "@/lib/sites/filter";
import type { SearchState } from "@/lib/sites/state";
import { cityDef, formatDef, lightingDef } from "@/lib/sites/taxonomy";
import {
  availabilityOf,
  badgesOf,
  facingText,
  permitState,
  priceOf,
  sizeFeet,
  summaryOf,
} from "@/lib/sites/view";

/**
 * A site as the public API gives it. The rules are the site page's own: the owner is the named seller,
 * a private price is null, an audience figure appears only with its source and date, and the owner's
 * email and phone are never included. A sample is marked as one.
 */

/** The most sites one page of the list may hold. */
export const MAX_PER_PAGE = 50;

const day = (iso: string | null | undefined): string | null =>
  iso ? indiaDate(new Date(iso).getTime()) : null;
const five = (n: number): number => Number(n.toFixed(5));
const full = (url: string): string => (/^https?:\/\//.test(url) ? url : absolute(url));

export function siteSummary(listing: Listing, site: Site, owner: Owner | null, now: number) {
  const price = priceOf(site);
  const availability = availabilityOf(site, now);
  return {
    unitId: listing.permanentId,
    title: listing.title,
    url: absolute(listing.url),
    enquireUrl: absolute(`/enquire/${listing.permanentId}/`),
    format: { slug: site.format, label: formatDef(site.format)?.label ?? site.format },
    type: listing.isDigital ? ("digital" as const) : ("static" as const),
    size: {
      label: sizeFeet(site),
      width: site.width,
      height: site.height,
      unit: site.sizeUnit,
      widthMm: site.widthMm ?? null,
      heightMm: site.heightMm ?? null,
    },
    lighting: { slug: site.lighting, label: lightingDef(site.lighting)?.label ?? site.lighting },
    location: {
      road: site.road,
      landmark: site.landmark || null,
      locality: site.locality,
      city: { slug: site.city, label: cityDef(site.city)?.label ?? site.city },
      country: site.country,
      lat: five(site.lat),
      lng: five(site.lng),
      facingDeg: site.facingDeg ?? null,
      facing: facingText(site.facingDeg),
    },
    price: {
      display: site.priceDisplay,
      monthlyInr: listing.priceShown ? listing.rate : null,
      label: price.shown ? `${price.prefix}${price.amount} a month` : "Price on request",
    },
    availability: {
      state: availability.state,
      label: availability.label,
      bookedUntil: day(site.bookedUntil),
      confirmedOn: day(site.availabilityConfirmedOn),
    },
    checks: badgesOf(site, owner, now).map((b) => b.text),
    owner: {
      name: listing.ownerName,
      slug: listing.ownerSlug,
      verified: listing.ownerVerified,
      medianReplyHours: listing.ownerReplyHours,
    },
    sample: listing.sample,
    updatedAt: site.updatedAt,
  };
}

export function siteDetail(
  listing: Listing,
  site: Site,
  owner: Owner | null,
  ownerSiteCount: number,
  now: number,
) {
  const audience =
    site.audience?.figure && site.audience.source && site.audience.measuredOn
      ? site.audience
      : null;
  const permit = permitState(site, now);
  return {
    ...siteSummary(listing, site, owner, now),
    description: summaryOf(site, owner),
    environment: site.environment,
    litHours: site.litHours || null,
    digital: listing.isDigital
      ? {
          resolution: site.digital?.resolution || null,
          spotSeconds: site.digital?.spotSeconds ?? null,
          loopSeconds: site.digital?.loopSeconds ?? null,
          advertisers: site.digital?.advertisers ?? null,
          exchanges: site.digital?.exchanges || null,
        }
      : null,
    terms: {
      minPeriod: site.minPeriod || null,
      productionCost: site.productionCost || null,
      taxesNote: site.taxesNote || null,
      notAccepted: site.notAccepted || null,
    },
    creative: {
      artworkSpec: site.artworkSpec || null,
      fileTypes: site.fileTypes || null,
      leadTimeDays: site.leadTimeDays ?? null,
    },
    audience: audience
      ? {
          figure: audience.figure,
          metric: audience.metric || null,
          source: audience.source,
          method: audience.method || null,
          measuredOn: day(audience.measuredOn),
        }
      : null,
    permit:
      permit === "none"
        ? null
        : {
            state: permit,
            number: site.permit?.number || null,
            authority: site.permit?.authority || null,
            validTo: day(site.permit?.expiresOn),
          },
    photos: (site.photos ?? []).flatMap((p) =>
      typeof p.image === "object" && p.image.url
        ? [
            {
              url: full(p.image.url),
              view: p.kind,
              takenOn: day(p.takenOn),
              gpsStamped: Boolean(p.gps),
              alt: p.image.alt,
              credit: p.image.credit,
              width: p.image.width ?? null,
              height: p.image.height ?? null,
            },
          ]
        : [],
    ),
    ownerSiteCount,
  };
}

/** The filters a search actually applied, after reading the query and any typed text. */
export function appliedFilters(s: SearchState) {
  return {
    q: s.q || null,
    city: s.city ?? null,
    localities: s.localities,
    formats: s.formats,
    type: s.type ?? null,
    size: s.size ? `${s.size.w}x${s.size.h}` : null,
    lighting: s.lighting,
    min: s.min ?? null,
    max: s.max ?? null,
    priced: s.priced,
    from: s.from ?? null,
    to: s.to ?? null,
    trust: s.trust,
    bbox: s.bbox ?? null,
    owner: s.owner ?? null,
    sort: s.sort,
  };
}
