import { rateLimited, seeOther } from "@/lib/forms";
import { buyerWrites, findGroup, recentBuyerMessages } from "@/lib/sites/enquiries";
import { checkThreadKey, isAnyReference, sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** A buyer's follow-up to one owner, sent from the link in their confirmation email. It goes straight to that owner. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "").trim();
  const key = String(form.get("k") ?? "").trim();
  if (!isAnyReference(ref) || !checkThreadKey(ref, "buyer", key))
    return new Response("Forbidden", { status: 403 });
  const to = String(form.get("to") ?? "").trim();
  const back = (query: string) => seeOther(req, `/enquiries/${ref}/?k=${key}&${query}#${to}`);
  if (rateLimited(req, "thread", 30)) return back("error=busy");

  const group = await findGroup(ref);
  const request = group?.requests.find((r) => r.enquiry.reference === to);
  if (!group || !request || request.enquiry.status === "pending")
    return new Response("Not found", { status: 404 });
  const body = String(form.get("body") ?? "")
    .trim()
    .slice(0, 4000);
  if (body.length < 2) return back("error=empty");
  if ((await recentBuyerMessages(request.enquiry.id, Date.now())) >= 10) return back("error=busy");
  try {
    await buyerWrites(request, body);
  } catch {
    return back("error=send");
  }
  return back("sent=1");
}
