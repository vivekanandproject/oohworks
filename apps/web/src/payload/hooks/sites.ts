import { randomInt } from "node:crypto";
import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from "payload";
import { deliverMail } from "../mailer";
import { siteUrl } from "../../lib/hosting";
import { pingIndexNow } from "../../lib/indexnow";
import { cityDef, formatDef } from "../../lib/sites/taxonomy";
import { countryOrDefault } from "../../lib/world/countries";
import { timeZoneAt } from "../../lib/world/zone";
import { slugify } from "./index";

/** Crockford base 32 without i, l, o and u: the alphabet of a permanent unit id. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

export function newPermanentId(): string {
  let id = "ow";
  for (let i = 0; i < 5; i += 1) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}

const MM = { ft: 304.8, m: 1000 } as const;

interface SiteData {
  [key: string]: unknown;
  _status?: "draft" | "published";
  review?: "draft" | "submitted" | "changes" | "approved" | null;
  reviewNote?: string | null;
  format?: string;
  width?: number;
  height?: number;
  sizeUnit?: "ft" | "m";
  road?: string;
  locality?: string;
  landmark?: string | null;
  lat?: number;
  lng?: number;
  facingDeg?: number | null;
  priceDisplay?: "exact" | "from" | "on_request";
  rate?: number | null;
  audience?: { figure?: number | null; source?: string | null; measuredOn?: string | null } | null;
  permit?: { number?: string | null } | null;
  verifiedLocation?: boolean | null;
  photos?: unknown[] | null;
  artworkSpec?: string | null;
  lighting?: string | null;
  owner?: unknown;
  permanentId?: string | null;
}

/** How complete a listing is, out of 100. Published, so owners know what earns a better place in results. */
export function qualityScore(d: SiteData, ownerVerified: boolean): number {
  let score = 0;
  const photos = d.photos?.length ?? 0;
  if (photos >= 1) score += 20;
  if (photos >= 3) score += 5;
  if (d.priceDisplay === "exact" || d.priceDisplay === "from") score += 15;
  else score += 5;
  if (d.audience?.figure && d.audience.source) score += 15;
  if (d.permit?.number) score += 10;
  if (d.verifiedLocation) score += 10;
  if (ownerVerified) score += 10;
  if (d.artworkSpec) score += 5;
  if (d.lighting && d.width && d.height) score += 5;
  if (d.landmark) score += 5;
  return Math.min(100, score);
}

/** Derives the stored size, the title and the id, and refuses a listing that would mislead a buyer. */
export const siteBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const d = data as SiteData;
  const merged = { ...(originalDoc as SiteData | undefined), ...d };

  if (merged.lat !== undefined && (merged.lat < -90 || merged.lat > 90))
    throw new APIError("Latitude must be between -90 and 90.", 400);
  if (merged.lng !== undefined && (merged.lng < -180 || merged.lng > 180))
    throw new APIError("Longitude must be between -180 and 180.", 400);
  if (merged.facingDeg != null && (merged.facingDeg < 0 || merged.facingDeg > 359))
    throw new APIError("Facing is a compass bearing from 0 to 359.", 400);
  if (merged.priceDisplay !== "on_request" && !(merged.rate && merged.rate > 0)) {
    throw new APIError("Give a monthly rate, or set the price to show as “Price on request”.", 400);
  }
  if (merged.audience?.figure && !(merged.audience.source && merged.audience.measuredOn)) {
    throw new APIError(
      "An audience figure needs its source and the date it was measured. Without them, leave the figure empty.",
      400,
    );
  }

  if (d.review === "changes" && !String(merged.reviewNote ?? "").trim()) {
    throw new APIError(
      "Write the reason for the owner before returning a site. They read your exact words.",
      400,
    );
  }
  // Publishing is the approval. A site cannot be live and still waiting.
  if (d._status === "published") d.review = "approved";

  const unit = merged.sizeUnit ?? "ft";
  if (merged.width && merged.height) {
    d.widthMm = Math.round(merged.width * MM[unit]);
    d.heightMm = Math.round(merged.height * MM[unit]);
  }
  if (merged.locality) d.localitySlug = slugify(merged.locality);
  // The city in the address is made once from its name and kept, so old addresses keep working.
  if (merged.city) d.city = slugify(String(merged.city));
  if (operation === "update" && originalDoc?._status === "published" && originalDoc.city)
    d.city = originalDoc.city as string;
  if (merged.country) d.country = String(merged.country).toLowerCase();
  if (!merged.cityLabel && merged.city) d.cityLabel = cityDef(String(merged.city))?.label ?? null;
  if (typeof merged.lat === "number" && typeof merged.lng === "number")
    d.timeZone = timeZoneAt(merged.lat, merged.lng, merged.country as string | undefined);
  if (!merged.currency)
    d.currency = countryOrDefault(merged.country as string | undefined).currency;
  const format = formatDef(merged.format);
  if (format && merged.road && merged.width && merged.height) {
    d.title = `${merged.width} × ${merged.height} ${unit} ${format.inSentence}, ${merged.road}`;
    d.slug = `${format.slug}-${slugify(merged.road)}`;
  }
  if (operation === "create" && !merged.permanentId) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = newPermanentId();
      const taken = await req.payload.count({
        collection: "sites",
        where: { permanentId: { equals: id } },
        overrideAccess: true,
        req,
      });
      if (taken.totalDocs === 0) {
        d.permanentId = id;
        break;
      }
    }
    if (!d.permanentId) throw new APIError("Could not assign a unit id. Try saving again.", 500);
  }
  // The id never changes once assigned: old addresses must keep working.
  if (operation === "update" && originalDoc?.permanentId)
    d.permanentId = originalDoc.permanentId as string;

  let ownerVerified = false;
  const ownerId =
    typeof merged.owner === "object" && merged.owner !== null
      ? (merged.owner as { id?: number }).id
      : (merged.owner as number | undefined);
  if (ownerId) {
    try {
      const owner = await req.payload.findByID({
        collection: "owners",
        id: ownerId,
        overrideAccess: true,
        depth: 0,
        req,
      });
      ownerVerified = Boolean(owner?.verified);
    } catch {
      ownerVerified = false;
    }
  }
  d.qualityScore = qualityScore(merged, ownerVerified);
  return d;
};

