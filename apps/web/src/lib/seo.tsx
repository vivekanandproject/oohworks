import type { Metadata } from "next";

export const SITE_NAME = "ohworks";
export const TAGLINE = "Every billboard, findable.";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

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
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: SITE_NAME,
    url: `${siteUrl()}/`,
    logo: {
      "@type": "ImageObject",
      url: absolute("/brand/ohworks-mark.svg"),
      width: 64,
      height: 64,
    },
    slogan: TAGLINE,
    description:
      "The open map of out-of-home advertising. Verified, public pages for billboards, hoardings and screens, where the media owner is always the seller.",
    contactPoint: [{ "@type": "ContactPoint", contactType: "press", email: "press@ohworks.com" }],
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
