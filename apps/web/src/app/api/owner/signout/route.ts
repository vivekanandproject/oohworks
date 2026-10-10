import { NextResponse } from "next/server";
import { OWNER_BAR_COOKIE, OWNER_COOKIE, sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Forgets this browser. The owner's sites are untouched; they sign in again with a new code. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: "/list-your-sites/?out=1" },
  });
  res.cookies.set(OWNER_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(OWNER_BAR_COOKIE, "", { sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
