import { isPermanentId } from "@ohworks/core";
import { go, ownerGate, text } from "@/lib/owners/request";
import { stateOf } from "@/lib/owners/progress";
import { ownerSite, quickUpdate } from "@/lib/owners/server";
import { readDate } from "@/lib/owners/site-input";
import { indiaDate } from "@/lib/sites/calendar";

export const dynamic = "force-dynamic";

/**
 * The owner's own facts on a live site: the price, how it shows, and availability. These change at
 * once, with no review, because they are the owner's to set.
 */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "quick");
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  const id = text(form, "id", 12);
  const site = owner && isPermanentId(id) ? await ownerSite(owner.id, id) : null;
  if (!site) return go("/owner/");
  const back = (query: string) => go(`/owner/sites/${id}/?${query}#update`);
  if (stateOf(site) !== "live") return back("qerror=notlive");

  const mode = text(form, "priceDisplay", 12);
  const priceDisplay =
    mode === "exact" || mode === "from" || mode === "on_request" ? mode : site.priceDisplay;
  const rateRaw = text(form, "rate", 20).replace(/[₹,\s]/g, "");
  const rate = rateRaw === "" ? null : /^\d+$/.test(rateRaw) ? Number(rateRaw) : Number.NaN;
  if (rate !== null && (Number.isNaN(rate) || rate <= 0 || rate > 1e9)) return back("qerror=rate");
  if (priceDisplay !== "on_request" && rate === null) return back("qerror=norate");
  let bookedUntil: string | null = null;
  if (text(form, "availability", 10) === "booked") {
    const date = readDate(text(form, "bookedUntil", 20));
    if (date === null || date === "bad" || date < indiaDate(Date.now())) return back("qerror=date");
    bookedUntil = date;
  }
  await quickUpdate(site, {
    priceDisplay,
    rate: priceDisplay === "on_request" ? null : rate,
    bookedUntil,
  });
  return back("updated=1");
}
