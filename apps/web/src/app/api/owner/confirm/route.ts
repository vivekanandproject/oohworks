import { NextResponse } from "next/server";
import { rateLimited, seeOther } from "@/lib/forms";
import { siteUrl } from "@/lib/seo";
import { checkCode, ownerByEmail } from "@/lib/owners/server";
import {
  BUYER_COOKIE_SECONDS,
  OWNER_BAR_COOKIE,
  OWNER_COOKIE,
  sameOrigin,
  signEmail,
} from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Checks the emailed code. A right one remembers this browser as the owner's for 30 days. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const token = String(form.get("t") ?? "").trim();
  const via = form.get("via") === "signin" ? "&via=signin" : "";
  const back = (error: string) =>
    seeOther(req, `/list-your-sites/confirm/?t=${encodeURIComponent(token)}${via}&error=${error}`);
  if (rateLimited(req, "owner-confirm", 20)) return back("busy");
  const result = await checkCode(token, String(form.get("code") ?? "").replace(/\D/g, ""));
  if (!result.ok)
    return result.why === "missing"
      ? seeOther(req, "/list-your-sites/?error=again")
      : back(result.why);
  const known = await ownerByEmail(result.email);
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: known ? "/owner/" : "/owner/company/" },
  });
  const secure = siteUrl().startsWith("https://");
  res.cookies.set(OWNER_COOKIE, signEmail("owner", result.email), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: BUYER_COOKIE_SECONDS,
  });
  res.cookies.set(OWNER_BAR_COOKIE, "owner", {
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: BUYER_COOKIE_SECONDS,
  });
  return res;
}
