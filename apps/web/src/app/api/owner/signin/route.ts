import { NextResponse } from "next/server";
import { cleanEmail, rateLimited, seeOther } from "@/lib/forms";
import { PASSWORD_MAX } from "@/lib/owners/password";
import { checkSignIn } from "@/lib/owners/server";
import { siteUrl } from "@/lib/seo";
import {
  BUYER_COOKIE_SECONDS,
  OWNER_BAR_COOKIE,
  OWNER_COOKIE,
  sameOrigin,
  signEmail,
} from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/**
 * Signs an owner in with their user name, which is their work email, and their password. A right
 * pair remembers this browser for 30 days, exactly as a code does.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const typed = String(form.get("email") ?? "")
    .trim()
    .slice(0, 254);
  // The user name goes back to the form after a mistake. The password never does.
  const back = (error: string) =>
    seeOther(req, `/sign-in/?${new URLSearchParams({ error, email: typed }).toString()}`);
  if (rateLimited(req, "owner-signin", 20)) return back("busy");
  const email = cleanEmail(typed);
  const password = String(form.get("password") ?? "");
  if (!email || !password || password.length > PASSWORD_MAX) return back("match");
  const result = await checkSignIn(email, password);
  if (!result.ok) return back(result.why);

  const res = new NextResponse(null, { status: 303, headers: { Location: "/owner/" } });
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
