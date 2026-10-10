import type { Person } from "@/payload-types";
import { absolute, siteUrl } from "@/lib/seo";
import { picture } from "./media";
import { PILLARS } from "./pillars";
import type { Piece } from "./queries";

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absolute(t.path),
    })),
  };
}

function authorRef(a: Person) {
  return {
    "@type": "Person",
    name: a.name,
    ...(a.slug ? { url: absolute(`/authors/${a.slug}/`) } : {}),
  };
}

/** NewsArticle for news, Article for everything else, Report for the data pillar. Dates are the real ones. */
export function articleJsonLd(piece: Piece, sourceUrls: string[]) {
  const hero = picture(piece.hero, "hero");
  return {
    "@context": "https://schema.org",
    "@type": PILLARS[piece.pillar].schemaType,
    headline: piece.title,
    description: piece.standfirst,
    datePublished: piece.publishedAt,
    dateModified: piece.updatedAt,
    author: piece.authors.map(authorRef),
    publisher: { "@id": `${siteUrl()}/#organization` },
    mainEntityOfPage: absolute(piece.url),
    articleSection: PILLARS[piece.pillar].label,
    isAccessibleForFree: true,
    inLanguage: "en",
    ...(hero ? { image: [absolute(hero.src)] } : {}),
    ...(sourceUrls.length ? { citation: sourceUrls } : {}),
  };
}

export function personJsonLd(person: Person) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.role,
    description: person.bio,
    ...(person.slug ? { url: absolute(`/authors/${person.slug}/`) } : {}),
    worksFor: { "@id": `${siteUrl()}/#organization` },
    ...(person.links?.length ? { sameAs: person.links.map((l) => l.url) } : {}),
  };
}
