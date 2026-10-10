import { cookies } from "next/headers";
import { isPermanentId } from "@ohworks/core";
import { rateLimited, seeOther } from "@/lib/forms";
import { createRequests, deliverGroup, issueCode, recentFrom } from "@/lib/sites/enquiries";
import { BUYER_COOKIE, readBuyer, sameOrigin } from "@/lib/sites/enquiry";
import { echo, fieldError, readFields } from "@/lib/sites/enquiry-form";
import { getSite } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

/**
 * Takes an enquiry about one site. A buyer this browser has already confirmed goes straight to the
 * owner; anyone else is sent a code first. Nothing reaches an owner from an unconfirmed address.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const id = String(form.get("id") ?? "")
    .trim()
    .slice(0, 12);
  if (!isPermanentId(id)) return seeOther(req, "/search/");
  const fields = readFields(form);
  if (fields.trap) return seeOther(req, `/enquire/${id}/`);
  const back = (error: string) =>
    seeOther(req, `/enquire/${id}/?${echo(fields, error).toString()}`);
  if (rateLimited(req, "enquire", 20)) return back("busy");

  const found = await getSite(id);
  if (!found || found.site.removed || !found.owner) return seeOther(req, "/search/");

  const now = Date.now();
  const problem = fieldError(fields, now);
  if (problem || !fields.email) return back(problem ?? "email");
  if ((await recentFrom(fields.email, now)) >= 5) return back("busy");

  const group = await createRequests({
    items: [{ owner: found.owner, sites: [found.site] }],
    email: fields.email,
    from: fields.from,
    to: fields.to,
    brand: fields.brand,
    budget: fields.budget,
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
