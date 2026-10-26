import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Button, Container, EmptyState, Breadcrumbs, Pager } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { SITE_NAME, absolute, alternates } from "@/lib/seo";
import { PILLARS, type PillarKey } from "@/lib/editorial/pillars";
import {
  getPiece,
  listAll,
  listPillar,
  pillarCounts,
  type Page,
  type Piece,
} from "@/lib/editorial/queries";
import { ArticleView } from "./ArticleView";
import { BriefingBand, PieceRow, PillarChips } from "./PieceBits";

export const PER_PAGE = 12;

/** "2" to 2. Anything that is not a plain positive whole number is not a page. */
function pageNumber(n: string | undefined): number | null {
  if (n === undefined) return 1;
  if (!/^[1-9]\d{0,3}$/.test(n)) return null;
  return Number(n);
}

interface IndexProps {
  title: string;
  blurb: string;
  base: string;
  current: PillarKey | null;
  list: Page<Piece>;
  page: number;
  counts: Record<PillarKey, number>;
}

function IndexView({ title, blurb, base, current, list, page, counts }: IndexProps) {
  const path = page === 1 ? `${base}/` : `${base}/page/${page}/`;
  const items = list.items;
  return (
    <Shell active="news">
      <Container className="py-12 lg:py-16">
        <div className="max-w-column mx-auto">
          <header className="flex flex-col gap-4">
            <Breadcrumbs items={[{ label: "Newsroom", href: "/newsroom/" }]} />
            <div>
              <h1 className="t-display-lg">{title}</h1>
              <p className="t-body text-ink-muted mt-3 max-w-[62ch]">{blurb}</p>
            </div>
            <PillarChips current={current} counts={counts} />
          </header>

          {items.length === 0 ? (
            <div className="max-w-column mx-auto mt-10 w-full">
              <EmptyState
                icon="enquiry"
                title={`Nothing in ${title.toLowerCase()} yet`}
                actions={
                  <Button href="/newsroom/" variant="primary" size="sm">
                    Back to the newsroom
                  </Button>
                }
              >
                The first pieces are on their way. Every one carries its sources and its dates.
              </EmptyState>
            </div>
          ) : (
            <div className="max-w-column mt-8" data-section="stream">
              {items.slice(0, 3).map((p) => (
                <PieceRow key={`${p.collection}-${p.id}`} piece={p} level={2} />
              ))}
              <div className="my-6">
                <BriefingBand from={path} id="brief-index" />
              </div>
              {items.slice(3).map((p) => (
                <PieceRow key={`${p.collection}-${p.id}`} piece={p} level={2} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pager
              page={page}
              pages={list.pages}
              href={(n) => (n === 1 ? `${base}/` : `${base}/page/${n}/`)}
            />
          </div>
        </div>
      </Container>
    </Shell>
  );
}

function indexMetadata(
  title: string,
  blurb: string,
  base: string,
  page: number,
  total: number,
): Metadata {
  const path = page === 1 ? `${base}/` : `${base}/page/${page}/`;
  return {
    title: page === 1 ? title : `${title}, page ${page}`,
    description: blurb,
    alternates: alternates(path),
    robots: total === 0 ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${title} · ${SITE_NAME}`,
      description: blurb,
      url: absolute(path),
      siteName: SITE_NAME,
    },
  };
}

type IndexParams = { params: Promise<{ n?: string }> };

/** The index of one pillar, page 1 at `/news/` and later pages at `/news/page/2/`. */
export function pillarIndex(key: PillarKey) {
  const def = PILLARS[key];
  return {
    async generateMetadata({ params }: IndexParams): Promise<Metadata> {
      const page = pageNumber((await params).n);
      if (page === null) return {};
      const list = await listPillar(key, page, PER_PAGE);
      return indexMetadata(def.label, def.blurb, def.path, page, list.total);
    },
    async Page({ params }: IndexParams) {
      const { n } = await params;
      if (n === "1") permanentRedirect(`${def.path}/`);
      const page = pageNumber(n);
      if (page === null) notFound();
      const [list, counts] = await Promise.all([listPillar(key, page, PER_PAGE), pillarCounts()]);
      if (page > 1 && list.items.length === 0) notFound();
      return (
        <IndexView
          title={def.label}
          blurb={def.blurb}
          base={def.path}
          current={key}
          list={list}
          page={page}
          counts={counts}
        />
      );
    },
  };
}

const ALL = {
  title: "All stories",
  blurb: "Every piece from the newsroom, newest first.",
  base: "/newsroom/all",
};

/** Every pillar in one stream, so nothing published is more than two clicks from the front page. */
export const allIndex = {
  async generateMetadata({ params }: IndexParams): Promise<Metadata> {
    const page = pageNumber((await params).n);
    if (page === null) return {};
    const list = await listAll(page, PER_PAGE);
    return indexMetadata(ALL.title, ALL.blurb, ALL.base, page, list.total);
  },
  async Page({ params }: IndexParams) {
    const { n } = await params;
    if (n === "1") permanentRedirect(`${ALL.base}/`);
    const page = pageNumber(n);
    if (page === null) notFound();
    const [list, counts] = await Promise.all([listAll(page, PER_PAGE), pillarCounts()]);
    if (page > 1 && list.items.length === 0) notFound();
    return (
      <IndexView
        title={ALL.title}
        blurb={ALL.blurb}
        base={ALL.base}
        current={null}
        list={list}
        page={page}
        counts={counts}
      />
    );
  },
};

type ArticleParams = { params: Promise<{ slug: string }> };

/** One piece of one pillar. An unknown or unpublished slug is a real 404. */
export function pillarArticle(key: PillarKey) {
  const def = PILLARS[key];
  return {
    async generateMetadata({ params }: ArticleParams): Promise<Metadata> {
      const piece = await getPiece(key, (await params).slug);
      if (!piece) return {};
      const title = piece.seoTitle ?? piece.title;
      const description = piece.seoDescription ?? piece.standfirst;
      const image = absolute(`/og/${key}/${piece.slug}/`);
      return {
        title,
        description,
        alternates: {
          ...alternates(piece.url),
          // The same piece as Markdown, for AI agents (src/app/api/md); left out when it is not indexed.
          ...(piece.noIndex
            ? {}
            : { types: { "text/markdown": absolute(piece.url.replace(/\/$/, ".md")) } }),
        },
        robots: piece.noIndex
          ? { index: false, follow: true }
          : { index: true, follow: true, "max-image-preview": "large" },
        authors: piece.authors.map((a) => ({
          name: a.name,
          ...(a.slug ? { url: absolute(`/authors/${a.slug}/`) } : {}),
        })),
        openGraph: {
          type: "article",
          title,
          description,
          url: absolute(piece.url),
          siteName: SITE_NAME,
          publishedTime: piece.publishedAt,
          modifiedTime: piece.updatedAt,
          section: def.label,
          authors: piece.authors.map((a) => a.name),
          images: [{ url: image, width: 1200, height: 630, alt: piece.title }],
        },
        twitter: { card: "summary_large_image", title, description, images: [image] },
      };
    },
    async Page({ params }: ArticleParams) {
      const piece = await getPiece(key, (await params).slug);
      if (!piece) notFound();
      return (
        <Shell active="news">
          <ArticleView piece={piece} />
        </Shell>
      );
    },
  };
}
