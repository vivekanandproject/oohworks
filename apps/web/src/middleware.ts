import { NextResponse, type NextRequest } from "next/server";
import { permanentIdFromSlug } from "@ohworks/core";
import { hiddenFromSearch } from "@/lib/api/env";
import { isGone } from "@/lib/sites/gone";

/** A site's own page: /{country}/{city}/{locality}/{slug ending in its permanent id}/. */
const SITE_PAGE = /^\/[a-z]{2}\/[^/]+\/[^/]+\/([^/]+)\/?$/;

/** The Markdown copy of a piece: its own address with ".md" for the closing slash (/news/{slug}.md). */
const MARKDOWN = /^\/(news|analysis|guides|academy|data|showcase)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
/** The Markdown copy of a site page: /{country}/{city}/{locality}/{slug ending in its unit id}.md. */
const SITE_MARKDOWN = /^\/[a-z]{2}\/[^/]+\/[^/]+\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
/** Plain-text guides for owners and the agents acting for them: /for-owners.md, /list-your-sites.md. */
const GUIDE_MARKDOWN = /^\/(for-owners|list-your-sites)\.md$/;

/**
 * 1. Origin check: in staging and prod Cloudflare injects X-Origin-Secret via a Transform
 *    Rule; a request that reaches Cloud Run without it is not from Cloudflare and gets 403.
 *    When ORIGIN_SECRET is unset (local dev) the check is off.
 * 2. Service role: the "jobs" service serves only the Inngest handler and health.
 * 3. Previews and staging (SITE_ENV) carry noindex on every answer, whatever a page says itself.
 * 4. A site that was taken down answers 410 Gone, and its page says so with similar sites nearby
 *    (src/lib/sites/gone.ts). A page cannot set its own status; the status set here is kept.
 * 5. Security headers on every answer, with a Content Security Policy that names each host the
 *    browser may load from and a nonce for the page's own scripts (securityHeaders below).
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
  const md = MARKDOWN.exec(pathname);
  if (md) return NextResponse.rewrite(new URL(`/api/md/${md[1]}/${md[2]}/`, req.url));
  const siteMd = SITE_MARKDOWN.exec(pathname);
  if (siteMd) return NextResponse.rewrite(new URL(`/api/md-site/${siteMd[1]}/`, req.url));
  if (GUIDE_MARKDOWN.test(pathname))
    return NextResponse.rewrite(new URL(`/api/md-guide/owners/`, req.url));

  const slug = SITE_PAGE.exec(pathname)?.[1];
  const id = slug ? permanentIdFromSlug(slug) : null;
  // Web Crypto, which the dev bundler accepts for either runtime; node:crypto it does not.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  // Next reads the nonce from this request header and puts it on every script it writes.
  const headers = new Headers(req.headers);
  const secure =
    req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  headers.set("Content-Security-Policy", policy(nonce, pathname, secure));
  const init = { request: { headers } };
  const res =
    id && (await isGone(id))
      ? NextResponse.next({ ...init, status: 410 })
      : NextResponse.next(init);
  for (const [name, value] of securityHeaders(nonce, pathname, secure))
    res.headers.set(name, value);
  if (hiddenFromSearch()) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

/** The hosts the browser may load from, beyond this site. */
const MAP_HOST = (() => {
  try {
    return new URL(process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org").origin;
  } catch {
    return "https://tiles.openfreemap.org";
  }
})();
const IMAGE_HOST = (() => {
  try {
    return process.env.R2_PUBLIC_BASE_URL ? new URL(process.env.R2_PUBLIC_BASE_URL).origin : "";
  } catch {
    return "";
  }
})();
const SENTRY_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SENTRY_DSN
      ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin
      : "";
  } catch {
    return "";
  }
})();

/**
 * What the page may load: its own files, the map's tiles, fonts and sprites, photographs from the
 * public bucket, and error reports to Sentry. Scripts need the nonce; the one inline style the
 * reveal fallback writes needs 'unsafe-inline' for styles, which the map library also needs. The
 * CMS (/admin) and the API reference (/api/docs) run vendored scripts of their own, so they get the
 * same policy without the nonce rule on scripts.
 */
function policy(nonce: string, pathname: string, secure: boolean): string {
  const own = pathname.startsWith("/admin") || pathname.startsWith("/api/docs");
  const scripts = own ? "'self' 'unsafe-inline'" : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connect = ["'self'", MAP_HOST, SENTRY_HOST].filter(Boolean).join(" ");
  const images = ["'self'", "data:", "blob:", MAP_HOST, IMAGE_HOST].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    `script-src ${scripts}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${images}`,
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Only once the page itself came over https: a test build on plain http must not be upgraded.
    ...(secure ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function securityHeaders(nonce: string, pathname: string, secure: boolean): [string, string][] {
  return [
    ["Content-Security-Policy", policy(nonce, pathname, secure)],
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=(), usb=()"],
    ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
    ["Cross-Origin-Opener-Policy", "same-origin"],
  ];
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  // Node, not the edge: the removed-site check talks to Postgres.
  runtime: "nodejs",
};
