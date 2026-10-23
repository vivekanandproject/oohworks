import { cache } from "react";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type {
  Article,
  Company,
  Correction,
  Guide,
  Media,
  Person,
  Report,
  Source,
  Tag,
} from "@/payload-types";
import { factsIn, refId, blockFields } from "./lexical";
import { PILLARS, pieceUrl, pillarOf, type EditorialCollection, type PillarKey } from "./pillars";

/** One published piece, whichever collection it lives in, in the shape pages render. */
export interface Piece {
  id: number;
  collection: EditorialCollection;
  pillar: PillarKey;
  slug: string;
  url: string;
  title: string;
  standfirst: string;
  /** 40 to 60 words answering the headline's question; empty when the writer left it out. */
  shortAnswer: string | null;
  /** The editor who marked the piece fact-checked, and when. */
  factCheckedBy: string | null;
  factCheckedAt: string | null;
  hero: Media | null;
  authors: Person[];
  tags: Tag[];
  places: Tag[];
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  body: unknown;
  methodNotes: unknown;
  listedSources: (number | Source)[];
  sponsor: string | null;
  layout: "standard" | "immersive";
  lead: boolean;
  period: string | null;
  refreshedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  noIndex: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  pages: number;
}

const client = cache(async () => getPayload({ config }));

/** Anonymous reads: the collections' own access rules limit these to published documents. */
const PUBLIC = { overrideAccess: false, depth: 1 } as const;

