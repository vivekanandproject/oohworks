import type { Owner, Site } from "@/payload-types";

/** Where a site stands, as its owner sees it. */
export type SiteState = "draft" | "review" | "changes" | "live";

export function stateOf(site: Pick<Site, "_status" | "review">): SiteState {
  if (site._status === "published") return "live";
  if (site.review === "submitted" || site.review === "approved") return "review";
  if (site.review === "changes") return "changes";
  return "draft";
}

export const STATE_LABEL: Record<SiteState, string> = {
  draft: "Draft",
  review: "In review",
  changes: "Needs changes",
  live: "Live",
};

export interface Improvement {
  text: string;
  points: number;
}

/**
 * What would make a listing more complete, with the points each adds to its score out of 100. These are
 * the same weights the score itself uses, so the advice and the number never disagree. Paying is not on the list.
 */
export function improvements(site: Site, owner: Pick<Owner, "verified"> | null): Improvement[] {
  const out: Improvement[] = [];
  const photos = site.photos?.length ?? 0;
  if (photos === 0) out.push({ text: "Add a real photograph of the site", points: 20 });
  else if (photos < 3) out.push({ text: "Add approach, day and night views", points: 5 });
  if (!site.audience?.figure || !site.audience.source)
    out.push({ text: "Give an audience figure with its source and date", points: 15 });
  if (site.priceDisplay === "on_request")
    out.push({ text: "Show your rate, or a “from” price", points: 10 });
  if (!site.permit?.number) out.push({ text: "Add the permit number", points: 10 });
  if (!owner?.verified)
    out.push({ text: "Add your GSTIN and a document, to become a verified owner", points: 10 });
  if (!site.artworkSpec) out.push({ text: "Say what artwork a buyer should supply", points: 5 });
  if (!site.landmark) out.push({ text: "Add a landmark buyers will know", points: 5 });
  return out.sort((a, b) => b.points - a.points);
}

/** A name for an owner's page address that is free, given the ones already taken. */
export function freeSlug(base: string, taken: (slug: string) => boolean): string {
  const root = base || "owner";
  if (!taken(root)) return root;
  for (let n = 2; n < 500; n += 1) if (!taken(`${root}-${n}`)) return `${root}-${n}`;
  return `${root}-${Date.now()}`;
}
