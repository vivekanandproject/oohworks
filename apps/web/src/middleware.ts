import { NextResponse, type NextRequest } from "next/server";
import { hiddenFromSearch } from "@/lib/api/env";

/**
 * 1. Origin check: in staging and prod Cloudflare injects X-Origin-Secret via a Transform
 *    Rule; a request that reaches Cloud Run without it is not from Cloudflare and gets 403.
 *    When ORIGIN_SECRET is unset (local dev) the check is off.
 * 2. Service role: the "jobs" service serves only the Inngest handler and health.
 * 3. Previews and staging (SITE_ENV) carry noindex on every answer, whatever a page says itself.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.SERVICE_ROLE === "jobs") {
    if (!pathname.startsWith("/api/inngest") && !pathname.startsWith("/api/health")) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  const secret = process.env.ORIGIN_SECRET;
  if (secret && !pathname.startsWith("/api/health")) {
    if (req.headers.get("x-origin-secret") !== secret) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  const res = NextResponse.next();
  if (hiddenFromSearch()) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
