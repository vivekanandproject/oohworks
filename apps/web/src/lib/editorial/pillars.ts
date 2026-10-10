/** The six sections of the newsroom. Plain data: imported by pages, feeds and CMS hooks alike. */
export const PILLAR_KEYS = ["news", "analysis", "guides", "academy", "data", "showcase"] as const;
export type PillarKey = (typeof PILLAR_KEYS)[number];
export type EditorialCollection = "articles" | "guides" | "reports";

export interface PillarDef {
  key: PillarKey;
  label: string;
  /** Path without a trailing slash, e.g. "/news". */
  path: string;
  collection: EditorialCollection;
  blurb: string;
  schemaType: "NewsArticle" | "Article" | "Report";
}

export const PILLARS: Record<PillarKey, PillarDef> = {
  news: {
    key: "news",
    label: "News",
    path: "/news",
    collection: "articles",
    blurb:
      "Contracts, people, regulation and launches in out-of-home, with every figure sourced and dated.",
    schemaType: "NewsArticle",
  },
  analysis: {
    key: "analysis",
    label: "Analysis",
    path: "/analysis",
    collection: "articles",
    blurb: "What the numbers and the rules mean for owners, agencies and advertisers.",
    schemaType: "Article",
  },
  guides: {
    key: "guides",
    label: "Guides",
    path: "/guides",
    collection: "guides",
    blurb: "Cost guides and explainers for advertisers, refreshed every quarter from live data.",
    schemaType: "Article",
  },
  academy: {
    key: "academy",
    label: "Owner academy",
    path: "/academy",
    collection: "articles",
    blurb: "Permits, leases, pricing and going digital, written for media owners.",
    schemaType: "Article",
  },
  data: {
    key: "data",
    label: "Data",
    path: "/data",
    collection: "reports",
    blurb: "The ohworks price index and market reports, published with their method.",
    schemaType: "Report",
  },
  showcase: {
    key: "showcase",
    label: "Showcase",
    path: "/showcase",
    collection: "articles",
    blurb: "Campaigns worth a look, with the sites they ran on.",
    schemaType: "Article",
  },
};

/** The pillar a CMS document belongs to. */
export function pillarOf(
  collection: string,
  doc: { pillar?: string | null },
): PillarKey | undefined {
  if (collection === "guides") return "guides";
  if (collection === "reports") return "data";
  if (
    collection === "articles" &&
    doc.pillar &&
    doc.pillar in PILLARS &&
    PILLARS[doc.pillar as PillarKey].collection === "articles"
  ) {
    return doc.pillar as PillarKey;
  }
  return undefined;
}

/** Site path of a piece, with its trailing slash. */
export function pieceUrl(pillar: PillarKey, slug: string): string {
  return `${PILLARS[pillar].path}/${slug}/`;
}
