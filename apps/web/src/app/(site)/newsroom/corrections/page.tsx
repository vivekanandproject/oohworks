import type { Metadata } from "next";
import { Container, EmptyState } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { formatDate } from "@/lib/editorial/format";
import { allCorrections } from "@/lib/editorial/queries";
import { alternates } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Corrections",
  description:
    "Every correction ohworks has made to a published piece, with the date and what changed.",
  alternates: alternates("/newsroom/corrections/"),
};

export default async function CorrectionsPage() {
  const corrections = await allCorrections();
  return (
    <Shell active="news">
      <Container className="py-10 lg:py-14">
        <div className="max-w-[680px]">
          <nav aria-label="Breadcrumb" className="t-small text-ink-muted">
            <a className="oh-link" href="/newsroom/">
              Newsroom
            </a>
          </nav>
          <h1 className="t-display-lg mt-4">Corrections</h1>
          <p className="t-body-lg text-ink-muted mt-4">
            When a published piece is wrong, we fix it and say so here and on the piece: the date,
            what was wrong, and what it says now. Write to press@ohworks.com if you spot an error.
          </p>
          {corrections.length ? (
            <ol className="border-hairline mt-8 border-b">
              {corrections.map((c) => (
                <li key={c.id} className="border-hairline border-t py-4">
                  <p className="t-data-sm text-ink-muted">
                    <time dateTime={c.correctedAt}>{formatDate(c.correctedAt)}</time>
                  </p>
                  {c.piece ? (
                    <p className="t-body-strong mt-1">
                      <a href={c.piece.url} className="oh-rowlink">
                        {c.piece.title}
                      </a>
                    </p>
                  ) : null}
                  <p className="t-body text-ink-muted mt-1">{c.note}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-8">
              <EmptyState icon="verified" title="No corrections so far">
                None has been needed yet. When one is, it appears here the same day.
              </EmptyState>
            </div>
          )}
        </div>
      </Container>
    </Shell>
  );
}
