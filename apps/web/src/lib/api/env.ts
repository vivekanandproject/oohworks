/**
 * Which environment this is, from SITE_ENV: local, test, preview, staging or production. Without it, a
 * production build counts as production, so a forgotten setting hides what production must not show
 * rather than showing it.
 */
export type SiteEnv = "local" | "test" | "preview" | "staging" | "production";

const KNOWN: readonly SiteEnv[] = ["local", "test", "preview", "staging", "production"];

export function siteEnv(): SiteEnv {
  const given = process.env.SITE_ENV as SiteEnv | undefined;
  if (given && KNOWN.includes(given)) return given;
  return process.env.NODE_ENV === "production" ? "production" : "local";
}

/** Previews and staging are for staff: search engines are told to keep out of every page. */
export function hiddenFromSearch(): boolean {
  const env = siteEnv();
  return env === "preview" || env === "staging";
}

/** The internal API reference is for the team: shown everywhere except production. */
export function internalDocsShown(): boolean {
  return siteEnv() !== "production";
}
