import type { Metadata } from "next";
import { Button, Container, EmptyState } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import {
  BriefingBand,
  PieceCard,
  PieceRow,
  PillarChips,
  TextRow,
  authorNames,
  eyebrow,
} from "@/components/editorial/PieceBits";
import { formatDate, readTime } from "@/lib/editorial/format";
import { picture } from "@/lib/editorial/media";
import { frontPage } from "@/lib/editorial/queries";
import { JsonLd, SITE_NAME, absolute, alternates } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/editorial/jsonld";

export const dynamic = "force-dynamic";

const TITLE = "Newsroom";
const BLURB =
  "Independent news, analysis and data on out-of-home advertising. Every figure carries its source and its date.";

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await frontPage();
  return {
    title: TITLE,
    description: BLURB,
    alternates: {
      ...alternates("/newsroom/"),
      types: {
        "application/rss+xml": absolute("/feed.xml"),
        "application/feed+json": absolute("/feed.json"),
      },
    },
    robots: total === 0 ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${TITLE} · ${SITE_NAME}`,
      description: BLURB,
      url: absolute("/newsroom/"),
      siteName: SITE_NAME,
    },
  };
}

export default async function NewsroomPage() {
  const { lead, latest, analysis, guides, report, counts, total } = await frontPage();
  const leadPhoto = lead ? picture(lead.hero, "hero") : null;
  const shown = (lead ? 1 : 0) + latest.length;

  return (
    <Shell active="news">
      <JsonLd data={breadcrumbJsonLd([{ name: TITLE, path: "/newsroom/" }])} />
      <Container className="py-10 lg:py-14">
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <h1 className="t-display-lg">{TITLE}</h1>
                <p className="t-body text-ink-muted mt-3 max-w-[62ch]">{BLURB}</p>
              </div>
              <a href="/feed.xml" className="oh-link t-body-strong">
                RSS feed
              </a>
            </div>
            <PillarChips current="all" counts={counts} />
          </header>

          {lead ? (
            <div className="flex flex-wrap gap-10">
              <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
                <article className="flex flex-col gap-4" data-section="lead" data-piece={lead.slug}>
                  {leadPhoto ? (
                    <a href={lead.url} tabIndex={-1} aria-hidden="true">
                      <img
                        src={leadPhoto.src}
                        alt=""
                        width={leadPhoto.width}
                        height={leadPhoto.height}
                        fetchPriority="high"
                        decoding="async"
                        className="bg-paper-sunken aspect-[16/9] w-full rounded-md object-cover"
                      />
                    </a>
                  ) : null}
                  <p className="t-label text-ink-muted">{eyebrow(lead)}</p>
                  <h2 className="t-display-lg">
                    <a href={lead.url} className="oh-rowlink">
                      {lead.title}
                    </a>
                  </h2>
                  <p className="t-body-lg text-ink-muted max-w-[62ch]">{lead.standfirst}</p>
                  <p className="t-small text-ink-muted">
                    {authorNames(lead)} ·{" "}
                    <time dateTime={lead.publishedAt}>{formatDate(lead.publishedAt)}</time> ·{" "}
                    {readTime(lead.readingTime)}
                  </p>
                </article>
                {analysis.length ? (
                  <section data-section="analysis">
                    <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4">
                      <h2 className="t-display-md">Analysis</h2>
                      <a href="/analysis/" className="oh-link t-body-strong">
                        All analysis
                      </a>
                    </div>
                    {analysis.map((p) => (
                      <PieceRow key={`${p.collection}-${p.id}`} piece={p} />
                    ))}
                  </section>
                ) : null}
                {guides.length ? (
                  <section data-section="guides">
                    <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4">
                      <h2 className="t-display-md">Guides</h2>
                      <a href="/guides/" className="oh-link t-body-strong">
                        All guides
                      </a>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {guides.map((p) => (
                        <PieceCard key={`${p.collection}-${p.id}`} piece={p} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
              {latest.length || report ? (
                <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-8">
                  {latest.length ? (
                    <section className="flex flex-col" aria-label="Latest" data-section="latest">
                      <h2 className="t-display-sm pb-3">Latest</h2>
                      {latest.map((p) => (
                        <TextRow key={`${p.collection}-${p.id}`} piece={p} />
                      ))}
                      <a
                        href="/newsroom/all/"
                        className="oh-link t-body-strong border-hairline border-t pt-3.5"
                      >
                        All stories
                      </a>
                    </section>
                  ) : null}
                  {report ? (
                    <section
                      className="border-hairline bg-paper-raised flex flex-col gap-3 rounded-md border p-5"
                      data-section="data"
                    >
                      <p className="t-label text-ink-muted">{eyebrow(report)}</p>
                      <h2 className="t-display-sm">
                        <a href={report.url} className="oh-rowlink">
                          {report.title}
                        </a>
                      </h2>
                      <p className="t-body text-ink-muted">{report.standfirst}</p>
                      <a href={report.url} className="oh-link t-body-strong">
                        Read the report
                      </a>
                    </section>
                  ) : null}
                </aside>
              ) : null}
            </div>
          ) : (
            <div className="max-w-[760px]">
              <EmptyState
                icon="enquiry"
                title="The newsroom opens with the India launch"
                actions={
                  <Button href="/charter/" variant="ghost" size="sm">
                    Read the charter
                  </Button>
                }
              >
                A daily trade briefing and a weekly buyer digest follow. Write to press@ohworks.com
                with a story or a correction.
              </EmptyState>
            </div>
          )}

          <BriefingBand from="/newsroom/" id="brief-front" />

          {total > shown ? (
            <nav
              aria-label="More"
              className="border-hairline flex flex-wrap items-center justify-between gap-4 border-t pt-5"
              data-section="more"
            >
              <span className="t-data text-ink-muted">{total} pieces in the newsroom</span>
              <a href="/newsroom/all/" className="oh-btn secondary sm">
                All stories
              </a>
            </nav>
          ) : null}
        </div>
      </Container>
    </Shell>
  );
}
