import type { Instrumentation } from "next";
import { siteEnv } from "@/lib/api/env";
import { PRIVATE } from "@/lib/sentry";

/**
 * Error reports to Sentry, only when SENTRY_DSN is set. Server and edge code report here; the browser
 * reports from instrumentation-client.ts. No personal data is sent (src/lib/sentry.ts).
 */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: siteEnv(),
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    dataCollection: PRIVATE,
  });
}

/** Errors thrown while answering a request, with the route that threw them. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
