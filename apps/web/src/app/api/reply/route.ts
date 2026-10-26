import { rateLimited, seeOther } from "@/lib/forms";
import { findRequest, ownerReplies, type OwnerAnswer } from "@/lib/sites/enquiries";
import { ANSWERS, checkThreadKey, isReference, sameOrigin, type Answer } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/**
 * An owner's answer, sent from the link in their enquiry email. It goes straight to the buyer.
 * The link's key is what proves it is the owner; nothing is accepted without it.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "").trim();
  const key = String(form.get("k") ?? "").trim();
  if (!isReference(ref) || !checkThreadKey(ref, "owner", key))
    return new Response("Forbidden", { status: 403 });
  const back = (query: string) => seeOther(req, `/reply/${ref}/?k=${key}&${query}`);
  if (rateLimited(req, "reply", 30)) return back("error=busy");

  const request = await findRequest(ref);
  if (!request || request.enquiry.status === "pending")
    return new Response("Not found", { status: 404 });

  const body = String(form.get("body") ?? "")
    .trim()
    .slice(0, 4000);
  const answers: OwnerAnswer[] = [];
  for (const site of request.sites) {
    const a = String(form.get(`a-${site.id}`) ?? "");
    const quoteRaw = String(form.get(`q-${site.id}`) ?? "")
      .replace(/^[A-Za-z]{3}\b/, "")
      .replace(/[\s,₹$£€¥]/g, "");
    if (
      quoteRaw !== "" &&
      (!/^\d+$/.test(quoteRaw) || Number(quoteRaw) <= 0 || Number(quoteRaw) > 1e9)
    )
      return back("error=quote");
    answers.push({
      siteId: site.id,
      availability: a in ANSWERS ? (a as Answer) : null,
      quote: quoteRaw ? Number(quoteRaw) : null,
    });
  }
  if (!body && !answers.some((a) => a.availability || a.quote)) return back("error=empty");

  try {
    await ownerReplies(request, body, answers);
  } catch {
    return back("error=send");
  }
  return back("sent=1");
}
