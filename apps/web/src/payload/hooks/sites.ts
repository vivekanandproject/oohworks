import { randomInt } from "node:crypto";
import { APIError, type CollectionBeforeChangeHook } from "payload";
import { formatDef } from "../../lib/sites/taxonomy";
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

  const unit = merged.sizeUnit ?? "ft";
  if (merged.width && merged.height) {
    d.widthMm = Math.round(merged.width * MM[unit]);
    d.heightMm = Math.round(merged.height * MM[unit]);
  }
  if (merged.locality) d.localitySlug = slugify(merged.locality);
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
      });
      ownerVerified = Boolean(owner?.verified);
    } catch {
      ownerVerified = false;
    }
  }
  d.qualityScore = qualityScore(merged, ownerVerified);
  return d;
};
