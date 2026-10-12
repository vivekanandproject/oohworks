import { createHash } from "node:crypto";

/**
 * What the app needs from whichever machine runs it, read in one place so a host can supply it under
 * its own names. On this Mac and in Docker the values come from `.env`. Netlify provides a database
 * of its own under NETLIFY_DATABASE_URL.
 *
 * Kept free of anything from Next.js, because the seed scripts and the CMS config read it too.
 */

/** The database the running app talks to. On a serverless host this is the pooled address. */
export function databaseUrl(): string {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || "";
}

/** A direct address, for creating tables. A pooled connection cannot run every statement. */
export function directDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL_UNPOOLED || databaseUrl()
  );
}

/**
 * The secret that signs cookies, links and sessions. Set PAYLOAD_SECRET wherever the app really
 * runs. Where it is missing but a database is given, as on a preview host set up with no settings
 * at all, one is worked out from the database address: that is private, and stays the same from one
 * build to the next, so nobody is signed out by a deploy.
 */
export function payloadSecret(): string {
  if (process.env.PAYLOAD_SECRET) return process.env.PAYLOAD_SECRET;
  const from =
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.DATABASE_URL;
  return from ? createHash("sha256").update(`ohworks:${from}`).digest("hex") : "";
}
