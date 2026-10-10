import { cookies } from "next/headers";
import { isPermanentId } from "@ohworks/core";
import { cleanEmail, rateLimited, seeOther } from "@/lib/forms";
import { indiaDate } from "@/lib/sites/calendar";
import {
  ARTWORK,
  createEnquiry,
  deliver,
  issueCode,
  recentFrom,
  type Artwork,
} from "@/lib/sites/enquiries";
import { BUYER_COOKIE, readBuyer, sameOrigin } from "@/lib/sites/enquiry";
import { getSite } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600 * 1000;
const isDate = (v: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

/**
 * Takes an enquiry about one site. A buyer this browser has already confirmed goes straight to the
 * owner; anyone else is sent a code first. Nothing reaches an owner from an unconfirmed address.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const text = (name: string, max: number): string =>
    String(form.get(name) ?? "")
      .trim()
      .slice(0, max);

  const id = text("id", 12);
  if (!isPermanentId(id)) return seeOther(req, "/search/");
  if (text("website", 10)) return seeOther(req, `/enquire/${id}/`);

  const from = text("from", 10);
  const to = text("to", 10);
  const brand = text("brand", 120);
  const budgetRaw = text("budget", 20).replace(/[\s,₹]/g, "");
  const artworkRaw = text("artwork", 20);
  const artwork: Artwork = artworkRaw in ARTWORK ? (artworkRaw as Artwork) : "not_started";
  const message = text("message", 2000);

  // What comes back to the form on a mistake. The email and the message stay out of the address bar.
  const back = (error: string) => {
    const q = new URLSearchParams({ error });
    if (isDate(from)) q.set("from", from);
    if (isDate(to)) q.set("to", to);
    if (brand) q.set("brand", brand);
    if (/^\d+$/.test(budgetRaw)) q.set("budget", budgetRaw);
    q.set("artwork", artwork);
    return seeOther(req, `/enquire/${id}/?${q.toString()}`);
  };

  if (rateLimited(req, "enquire", 20)) return back("busy");

  const found = await getSite(id);
  if (!found || found.site.removed || !found.owner) return seeOther(req, "/search/");

  const now = Date.now();
  if (
    !isDate(from) ||
    !isDate(to) ||
    from < indiaDate(now) ||
    to < from ||
    new Date(to).getTime() - new Date(from).getTime() > 730 * DAY
  )
    return back("dates");
  if (brand.length < 2) return back("brand");
  const budget = budgetRaw === "" ? null : Number(budgetRaw);
  if (budget !== null && (!/^\d+$/.test(budgetRaw) || budget <= 0 || budget > 1e9))
    return back("budget");
  const email = cleanEmail(form.get("email"));
  if (!email) return back("email");
  if ((await recentFrom(email, now)) >= 5) return back("busy");

  const enquiry = await createEnquiry({
    site: found.site,
    owner: found.owner,
    email,
    from,
    to,
    brand,
    budget,
    artwork,
    message,
  });
  const bundle = { enquiry, site: found.site, owner: found.owner };
  const known = readBuyer((await cookies()).get(BUYER_COOKIE)?.value);
  try {
    if (known === email) {
      await deliver(bundle);
      return seeOther(req, `/enquire/sent/?ref=${enquiry.reference}`);
    }
    await issueCode(bundle);
  } catch {
    return back("send");
  }
  return seeOther(req, `/enquire/confirm/?ref=${enquiry.reference}`);
}
