import { absolute } from "@/lib/seo";
import { pieceMarkdown } from "@/lib/editorial/markdown";
import { PILLAR_KEYS, type PillarKey } from "@/lib/editorial/pillars";
import { getPiece, resolveBlockDocs, resolveSources } from "@/lib/editorial/queries";

export const dynamic = "force-dynamic";

/**
 * The Markdown copy of a published piece, served at the piece's own address with ".md" in place of
 * the closing slash (/news/{slug}.md, rewritten here by the middleware). Search engines are told to
 * index the page, not this copy: the canonical link points at the page.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pillar: string; slug: string }> },
) {
  const { pillar, slug } = await params;
  if (!(PILLAR_KEYS as readonly string[]).includes(pillar)) return notFound();
  const piece = await getPiece(pillar as PillarKey, slug);
  if (!piece || piece.noIndex) return notFound();
  const [sources, docs] = await Promise.all([resolveSources(piece), resolveBlockDocs(piece)]);
  const body = pieceMarkdown(piece, {
    sourceNumber: sources.numberOf,
    sources: sources.list,
    media: docs.media,
    people: docs.people,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${absolute(piece.url)}>; rel="canonical"`,
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function notFound(): Response {
  return new Response("Not found\n", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
