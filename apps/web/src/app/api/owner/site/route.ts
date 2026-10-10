import { isPermanentId } from "@ohworks/core";
import { readCoords } from "@/lib/owners/coords";
import { go, ownerGate, text } from "@/lib/owners/request";
import { ownerSite, saveSite } from "@/lib/owners/server";
import { stateOf } from "@/lib/owners/progress";
import { FIELD_KEYS, checkSite, type Raw } from "@/lib/owners/site-input";
import { indiaDate } from "@/lib/sites/calendar";

export const dynamic = "force-dynamic";

/**
 * Saves one site from the owner's form, as a draft only they can see. Mistakes go back to the form
 * with what was typed and each problem named, so nothing has to be entered twice.
 */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "site");
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  if (!owner) return go("/owner/company/");
  const id = text(form, "id", 12);
  const existing = id ? (isPermanentId(id) ? await ownerSite(owner.id, id) : null) : null;
  if (id && !existing) return go("/owner/");
  if (existing && stateOf(existing) === "live") return go(`/owner/sites/${id}/`);

  const raw: Raw = {};
  for (const key of FIELD_KEYS) raw[key] = text(form, key, 300);
  // A pasted position becomes the two numbers here as well as in the browser, so the form reads the
  // same whether or not the page's script had loaded when the owner pasted it.
  if (!raw.lat && !raw.lng && raw.place) {
    const found = readCoords(raw.place);
    if (found) {
      raw.lat = found.lat.toFixed(5);
      raw.lng = found.lng.toFixed(5);
      raw.place = "";
    }
  }
  // "Free now" clears any date left in the field from before.
  if (text(form, "availability", 10) !== "booked") raw.bookedUntil = "";
  const checked = checkSite(raw, indiaDate(Date.now()));
  if (!checked.ok) {
    const q = new URLSearchParams();
    for (const key of FIELD_KEYS) if (raw[key]) q.set(key, raw[key] as string);
    q.set("availability", text(form, "availability", 10) === "booked" ? "booked" : "free");
    q.set("e", Object.keys(checked.errors).join(","));
    return go(`${existing ? `/owner/sites/${id}/edit/` : "/owner/sites/new/"}?${q.toString()}`);
  }
  const site = await saveSite(owner, checked.site, "form", existing);
  return go(`/owner/sites/${site.permanentId}/?saved=1`);
}
