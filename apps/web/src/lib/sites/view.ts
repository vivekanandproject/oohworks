import type { BadgeKind } from "@ohworks/ui";
import type { Owner, Site } from "@/payload-types";
import { formatDate } from "@/lib/editorial/format";
import { cityDef, formatDef, lightingDef } from "./taxonomy";

const DAY = 24 * 3600 * 1000;
const NBSP = " ";

/** Rupees with Indian grouping: ₹ 1,20,000. */
export function inr(amount: number): string {
  return `₹${NBSP}${Math.round(amount).toLocaleString("en-IN")}`;
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** "20 × 10 ft": the size a buyer in India says out loud. */
export function sizeFeet(
  site: Pick<Site, "widthMm" | "heightMm" | "width" | "height" | "sizeUnit">,
): string {
  if (site.widthMm && site.heightMm)
    return `${trim(site.widthMm / 304.8)} × ${trim(site.heightMm / 304.8)} ft`;
  return `${site.width} × ${site.height} ${site.sizeUnit}`;
}

/** "20 × 10 ft (6.1 × 3.0 m)". */
export function sizeFull(
  site: Pick<Site, "widthMm" | "heightMm" | "width" | "height" | "sizeUnit">,
): string {
  if (!(site.widthMm && site.heightMm)) return sizeFeet(site);
  return `${sizeFeet(site)} (${(site.widthMm / 1000).toFixed(1)} × ${(site.heightMm / 1000).toFixed(1)} m)`;
}

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export function compass(deg: number): string {
  return POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8] ?? "N";
}
export function facingText(deg: number | null | undefined): string | null {
  return deg == null ? null : `${Math.round(deg)}° ${compass(deg)}`;
}

export function coords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** The public address of a site. The permanent id at the end is what resolves it. */
export function siteUrl(
  site: Pick<Site, "country" | "city" | "localitySlug" | "slug" | "permanentId">,
): string {
  return `/${site.country}/${site.city}/${site.localitySlug ?? "area"}/${site.slug ?? "site"}-${site.permanentId}/`;
}

export type Price = { shown: true; prefix: string; amount: string } | { shown: false };
export function priceOf(site: Pick<Site, "priceDisplay" | "rate">): Price {
  if (site.priceDisplay === "on_request" || !site.rate) return { shown: false };
  return {
    shown: true,
    prefix: site.priceDisplay === "from" ? "From " : "",
    amount: inr(site.rate),
  };
}

export interface Availability {
  state: "free" | "booked" | "stale";
  label: string;
  note: string | null;
}

function ago(days: number): string {
  if (days < 14) return `${days} days ago`;
  if (days < 61) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** What the owner's calendar says, and how recently they confirmed it. Never invented urgency. */
export function availabilityOf(
  site: Pick<Site, "bookedUntil" | "availabilityConfirmedOn">,
  now: number,
): Availability {
  if (site.bookedUntil && new Date(site.bookedUntil).getTime() > now) {
    const free = new Date(new Date(site.bookedUntil).getTime() + DAY).toISOString();
    return {
      state: "booked",
      label: `Booked until ${formatDate(site.bookedUntil)}`,
      note: `Free again from ${formatDate(free)}. You can ask about later dates.`,
    };
  }
  if (!site.availabilityConfirmedOn)
    return {
      state: "stale",
      label: "Availability not confirmed yet",
      note: "Ask the owner to confirm before you plan around it.",
    };
  const days = Math.floor((now - new Date(site.availabilityConfirmedOn).getTime()) / DAY);
  if (days > 30)
    return {
      state: "stale",
      label: `Last confirmed ${ago(days)}`,
      note: "Ask the owner to confirm before you plan around it.",
    };
  return {
    state: "free",
    label: "Available now",
    note: `Availability confirmed ${formatDate(site.availabilityConfirmedOn)}.`,
  };
}

/** Days since the owner last confirmed availability or added a photo. */
export function freshDays(
  site: Pick<Site, "availabilityConfirmedOn" | "photos">,
  now: number,
): number | null {
  const dates = [site.availabilityConfirmedOn, ...(site.photos ?? []).map((p) => p.takenOn)]
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime());
  if (!dates.length) return null;
  return Math.max(0, Math.floor((now - Math.max(...dates)) / DAY));
}

export function permitState(site: Pick<Site, "permit">, now: number): "valid" | "expired" | "none" {
  if (!site.permit?.number) return "none";
  if (site.permit.expiresOn && new Date(site.permit.expiresOn).getTime() < now) return "expired";
  return "valid";
}

export interface SiteBadge {
  kind: BadgeKind;
  text: string;
}

/** Only the badges a site has earned. Each says what was checked. */
export function badgesOf(
  site: Site,
  owner: Pick<Owner, "verified" | "medianReplyHours"> | null,
  now: number,
): SiteBadge[] {
  const out: SiteBadge[] = [];
  if (owner?.verified) out.push({ kind: "verified", text: "Verified owner" });
  if (site.verifiedLocation) out.push({ kind: "verified", text: "Verified location" });
  const permit = permitState(site, now);
  if (permit === "valid") out.push({ kind: "permit", text: "Permit on file" });
  if (permit === "expired" && site.permit?.expiresOn)
    out.push({
      kind: "critical",
      text: `Permit expired ${formatDate(site.permit.expiresOn).replace(/^\d+ /, "")}`,
    });
  const fresh = freshDays(site, now);
  if (fresh !== null && fresh <= 30)
    out.push({
      kind: "fresh",
      text:
        fresh === 0
          ? "Updated today"
          : fresh === 1
            ? "Updated yesterday"
            : `Updated ${fresh} days ago`,
    });
  if (owner?.medianReplyHours != null && owner.medianReplyHours < 24)
    out.push({ kind: "responsive", text: "Replies in under a day" });
  if (site.sample) out.push({ kind: "neutral", text: "Sample listing" });
  return out;
}

