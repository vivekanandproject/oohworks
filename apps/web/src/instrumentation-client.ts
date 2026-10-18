/**
 * Browser error reports to Sentry, only when NEXT_PUBLIC_SENTRY_DSN is set at build. Without it this
 * file is empty once built; with it, the reporter loads after the page, so it costs the page nothing.
 */
import { PRIVATE } from "@/lib/sentry";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({ dsn, tracesSampleRate: 0, dataCollection: PRIVATE }),
  );
}
