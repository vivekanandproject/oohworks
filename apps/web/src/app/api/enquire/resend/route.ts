import { rateLimited, seeOther } from "@/lib/forms";
import { findGroup, issueCode } from "@/lib/sites/enquiries";
import { CODE_MINUTES, isAnyReference, sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Sends a new code, which replaces the old one. At most one every half minute. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "").trim();
  if (!isAnyReference(ref)) return seeOther(req, "/search/");
  const back = (query: string) => seeOther(req, `/enquire/confirm/?ref=${ref}&${query}`);
  if (rateLimited(req, "enquire-resend", 5)) return back("error=busy");

  const group = await findGroup(ref);
  if (!group) return seeOther(req, "/search/");
  if (!group.requests.some((r) => r.enquiry.status === "pending"))
    return seeOther(req, `/enquire/sent/?ref=${ref}`);
  const issuedAt = group.lead.codeExpiresAt
    ? new Date(group.lead.codeExpiresAt).getTime() - CODE_MINUTES * 60_000
    : 0;
  if (Date.now() - issuedAt < 30_000) return back("error=wait");
  try {
    await issueCode(group);
  } catch {
    return back("error=send");
  }
  return back("resent=1");
}
