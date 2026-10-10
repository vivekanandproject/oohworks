import { NextResponse } from "next/server";
import { rateLimited, seeOther } from "@/lib/forms";
import { siteUrl } from "@/lib/seo";
import { countAttempt, deliver, findEnquiry } from "@/lib/sites/enquiries";
import {
  BUYER_COOKIE,
  BUYER_COOKIE_SECONDS,
  MAX_ATTEMPTS,
  hashCode,
  isReference,
  sameHash,
  sameOrigin,
  signBuyer,
} from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Checks the emailed code. A right one sends the enquiry to the owner and remembers this browser for 30 days. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "").trim();
  if (!isReference(ref)) return seeOther(req, "/search/");
  const back = (error: string) => seeOther(req, `/enquire/confirm/?ref=${ref}&error=${error}`);
  if (rateLimited(req, "enquire-confirm", 20)) return back("busy");

  const found = await findEnquiry(ref);
  if (!found) return seeOther(req, "/search/");
  const { enquiry } = found;
  if (enquiry.status !== "pending") return seeOther(req, `/enquire/sent/?ref=${ref}`);
  if (
    !enquiry.codeHash ||
    !enquiry.codeExpiresAt ||
    new Date(enquiry.codeExpiresAt).getTime() < Date.now()
  )
    return back("expired");
  if ((enquiry.attempts ?? 0) >= MAX_ATTEMPTS) return back("locked");

  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6 || !sameHash(hashCode(code, ref), enquiry.codeHash)) {
    await countAttempt(enquiry);
    return back((enquiry.attempts ?? 0) + 1 >= MAX_ATTEMPTS ? "locked" : "wrong");
  }

  try {
    await deliver({ ...found, enquiry: { ...enquiry, verifiedAt: new Date().toISOString() } });
  } catch {
    return back("send");
  }
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: `/enquire/sent/?ref=${ref}` },
  });
  res.cookies.set(BUYER_COOKIE, signBuyer(enquiry.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: siteUrl().startsWith("https://"),
    path: "/",
    maxAge: BUYER_COOKIE_SECONDS,
  });
  return res;
}