const base = (): string => siteUrl();

/**
 * Tells an owner who listed their own site what the team decided: that it is live, or that it has come
 * back and why. Owners whose sites the team entered are not written to. A failed email never undoes the save.
 */
export const siteAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const wentLive = doc._status === "published" && previousDoc?._status !== "published";
  const returned = doc.review === "changes" && previousDoc?.review !== "changes";
  // Any change to a live site, or a site leaving the site, is news to search engines: its own page,
  // its city page and the home page's city board. Bing and the assistants built on it hear at once.
  if (doc._status === "published" || previousDoc?._status === "published") {
    void pingIndexNow([
      `/${doc.country ?? "in"}/${doc.city}/${doc.localitySlug ?? "area"}/${doc.slug ?? "site"}-${doc.permanentId}/`,
      `/${doc.country ?? "in"}/${doc.city}/`,
      "/",
    ]);
  }
  if (!wentLive && !returned) return doc;
  try {
    const ownerId = typeof doc.owner === "object" && doc.owner !== null ? doc.owner.id : doc.owner;
    const owner = await req.payload.findByID({
      collection: "owners",
      id: ownerId,
      overrideAccess: true,
      depth: 0,
      req,
    });
    if (!owner?.loginEmail) return doc;
    const page = `${base()}/${doc.country ?? "in"}/${doc.city}/${doc.localitySlug ?? "area"}/${doc.slug ?? "site"}-${doc.permanentId}/`;
    const manage = `${base()}/owner/sites/${doc.permanentId}/`;
    await deliverMail(
      req.payload,
      wentLive
        ? {
            kind: "owner_notice",
            to: owner.loginEmail,
            subject: `Your site is live: ${doc.title}`,
            text: [
              `${doc.title} is now live on OOHWORKS.`,
              "",
              `See it as a buyer does: ${page}`,
              `Change its price or availability at any time: ${manage}`,
              "",
              "Enquiries come straight to you. OOHWORKS never sells media or takes a media margin.",
            ].join("\n"),
          }
        : {
            kind: "owner_notice",
            to: owner.loginEmail,
            subject: `One thing to fix before this site can go live: ${doc.title}`,
            text: [
              `We checked ${doc.title} and it needs a change before it can go live.`,
              "",
              `What the reviewer wrote: ${String(doc.reviewNote ?? "").trim()}`,
              "",
              `Fix it and send it again: ${manage}`,
            ].join("\n"),
          },
      req,
    );
  } catch (error) {
    req.payload.logger.error({ err: error }, "Could not email the owner about their site");
  }
  return doc;
};
