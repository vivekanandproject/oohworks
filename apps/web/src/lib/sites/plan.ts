import { distanceKm, type Listing } from "./filter";
import { inr } from "./view";

export interface PlanSummary {
  sites: number;
  owners: number;
  /** The sum of the monthly prices that owners show. */
  shown: number;
  priced: number;
  onRequest: number;
  /** True when a "from" price is in the sum, which makes the sum a floor. */
  floor: boolean;
}

/** What a shortlist adds up to. Only prices an owner shows are counted; nothing is estimated. */
export function summarise(items: Listing[]): PlanSummary {
  const priced = items.filter((l) => l.priceShown && l.rate !== null);
  return {
    sites: items.length,
    owners: new Set(items.map((l) => l.ownerId)).size,
    shown: priced.reduce((sum, l) => sum + (l.rate ?? 0), 0),
    priced: priced.length,
    onRequest: items.length - priced.length,
    floor: priced.some((l) => l.priceFrom),
  };
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** "3 sites saved · 2 owners · ₹ 1,49,000 a month shown · 1 on request". */
export function planText(s: PlanSummary): string {
  if (s.sites === 0) return "Nothing saved yet";
  const parts = [`${plural(s.sites, "site", "sites")} saved`, plural(s.owners, "owner", "owners")];
  if (s.priced) parts.push(`${s.floor ? "from " : ""}${inr(s.shown)} a month shown`);
  if (s.onRequest) parts.push(`${s.onRequest} on request`);
  return parts.join(" · ");
}

export interface BudgetLine {
  state: "under" | "over" | "exact";
  text: string;
}

/** How the shown prices sit against a monthly budget. Sites with no shown price are named, not guessed. */
export function budgetLine(s: PlanSummary, budget: number | undefined): BudgetLine | null {
  if (!budget || s.priced === 0) return null;
  const diff = budget - s.shown;
  const rest = s.onRequest
    ? ` Not counting ${plural(s.onRequest, "site", "sites")} with price on request.`
    : "";
  const floor = s.floor ? " “From” prices may come in higher." : "";
  if (diff === 0)
    return { state: "exact", text: `The shown prices match your budget.${rest}${floor}` };
  if (diff > 0)
    return { state: "under", text: `${inr(diff)} a month under your budget.${rest}${floor}` };
  return { state: "over", text: `${inr(-diff)} a month over your budget.${rest}${floor}` };
}

/** Whether a site is free on the day a plan starts. "unknown" when the buyer has given no date. */
export function freeFor(
  l: Pick<Listing, "bookedUntil">,
  from: string | undefined,
): "free" | "booked" | "unknown" {
  if (!from) return "unknown";
  return l.bookedUntil !== null && l.bookedUntil >= new Date(from).getTime() ? "booked" : "free";
}

/** "650 m", "3.4 km". */
export function distanceText(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

/** The furthest any two of the sites are from each other. */
export function spanKm(items: { lat: number; lng: number }[]): number {
  let max = 0;
  for (let i = 0; i < items.length; i += 1)
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (a && b) max = Math.max(max, distanceKm(a, b));
    }
  return max;
}
