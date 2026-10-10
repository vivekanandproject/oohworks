import { rateLimited, seeOther } from "@/lib/forms";
import { findEnquiry, issueCode } from "@/lib/sites/enquiries";
import { CODE_MINUTES, isReference, sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Sends a new code, which replaces the old one. At most one every half minute. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "").trim();
  if (!isReference(ref)) return seeOther(req, "/search/");
  const back = (query: string) => seeOther(req, `/enquire/confirm/?ref=${ref}&${query}`);
  if (rateLimited(req, "enquire-resend", 5)) return back("error=busy");

  const found = await findEnquiry(ref);
  if (!found) return seeOther(req, "/search/");
  if (found.enquiry.status !== "pending") return seeOther(req, `/enquire/sent/?ref=${ref}`);
  const issuedAt = found.enquiry.codeExpiresAt
    ? new Date(found.enquiry.codeExpiresAt).getTime() - CODE_MINUTES * 60_000
    : 0;
  if (Date.now() - issuedAt < 30_000) return back("error=wait");
  try {
    await issueCode(found);
  } catch {
    return back("error=send");
  }
  return back("resent=1");
}
