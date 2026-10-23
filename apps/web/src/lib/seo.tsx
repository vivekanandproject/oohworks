import type { Metadata } from "next";
import { siteUrl } from "./hosting";

export { siteUrl };

export const SITE_NAME = "OOHWORKS";
export const TAGLINE = "Every billboard, findable.";

export function absolute(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Editions a page actually exists in. hreflang is generated from this list, never hard-coded. */
export interface EditionAlternate {
  hrefLang: string;
  path: string;
}

export function alternates(
  path: string,
  editions: EditionAlternate[] = [],
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = { "x-default": absolute(path) };
  for (const e of editions) languages[e.hrefLang] = absolute(e.path);
  return { canonical: absolute(path), languages };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    // A news publisher as well as a marketplace: NewsMediaOrganization is an Organization, so both hold.
    "@type": "NewsMediaOrganization",
    "@id": `${siteUrl()}/#organization`,
    name: SITE_NAME,
    url: `${siteUrl()}/`,
    logo: {
      "@type": "ImageObject",
      url: absolute("/brand/oohworks-logo-512.png"),
      width: 512,
      height: 512,
    },
    // Only pages that exist. The masthead, standards and ownership pages join once the company's
    // details are in (docs/oohworks-article-discoverability-plan.md, section 5).
    publishingPrinciples: absolute("/charter/"),
    correctionsPolicy: absolute("/newsroom/corrections/"),
    slogan: TAGLINE,
    description:
      "The open map of out-of-home advertising. Verified, public pages for billboards, hoardings and screens, where the media owner is always the seller.",
    contactPoint: [{ "@type": "ContactPoint", contactType: "press", email: "press@oohworks.co" }],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    url: `${siteUrl()}/`,
    name: SITE_NAME,
    publisher: { "@id": `${siteUrl()}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl()}/search/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is data, not markup; escaping "<" keeps it safe inside a script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
