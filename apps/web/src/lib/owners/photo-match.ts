import { distanceKm } from "@/lib/sites/filter";
import { GPS_MATCH_METRES, type PhotoFacts } from "./photo-facts";

/**
 * Which of an owner's sites a photograph shows, by the position the phone recorded. A photograph is
 * placed only when one site is clearly nearest: within reach of its pin, and not about as close to
 * another of the owner's sites (two faces at one junction cannot be told apart by position alone).
 * Anything else is left for the owner to place by hand.
 */

/** The nearest site must be at least this much nearer than the next one. */
export const CLEAR_METRES = 40;

export type Unplaced = "no-position" | "far" | "between";

export function placePhoto<S extends { lat: number; lng: number }>(
  facts: PhotoFacts,
  sites: S[],
): { site: S; metres: number } | { reason: Unplaced; metres: number | null } {
  if (facts.lat === null || facts.lng === null) return { reason: "no-position", metres: null };
  const at = { lat: facts.lat, lng: facts.lng };
  const near = sites
    .map((site) => ({ site, metres: Math.round(distanceKm(at, site) * 1000) }))
    .sort((a, b) => a.metres - b.metres);
  const [first, second] = near;
  if (!first || first.metres > GPS_MATCH_METRES)
    return { reason: "far", metres: first?.metres ?? null };
  if (second && second.metres - first.metres < CLEAR_METRES)
    return { reason: "between", metres: first.metres };
  return first;
}

/**
 * Which view a placed photograph is: taken after dark it is the night view; otherwise the approach view
 * if the site has none yet, the day view if it has.
 */
export function viewOf(facts: PhotoFacts, hasApproach: boolean): "approach" | "day" | "night" {
  if (facts.hour !== null && (facts.hour >= 19 || facts.hour < 5)) return "night";
  return hasApproach ? "day" : "approach";
}
