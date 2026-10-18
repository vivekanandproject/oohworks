/**
 * What the app needs from whichever machine runs it, read in one place. On this Mac the values come
 * from `.env`; on Cloud Run from the service's settings and Secret Manager.
 *
 * Kept free of anything from Next.js, because the seed scripts and the CMS config read it too.
 */

/** The database the running app talks to. */
export function databaseUrl(): string {
  return process.env.DATABASE_URL || "";
}

/**
 * The secret that signs cookies, links and sessions. It must be set wherever the app runs; without it
 * the CMS refuses to start rather than sign anything with a guessable key.
 */
export function payloadSecret(): string {
  return process.env.PAYLOAD_SECRET || "";
}
