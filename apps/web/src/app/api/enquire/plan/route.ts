import { cookies } from "next/headers";
import { rateLimited, seeOther } from "@/lib/forms";
import { createRequests, deliverGroup, issueCode, recentFrom } from "@/lib/sites/enquiries";
import { BUYER_COOKIE, readBuyer, sameOrigin } from "@/lib/sites/enquiry";
import { echo, fieldError, readFields } from "@/lib/sites/enquiry-form";
import { LISTS, parseIds } from "@/lib/sites/lists";
import { cardsFor } from "@/lib/sites/queries";
import type { Owner, Site } from "@/payload-types";

export const dynamic = "force-dynamic";

/** The most owners one submission may reach. A longer shortlist is sent in parts. */
const MAX_OWNERS = 25;

/**
 * Takes one enquiry about a whole shortlist and splits it into one request per owner. Each owner is
 * told about their own sites only, never the rest of the shortlist, and the buyer's budget for the
 * whole plan is never passed on.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const fields = readFields(form);
  const ids = parseIds(form.getAll("ids").map(String).join(","), LISTS.saved.max);
  if (fields.trap) return seeOther(req, "/shortlist/");
  const back = (error: string) => {
    const q = echo({ ...fields, budget: null }, error);
    if (ids.length) q.set("sites", ids.join(","));
    return seeOther(req, `/enquire/plan/?${q.toString().replace(/%2C/g, ",")}`);
  };
  if (rateLimited(req, "enquire", 20)) return back("busy");
  if (ids.length === 0) return back("sites");

  const byOwner = new Map<number, { owner: Owner; sites: Site[] }>();
  for (const card of await cardsFor(ids)) {
    if (!card.owner) continue;
    const entry = byOwner.get(card.owner.id) ?? { owner: card.owner, sites: [] };
    entry.sites.push(card.site);
    byOwner.set(card.owner.id, entry);
  }
  const items = [...byOwner.values()];
  if (items.length === 0) return back("sites");
  if (items.length > MAX_OWNERS) return back("owners");

  const now = Date.now();
  const problem = fieldError({ ...fields, budgetRaw: "", budget: null }, now);
  if (problem || !fields.email) return back(problem ?? "email");
  if ((await recentFrom(fields.email, now)) >= 5) return back("busy");

  const group = await createRequests({
    items,
    email: fields.email,
    from: fields.from,
    to: fields.to,
    brand: fields.brand,
    budget: null,
    artwork: fields.artwork,
    message: fields.message,
  });
  const known = readBuyer((await cookies()).get(BUYER_COOKIE)?.value);
  try {
    if (known === fields.email) {
      await deliverGroup(group);
      return seeOther(req, `/enquire/sent/?ref=${group.ref}`);
    }
    await issueCode(group);
  } catch {
    return back("send");
  }
  return seeOther(req, `/enquire/confirm/?ref=${group.ref}`);
}