export interface IndexCheck {
  key: string;
  label: string;
  ok: boolean;
  /** What to do when the check is not met. */
  fix: string;
}

/**
 * The content bar from the SEO rules, one check at a time: a site page joins the index (and the
 * sitemap) only when it is the real destination for a real site. A sample or a removed site never does.
 * The admin's readiness panel shows the same checks, so the team sees why a page is or is not indexed.
 */
export function indexChecks(
  site: Pick<
    Site,
    | "sample"
    | "removed"
    | "photos"
    | "lat"
    | "lng"
    | "facingDeg"
    | "widthMm"
    | "lighting"
    | "audience"
  >,
  owner: Pick<Owner, "verified"> | null,
): IndexCheck[] {
  const audienceOk =
    !site.audience?.figure || Boolean(site.audience.source && site.audience.measuredOn);
  return [
    {
      key: "real",
      label: "A real, live site",
      ok: !site.sample && !site.removed,
      fix: site.removed
        ? "The site was taken down; its page answers 410."
        : "Sample listings never go to search engines.",
    },
    {
      key: "photo",
      label: "At least one real photo",
      ok: (site.photos?.length ?? 0) > 0,
      fix: "Add a dated photo of the face from the road. Stock images are refused.",
    },
    {
      key: "owner",
      label: "The owner is verified",
      ok: Boolean(owner?.verified),
      fix: "Verify the owner's company documents and contact details in Owners.",
    },
    {
      key: "place",
      label: "Exact coordinates",
      ok: Boolean(site.lat && site.lng),
      fix: "Pin the face on the map.",
    },
    {
      key: "facing",
      label: "The direction it faces",
      ok: site.facingDeg != null,
      fix: "Set the facing in degrees (0 is north, 90 east).",
    },
    {
      key: "size",
      label: "The size of the face",
      ok: Boolean(site.widthMm),
      fix: "Enter the width and height.",
    },
    {
      key: "lighting",
      label: "How it is lit",
      ok: Boolean(site.lighting),
      fix: "Choose front-lit, back-lit, not lit or digital.",
    },
    {
      key: "audience",
      label: "Any audience figure has its source and date",
      ok: audienceOk,
      fix: "Add who measured the audience and when, or remove the figure.",
    },
  ];
}

export function isIndexable(
  site: Parameters<typeof indexChecks>[0],
  owner: Pick<Owner, "verified"> | null,
): boolean {
  return indexChecks(site, owner).every((c) => c.ok);
}

export function placeLine(site: Pick<Site, "locality" | "city">): string {
  return `${site.locality}, ${cityDef(site.city)?.label ?? site.city}`;
}

export function metaLine(
  site: Pick<Site, "locality" | "city" | "lighting" | "trafficDirection" | "format" | "digital">,
): string {
  const parts = [placeLine(site), lightingDef(site.lighting)?.label.toLowerCase()];
  if (site.digital?.spotSeconds) parts.push(`${site.digital.spotSeconds} s slots`);
  if (site.trafficDirection) parts.push(`faces ${site.trafficDirection}`);
  return parts.filter(Boolean).join(" · ");
}

export function formatLabel(slug: string): string {
  return formatDef(slug)?.label ?? slug;
}

/** "4.2 lakh", "1.3 crore": how a large count is said in India. Full figures stay in data. */
export function lakh(n: number): string {
  if (n >= 1e7) return `${trim(n / 1e7)} crore`;
  if (n >= 1e5) return `${trim(n / 1e5)} lakh`;
  return Math.round(n).toLocaleString("en-IN");
}

/** "Oct 2026". */
export function monthYear(iso: string | null | undefined): string {
  return formatDate(iso).replace(/^\d+ /, "");
}

/** One factual paragraph built only from the listing's own fields. Never generated prose. */
export function summaryOf(site: Site, owner: Pick<Owner, "name"> | null): string {
  const format = formatDef(site.format)?.inSentence ?? "site";
  const lit = lightingDef(site.lighting)?.label.toLowerCase();
  const article = /^[aeiou8]/i.test(sizeFeet(site)) ? "An" : "A";
  const first = `${article} ${sizeFeet(site)} ${lit && lit !== "digital" ? `${lit} ` : ""}${format} on ${site.road} in ${placeLine(site)}${site.landmark ? `, ${site.landmark}` : ""}.`;
  const facing = facingText(site.facingDeg);
  const second = facing
    ? ` It faces ${facing}${site.trafficDirection ? `, towards ${site.trafficDirection} traffic` : ""}.`
    : "";
  const third = owner ? ` ${owner.name} owns it and is the seller.` : "";
  return `${first}${second}${third}`;
}
