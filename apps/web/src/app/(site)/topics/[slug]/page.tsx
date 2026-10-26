import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Container, EmptyState } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { PieceRow } from "@/components/editorial/PieceBits";
import { breadcrumbJsonLd } from "@/lib/editorial/jsonld";
import { getTag, piecesByTag } from "@/lib/editorial/queries";
import { JsonLd, alternates } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** A topic page joins the index only once it holds this many pieces; below that it is a thin page. */
const INDEX_FROM = 5;

type Params = { params: Promise<{ slug: string }> };

const KIND: Record<string, string> = {
  place: "Place",
  format: "Format",
  company: "Company",
  theme: "Topic",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tag = await getTag((await params).slug);
  if (!tag?.slug) return {};
  const pieces = await piecesByTag(tag.id, INDEX_FROM);
  return {
    title: tag.name,
    description:
      tag.description ?? `News, analysis and guides about ${tag.name} from the OOHWORKS newsroom.`,
    alternates: alternates(`/topics/${tag.slug}/`),
    robots:
      pieces.length >= INDEX_FROM ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function TopicPage({ params }: Params) {
  const tag = await getTag((await params).slug);
  if (!tag?.slug) notFound();
  const pieces = await piecesByTag(tag.id);
  return (
    <Shell active="news">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Newsroom", path: "/newsroom/" },
          { name: tag.name, path: `/topics/${tag.slug}/` },
        ])}
      />
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[760px]">
          <nav aria-label="Breadcrumb" className="t-small text-ink-muted">
            <a className="oh-link" href="/newsroom/">
              Newsroom
            </a>
          </nav>
          <p className="t-label text-ink-muted mt-4">{KIND[tag.kind] ?? "Topic"}</p>
          <h1 className="t-display-lg mt-2">{tag.name}</h1>
          {tag.description ? (
            <p className="t-body-lg text-ink-muted mt-4">{tag.description}</p>
          ) : null}
          <section className="mt-8" data-section="stream">
            {pieces.length ? (
              pieces.map((p) => <PieceRow key={`${p.collection}-${p.id}`} piece={p} level={2} />)
            ) : (
              <EmptyState
                icon="enquiry"
                title={`Nothing about ${tag.name} yet`}
                actions={
                  <Button href="/newsroom/" variant="primary" size="sm">
                    Back to the newsroom
                  </Button>
                }
              >
                Pieces appear here as they are published.
              </EmptyState>
            )}
          </section>
        </div>
      </Container>
    </Shell>
  );
}
