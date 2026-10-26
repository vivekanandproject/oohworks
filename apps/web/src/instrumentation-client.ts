/**
 * Browser error reports to Sentry, only when NEXT_PUBLIC_SENTRY_DSN is set at build. Without it this
 * file is empty once built; with it, the reporter loads after the page, so it costs the page nothing.
 */
import { PRIVATE } from "@/lib/sentry";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  // The same names as the server's SITE_ENV, read from the address: one image serves every host.
  const environment = location.hostname === "oohworks.co" ? "production" : "other";
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({ dsn, environment, tracesSampleRate: 0, dataCollection: PRIVATE }),
  );
}
