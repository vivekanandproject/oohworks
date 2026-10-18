import { NextResponse, type NextRequest } from "next/server";
import { permanentIdFromSlug } from "@ohworks/core";
import { hiddenFromSearch } from "@/lib/api/env";
import { isGone } from "@/lib/sites/gone";

/** A site's own page: /{country}/{city}/{locality}/{slug ending in its permanent id}/. */
const SITE_PAGE = /^\/[a-z]{2}\/[^/]+\/[^/]+\/([^/]+)\/?$/;

/**
 * 1. Origin check: in staging and prod Cloudflare injects X-Origin-Secret via a Transform
 *    Rule; a request that reaches Cloud Run without it is not from Cloudflare and gets 403.
 *    When ORIGIN_SECRET is unset (local dev) the check is off.
 * 2. Service role: the "jobs" service serves only the Inngest handler and health.
 * 3. Previews and staging (SITE_ENV) carry noindex on every answer, whatever a page says itself.
 * 4. A site that was taken down answers 410 Gone, and its page says so with similar sites nearby
 *    (src/lib/sites/gone.ts). A page cannot set its own status; the status set here is kept.
 * Health and the jobs on a timer skip the origin check: the host's checks and Cloud Scheduler call
 * Cloud Run directly, and /api/jobs/ asks for its own CRON_SECRET.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.SERVICE_ROLE === "jobs") {
    if (!pathname.startsWith("/api/inngest") && !pathname.startsWith("/api/health")) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  const secret = process.env.ORIGIN_SECRET;
  if (secret && !pathname.startsWith("/api/health") && !pathname.startsWith("/api/jobs/")) {
    if (req.headers.get("x-origin-secret") !== secret) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  const slug = SITE_PAGE.exec(pathname)?.[1];
  const id = slug ? permanentIdFromSlug(slug) : null;
  const res = id && (await isGone(id)) ? NextResponse.next({ status: 410 }) : NextResponse.next();
  if (hiddenFromSearch()) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  // Node, not the edge: the removed-site check talks to Postgres.
  runtime: "nodejs",
};
