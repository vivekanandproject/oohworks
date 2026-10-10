import { NextResponse } from "next/server";
import { rateLimited, seeOther } from "@/lib/forms";
import { siteUrl } from "@/lib/seo";
import { countAttempt, deliverGroup, findGroup } from "@/lib/sites/enquiries";
import {
  BUYER_COOKIE,
  BUYER_COOKIE_SECONDS,
  MAX_ATTEMPTS,
  hashCode,
  isAnyReference,
  sameHash,
  sameOrigin,
  signBuyer,
} from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Checks the emailed code. A right one sends the enquiry to its owners and remembers this browser for 30 days. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const ref = String(form.get("ref") ?? "").trim();
  if (!isAnyReference(ref)) return seeOther(req, "/search/");
  const back = (error: string) => seeOther(req, `/enquire/confirm/?ref=${ref}&error=${error}`);
  if (rateLimited(req, "enquire-confirm", 20)) return back("busy");

  const group = await findGroup(ref);
  if (!group) return seeOther(req, "/search/");
  const { lead } = group;
  if (!group.requests.some((r) => r.enquiry.status === "pending"))
    return seeOther(req, `/enquire/sent/?ref=${ref}`);
  if (!lead.codeHash || !lead.codeExpiresAt || new Date(lead.codeExpiresAt).getTime() < Date.now())
    return back("expired");
  if ((lead.attempts ?? 0) >= MAX_ATTEMPTS) return back("locked");

  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6 || !sameHash(hashCode(code, ref), lead.codeHash)) {
    await countAttempt(lead);
    return back((lead.attempts ?? 0) + 1 >= MAX_ATTEMPTS ? "locked" : "wrong");
  }

  try {
    await deliverGroup(group);
  } catch {
    return back("send");
  }
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: `/enquire/sent/?ref=${ref}` },
  });
  res.cookies.set(BUYER_COOKIE, signBuyer(group.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: siteUrl().startsWith("https://"),
    path: "/",
    maxAge: BUYER_COOKIE_SECONDS,
  });
  return res;
}
