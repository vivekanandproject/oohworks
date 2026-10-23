import { apiJson, problem } from "@/lib/api/respond";
import { PILLAR_KEYS, PILLARS, type PillarKey } from "@/lib/editorial/pillars";
import { listAll, listPillar, type Piece } from "@/lib/editorial/queries";
import { absolute } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;
const MAX_PER_PAGE = 50;

/** One published piece, as the newsroom shows it: its words, its dates, who wrote and checked it. */
function article(p: Piece) {
  return {
    title: p.title,
    url: absolute(p.url),
    markdownUrl: absolute(p.url.replace(/\/$/, ".md")),
    section: PILLARS[p.pillar].key,
    sectionLabel: PILLARS[p.pillar].label,
    standfirst: p.standfirst,
    shortAnswer: p.shortAnswer,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    authors: p.authors.map((a) => ({
      name: a.name,
      url: a.slug ? absolute(`/authors/${a.slug}/`) : null,
    })),
    factCheckedBy: p.factCheckedBy,
    factCheckedAt: p.factCheckedAt,
    places: p.places.map((t) => t.name),
    topics: p.tags.map((t) => t.name),
    sponsoredBy: p.sponsor,
  };
}

/**
 * The newest published pieces from the newsroom, newest first, for software and AI agents. Each
 * links to its page and to its Markdown copy, where every figure is written with its source and date.
 */
export async function GET(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams;
  const section = params.get("section");
  if (section && !(PILLAR_KEYS as readonly string[]).includes(section))
    return problem(
      400,
      "Unknown section",
      `"section" is one of: ${PILLAR_KEYS.join(", ")}. It was "${section}".`,
    );
  const page = Math.max(1, Math.floor(Number(params.get("page") ?? 1)) || 1);
  const perPage = Number(params.get("per_page") ?? PER_PAGE);
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PER_PAGE)
    return problem(
      400,
      "per_page is out of range",
      `"per_page" is a whole number from 1 to ${MAX_PER_PAGE}.`,
    );
  const list = section
    ? await listPillar(section as PillarKey, page, perPage)
    : await listAll(page, perPage);
  return apiJson(
    {
      articles: list.items.filter((p) => !p.noIndex).map(article),
      page,
      perPage,
      total: list.total,
      pages: list.pages,
    },
    300,
  );
}
