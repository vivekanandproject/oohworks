import { siteEnv } from "@/lib/api/env";

/**
 * Google Analytics 4, in production only and only once the visitor allows it (Consent Mode v2).
 * GA_MEASUREMENT_ID is read when a page is served, so one image serves every environment; staging,
 * previews and local builds never send a hit, even when the setting is present.
 */
export function gaMeasurementId(): string {
  const id = process.env.GA_MEASUREMENT_ID?.trim() ?? "";
  return siteEnv() === "production" && /^G-[A-Z0-9]{4,}$/.test(id) ? id : "";
}

/** The visitor's choice: "granted" or "denied". Remembered for 180 days, then asked again. */
export const CONSENT_COOKIE = "oh_consent";
export const CONSENT_SECONDS = 180 * 24 * 3600;

/** The hosts Google Analytics loads from and reports to, for the Content Security Policy. */
export const GA_CONNECT = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://www.googletagmanager.com",
];
export const GA_IMAGES = ["https://*.google-analytics.com", "https://www.googletagmanager.com"];

/**
 * The inline start of Google's tag, written into the page head with the request's nonce. Everything
 * starts denied; a stored "granted" lifts analytics storage before the first hit. Advertising
 * storage stays denied: the site runs no ads. gtag.js itself is fetched once the browser is idle, so
 * it never competes with the page for the first paint (docs/ohworks-landing-page.md, INP).
 */
export function gaBootScript(id: string): string {
  return [
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}",
    `var c=(document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=(granted|denied)/)||[])[1];`,
    "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',",
    "analytics_storage:c==='granted'?'granted':'denied',wait_for_update:500});",
    "gtag('set','ads_data_redaction',true);gtag('js',new Date());",
    // Page views are sent by <GaPageViews>, with the address cleaned (pagePath below).
    `gtag('config','${id}',{send_page_view:false});`,
    "var l=function(){var s=document.createElement('script');s.async=true;",
    `s.src='https://www.googletagmanager.com/gtag/js?id=${id}';document.head.appendChild(s)};`,
    "if('requestIdleCallback'in window)requestIdleCallback(l,{timeout:3000});",
    "else addEventListener('load',function(){setTimeout(l,1)});",
  ].join("");
}

/** Paths whose last part is a private reference: an enquiry, a reply link, an email result, a site being edited. */
const PRIVATE = /^\/(enquiries|reply|quick|email)\/[^/]+|^\/owner\/sites\/[^/]+/;

/**
 * The address as Google may see it. Query strings carry sign-in codes, tokens and enquiry references,
 * so they are dropped everywhere but search, whose filters say what people look for. Private
 * references in a path become ":ref".
 */
export function pagePath(pathname: string, search: string): string {
  const path = pathname.replace(PRIVATE, (m) => m.replace(/\/[^/]+$/, "/:ref"));
  return pathname.startsWith("/search") && search ? `${path}?${search.replace(/^\?/, "")}` : path;
}

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | undefined {
  return typeof window === "undefined" ? undefined : (window as { gtag?: Gtag }).gtag;
}

/**
 * Tells Google's tag which page this is, cleaned, so every later hit (page view, scroll, outbound
 * click, engagement) carries the clean address rather than the raw one. A referrer from this site is
 * cleaned the same way; one from elsewhere arrives as its origin only (Referrer-Policy).
 */
export function setPage(path: string, referrer: string): void {
  let ref = referrer;
  if (ref.startsWith(location.origin)) {
    const u = new URL(ref);
    ref = location.origin + pagePath(u.pathname, u.search);
  }
  gtag()?.("set", { page_location: location.origin + path, page_referrer: ref });
}

/** The stored choice, read in the browser; null until the visitor has answered. */
export function readConsent(): "granted" | "denied" | null {
  if (typeof document === "undefined") return null;
  const m = new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`).exec(document.cookie);
  return (m?.[1] as "granted" | "denied" | undefined) ?? null;
}

/** Stores the visitor's answer and tells Google's tag straight away. */
export function saveConsent(choice: "granted" | "denied"): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${choice}; Max-Age=${CONSENT_SECONDS}; Path=/; SameSite=Lax${secure}`;
  gtag()?.("consent", "update", { analytics_storage: choice });
  window.dispatchEvent(new Event("oh:consent"));
}

/** Forgets the answer, so the banner asks again (the "Change your choice" button on /cookies/). */
export function clearConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  gtag()?.("consent", "update", { analytics_storage: "denied" });
  window.dispatchEvent(new Event("oh:consent"));
}

/**
 * One named moment worth counting, such as an enquiry sent. Does nothing without Google's tag or
 * without consent (the tag then sends a cookieless signal at most). Never pass a name, email,
 * phone or message text: Google's terms forbid personal data in events.
 */
export function track(event: string, params: Record<string, string | number> = {}): void {
  gtag()?.("event", event, params);
}
