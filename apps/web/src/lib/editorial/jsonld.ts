import type { Person, Tag } from "@/payload-types";
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

/** A tag as a schema.org thing: places are Places, companies Organizations, the rest Things. */
function entity(tag: Tag) {
  const type = tag.kind === "place" ? "Place" : tag.kind === "company" ? "Organization" : "Thing";
  return {
    "@type": type,
    name: tag.name,
    ...(tag.slug ? { url: absolute(`/topics/${tag.slug}/`) } : {}),
    ...(tag.wikidata ? { sameAs: `https://www.wikidata.org/wiki/${tag.wikidata}` } : {}),
  };
}

/**
 * NewsArticle for news, Article for everything else, Report for the data pillar. Dates are the real
 * ones. The short answer is the abstract and, on news, what a voice assistant reads; the places a
 * piece is filed under are what it is about, and its other tags what it mentions.
 */
export function articleJsonLd(piece: Piece, sourceUrls: string[]) {
  const images = (["hero", "card", "thumb"] as const)
    .map((size) => picture(piece.hero, size))
    .filter((p) => p !== null)
    .map((p) => absolute(p.src));
  const about = piece.places.map(entity);
  const mentions = piece.tags.filter((t) => !piece.places.some((p) => p.id === t.id)).map(entity);
  const schemaType = PILLARS[piece.pillar].schemaType;
  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": `${absolute(piece.url)}#article`,
    headline: piece.title,
    description: piece.standfirst,
    ...(piece.shortAnswer ? { abstract: piece.shortAnswer } : {}),
    datePublished: piece.publishedAt,
    dateModified: piece.updatedAt,
    author: piece.authors.map(authorRef),
    publisher: { "@id": `${siteUrl()}/#organization` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absolute(piece.url),
      ...(piece.factCheckedBy && piece.factCheckedAt
        ? {
            reviewedBy: { "@type": "Person", name: piece.factCheckedBy },
            lastReviewed: piece.factCheckedAt,
          }
        : {}),
    },
    articleSection: PILLARS[piece.pillar].label,
    isAccessibleForFree: true,
    inLanguage: "en",
    ...(images.length ? { image: images } : {}),
    ...(about.length ? { about } : {}),
    ...(mentions.length ? { mentions } : {}),
    ...(schemaType === "NewsArticle" && piece.shortAnswer
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "[data-section='short-answer'] p"],
          },
        }
      : {}),
    ...(sourceUrls.length ? { citation: sourceUrls } : {}),
  };
}

/** A person's own links, then their Wikidata item, so every profile points at one identity. */
function sameAs(person: Person): string[] {
  return [
    ...(person.links ?? []).map((l) => l.url),
    ...(person.wikidata ? [`https://www.wikidata.org/wiki/${person.wikidata}`] : []),
  ];
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
    ...(sameAs(person).length ? { sameAs: sameAs(person) } : {}),
  };
}