function objs<T extends { id: number }>(v: (number | T)[] | null | undefined): T[] {
  return (v ?? []).filter((x): x is T => typeof x === "object" && x !== null);
}
function obj<T extends { id: number }>(v: number | T | null | undefined): T | null {
  return typeof v === "object" && v !== null ? v : null;
}
function present<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}
function byDate(list: Piece[]): Piece[] {
  return [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
function same(a: Piece | null, b: Piece | null): boolean {
  return Boolean(a && b && a.collection === b.collection && a.id === b.id);
}

type Common = Pick<
  Article,
  "id" | "title" | "standfirst" | "authors" | "updatedAt" | "createdAt"
> & {
  slug?: string | null;
  sources?: (number | Source)[] | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  body: unknown;
  seo?: { title?: string | null; description?: string | null; noIndex?: boolean | null };
};

function make(
  d: Common,
  collection: EditorialCollection,
  pillar: PillarKey | undefined,
  extra: Partial<Piece>,
): Piece | null {
  if (!d.slug || !pillar) return null;
  return {
    id: d.id,
    collection,
    pillar,
    slug: d.slug,
    url: pieceUrl(pillar, d.slug),
    title: d.title,
    standfirst: d.standfirst,
    shortAnswer: null,
    factCheckedBy: null,
    factCheckedAt: null,
    hero: null,
    authors: objs<Person>(d.authors),
    tags: [],
    places: [],
    publishedAt: d.publishedAt ?? d.createdAt,
    updatedAt: d.updatedAt,
    readingTime: d.readingTime ?? 1,
    body: d.body,
    methodNotes: null,
    listedSources: d.sources ?? [],
    sponsor: null,
    layout: "standard",
    lead: false,
    period: null,
    refreshedAt: null,
    seoTitle: d.seo?.title ?? null,
    seoDescription: d.seo?.description ?? null,
    noIndex: Boolean(d.seo?.noIndex),
    ...extra,
  };
}

/** The short answer and the fact-check record, which articles and guides carry and reports do not. */
function checks(d: Pick<Article, "shortAnswer" | "factCheck">): Partial<Piece> {
  return {
    shortAnswer: d.shortAnswer?.trim() || null,
    factCheckedBy: d.factCheck?.by || null,
    factCheckedAt: d.factCheck?.at || null,
  };
}

function fromArticle(d: Article): Piece | null {
  return make(d, "articles", pillarOf("articles", d), {
    ...checks(d),
    hero: obj<Media>(d.hero),
    tags: objs<Tag>(d.tags),
    places: objs<Tag>(d.places),
    sponsor: d.sponsor?.enabled
      ? d.sponsor.label || obj<Company>(d.sponsor.company)?.name || "a sponsor"
      : null,
    layout: d.layout === "immersive" ? "immersive" : "standard",
    lead: Boolean(d.lead),
  });
}

function fromGuide(d: Guide): Piece | null {
  const city = obj<Tag>(d.city);
  const format = obj<Tag>(d.format);
  return make(d, "guides", "guides", {
    ...checks(d),
    hero: obj<Media>(d.hero),
    tags: [...objs<Tag>(d.tags), ...(format ? [format] : [])],
    places: city ? [city] : [],
    sponsor: d.sponsor?.enabled
      ? d.sponsor.label || obj<Company>(d.sponsor.company)?.name || "a sponsor"
      : null,
    refreshedAt: d.lastRefreshedAt ?? null,
  });
}

function fromReport(d: Report): Piece | null {
  return make(d, "reports", "data", { period: d.period, methodNotes: d.methodNotes ?? null });
}

/** One page of a pillar, newest first. */
export const listPillar = cache(
  async (pillar: PillarKey, page: number, limit: number): Promise<Page<Piece>> => {
    const p = await client();
    const def = PILLARS[pillar];
    if (def.collection === "articles") {
      const r = await p.find({
        collection: "articles",
        where: { pillar: { equals: pillar } },
        sort: "-publishedAt",
        page,
        limit,
        ...PUBLIC,
      });
      return {
        items: r.docs.map(fromArticle).filter(present),
        total: r.totalDocs,
        pages: r.totalPages,
      };
    }
    if (def.collection === "guides") {
      const r = await p.find({
        collection: "guides",
        sort: "-publishedAt",
        page,
        limit,
        ...PUBLIC,
      });
      return {
        items: r.docs.map(fromGuide).filter(present),
        total: r.totalDocs,
        pages: r.totalPages,
      };
    }
    const r = await p.find({ collection: "reports", sort: "-publishedAt", page, limit, ...PUBLIC });
    return {
      items: r.docs.map(fromReport).filter(present),
      total: r.totalDocs,
      pages: r.totalPages,
    };
  },
);

/** Newest pieces across every pillar. Reads the top of each collection and merges; fine at newsroom volumes. */
async function mergedTop(
  count: number,
  where?: { articles?: Where; guides?: Where; reports?: Where | null },
): Promise<{ items: Piece[]; total: number }> {
  const p = await client();
  const limit = Math.max(1, count);
  const [a, g, r] = await Promise.all([
    p.find({
      collection: "articles",
      ...(where?.articles ? { where: where.articles } : {}),
      sort: "-publishedAt",
      limit,
      ...PUBLIC,
    }),
    p.find({
      collection: "guides",
      ...(where?.guides ? { where: where.guides } : {}),
      sort: "-publishedAt",
      limit,
      ...PUBLIC,
    }),
    where?.reports === null
      ? Promise.resolve({ docs: [] as Report[], totalDocs: 0 })
      : p.find({
          collection: "reports",
          ...(where?.reports ? { where: where.reports } : {}),
          sort: "-publishedAt",
          limit,
          ...PUBLIC,
        }),
  ]);
  const items = byDate(
    [...a.docs.map(fromArticle), ...g.docs.map(fromGuide), ...r.docs.map(fromReport)].filter(
      present,
    ),
  );
  return { items, total: a.totalDocs + g.totalDocs + r.totalDocs };
}

export const listAll = cache(async (page: number, limit: number): Promise<Page<Piece>> => {
  const { items, total } = await mergedTop(page * limit);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
});

export const pillarCounts = cache(async (): Promise<Record<PillarKey, number>> => {
  const p = await client();
  const count = async (collection: EditorialCollection, where?: Where) =>
    (await p.count({ collection, ...(where ? { where } : {}), overrideAccess: false })).totalDocs;
  const [news, analysis, academy, showcase, guides, data] = await Promise.all([
    count("articles", { pillar: { equals: "news" } }),
    count("articles", { pillar: { equals: "analysis" } }),
    count("articles", { pillar: { equals: "academy" } }),
    count("articles", { pillar: { equals: "showcase" } }),
    count("guides"),
    count("reports"),
  ]);
  return { news, analysis, academy, showcase, guides, data };
});

export interface FrontPage {
  lead: Piece | null;
  latest: Piece[];
  analysis: Piece[];
  guides: Piece[];
  report: Piece | null;
  counts: Record<PillarKey, number>;
  total: number;
}

/** Everything the Newsroom front page shows. The lead is the newest piece an editor ticked, else the newest piece. */
export const frontPage = cache(async (): Promise<FrontPage> => {
  const p = await client();
  const [{ items, total }, leadQ, counts] = await Promise.all([
    mergedTop(24),
    p.find({
      collection: "articles",
      where: { lead: { equals: true } },
      sort: "-publishedAt",
      limit: 1,
      ...PUBLIC,
    }),
    pillarCounts(),
  ]);
  const lead = leadQ.docs.map(fromArticle).filter(present)[0] ?? items[0] ?? null;
  const rest = items.filter((x) => !same(x, lead));
  return {
    lead,
    latest: rest.slice(0, 5),
    analysis: rest.filter((x) => x.pillar === "analysis").slice(0, 2),
    guides: rest.filter((x) => x.pillar === "guides" || x.pillar === "academy").slice(0, 3),
    report: rest.find((x) => x.pillar === "data") ?? null,
    counts,
    total,
  };
});

/**
 * The newest pieces for the cached home page. During a build with no database it returns nothing,
 * and the page fills in on its first refresh; at run time a database error is a real error.
 */
export async function latestForHome(limit: number): Promise<Piece[]> {
  try {
    return (await mergedTop(limit)).items.slice(0, limit);
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    throw error;
  }
}

export const getPiece = cache(async (pillar: PillarKey, slug: string): Promise<Piece | null> => {
  const p = await client();
  const def = PILLARS[pillar];
  const opts = { limit: 1, overrideAccess: false, depth: 2 } as const;
  if (def.collection === "articles") {
    const r = await p.find({
      collection: "articles",
      where: { and: [{ slug: { equals: slug } }, { pillar: { equals: pillar } }] },
      ...opts,
    });
    return r.docs.map(fromArticle).filter(present)[0] ?? null;
  }
  if (def.collection === "guides") {
    const r = await p.find({ collection: "guides", where: { slug: { equals: slug } }, ...opts });
    return r.docs.map(fromGuide).filter(present)[0] ?? null;
  }
  const r = await p.find({ collection: "reports", where: { slug: { equals: slug } }, ...opts });
  return r.docs.map(fromReport).filter(present)[0] ?? null;
});

export interface ResolvedSources {
  list: Source[];
  /** Source id to its number in the list, starting at 1. */
  numberOf: Map<number, number>;
  byId: Map<number, Source>;
}

async function docsById<T extends { id: number }>(
  collection: "sources" | "media" | "people",
  ids: number[],
  known: T[],
): Promise<Map<number, T>> {
  const map = new Map<number, T>(known.map((d) => [d.id, d]));
  const missing = [...new Set(ids)].filter((id) => !map.has(id));
  if (missing.length) {
    const p = await client();
    const r = await p.find({
      collection,
      where: { id: { in: missing } },
      limit: missing.length,
      overrideAccess: false,
      depth: 0,
    });
    for (const d of r.docs as unknown as T[]) map.set(d.id, d);
  }
  return map;
}

/** Every source a piece cites: the sources behind its Fact blocks in reading order, then the ones listed on the piece. */
export async function resolveSources(piece: Piece): Promise<ResolvedSources> {
  const fromFacts = [...factsIn(piece.body), ...factsIn(piece.methodNotes)].map((f) => f.source);
  const all = [...fromFacts, ...piece.listedSources];
  const ids = all.map(refId).filter(present);
  const known = all.filter(
    (v): v is Source => typeof v === "object" && v !== null && "publisher" in (v as object),
  );
  const byId = await docsById<Source>("sources", ids, known);
  const list: Source[] = [];
  const numberOf = new Map<number, number>();
  for (const id of ids) {
    const doc = byId.get(id);
    if (doc && !numberOf.has(id)) {
      list.push(doc);
      numberOf.set(id, list.length);
    }
  }
  return { list, numberOf, byId };
}

/** Images and people referenced from Figure and Quote blocks, whether or not the CMS populated them. */
export async function resolveBlockDocs(
  piece: Piece,
): Promise<{ media: Map<number, Media>; people: Map<number, Person> }> {
  const figures = [
    ...blockFields(piece.body, "figure"),
    ...blockFields(piece.methodNotes, "figure"),
  ].map((f) => f.media);
  const quotes = blockFields(piece.body, "quote").map((f) => f.person);
  const [media, people] = await Promise.all([
    docsById<Media>(
      "media",
      figures.map(refId).filter(present),
      figures.filter(
        (v): v is Media => typeof v === "object" && v !== null && "alt" in (v as object),
      ),
    ),
    docsById<Person>(
      "people",
      quotes.map(refId).filter(present),
      quotes.filter(
        (v): v is Person => typeof v === "object" && v !== null && "bio" in (v as object),
      ),
    ),
  ]);
  return { media, people };
}

export async function correctionsFor(piece: Piece): Promise<Correction[]> {
  const p = await client();
  const r = await p.find({
    collection: "corrections",
    where: {
      and: [
        { "article.value": { equals: piece.id } },
        { "article.relationTo": { equals: piece.collection } },
      ],
    },
    sort: "-correctedAt",
    limit: 20,
    overrideAccess: false,
    depth: 0,
  });
  return r.docs;
}

export interface LoggedCorrection {
  id: number;
  note: string;
  correctedAt: string;
  piece: Piece | null;
}

export async function allCorrections(limit = 100): Promise<LoggedCorrection[]> {
  const p = await client();
  const r = await p.find({ collection: "corrections", sort: "-correctedAt", limit, ...PUBLIC });
  return r.docs.map((c) => {
    const ref = c.article;
    let piece: Piece | null = null;
    if (typeof ref.value === "object" && ref.value !== null) {
      if (ref.relationTo === "articles") piece = fromArticle(ref.value as Article);
      else if (ref.relationTo === "guides") piece = fromGuide(ref.value as Guide);
      else piece = fromReport(ref.value as Report);
    }
    return { id: c.id, note: c.note, correctedAt: c.correctedAt, piece };
  });
}

/** Pieces that share a topic or place, topped up with the newest of the same pillar. */
export async function relatedTo(piece: Piece, limit: number): Promise<Piece[]> {
  const tagIds = [...piece.tags, ...piece.places].map((t) => t.id);
  let found: Piece[] = [];
  if (tagIds.length) {
    const merged = await mergedTop(limit + 2, {
      articles: { or: [{ tags: { in: tagIds } }, { places: { in: tagIds } }] },
      guides: {
        or: [{ tags: { in: tagIds } }, { city: { in: tagIds } }, { format: { in: tagIds } }],
      },
      reports: null,
    });
    found = merged.items.filter((x) => !same(x, piece));
  }
  if (found.length < limit) {
    const more = (await listPillar(piece.pillar, 1, limit + 1)).items.filter(
      (x) => !same(x, piece) && !found.some((f) => same(f, x)),
    );
    found = [...found, ...more];
  }
  if (found.length < limit) {
    const more = (await mergedTop(limit + 2)).items.filter(
      (x) => !same(x, piece) && !found.some((f) => same(f, x)),
    );
    found = [...found, ...more];
  }
  return found.slice(0, limit);
}

export const getPerson = cache(async (slug: string): Promise<Person | null> => {
  const p = await client();
  const r = await p.find({
    collection: "people",
    where: { slug: { equals: slug } },
    limit: 1,
    ...PUBLIC,
  });
  return r.docs[0] ?? null;
});

export async function piecesByAuthor(personId: number, limit = 50): Promise<Piece[]> {
  const where: Where = { authors: { in: [personId] } };
  return (await mergedTop(limit, { articles: where, guides: where, reports: where })).items;
}

export const getTag = cache(async (slug: string): Promise<Tag | null> => {
  const p = await client();
  const r = await p.find({
    collection: "tags",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
    depth: 0,
  });
  return r.docs[0] ?? null;
});

export async function piecesByTag(tagId: number, limit = 50): Promise<Piece[]> {
  const merged = await mergedTop(limit, {
    articles: { or: [{ tags: { in: [tagId] } }, { places: { in: [tagId] } }] },
    guides: {
      or: [{ tags: { in: [tagId] } }, { city: { in: [tagId] } }, { format: { in: [tagId] } }],
    },
    reports: null,
  });
  return merged.items;
}

/** Every published piece, for sitemaps and feeds. */
export async function allPieces(limit = 1000): Promise<Piece[]> {
  return (await mergedTop(limit)).items;
}

/** Authors who have at least one published piece. */
export function authorsOf(pieces: Piece[]): Person[] {
  const seen = new Map<number, Person>();
  for (const piece of pieces) for (const a of piece.authors) if (a.slug) seen.set(a.id, a);
  return [...seen.values()];
}
