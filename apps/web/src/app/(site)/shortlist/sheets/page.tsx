import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, Icon, Wordmark, type IconName } from "@ohworks/ui";
import { BasketEnhance } from "@/components/sites/Basket";
import { SpecSheet } from "@/components/sites/SiteParts";
import { formatDate } from "@/lib/editorial/format";
import { picture } from "@/lib/editorial/media";
import { absolute } from "@/lib/seo";
import { dateRange } from "@/lib/sites/enquiry";
import { isDay } from "@/lib/sites/enquiry-form";
import { LISTS, parseIds } from "@/lib/sites/lists";
import { readLists } from "@/lib/sites/lists-server";
import { cardsFor } from "@/lib/sites/queries";
import { formatDef } from "@/lib/sites/taxonomy";
import { availabilityOf, badgesOf, placeLine, priceOf, summaryOf } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site sheets", robots: { index: false, follow: false } };

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim();

/**
 * A shortlist laid out to print: one site to a page, the same facts in the same order. Printing it,
 * or choosing "Save as PDF" in the print dialog, gives a document to send to a client.
 */
export default async function SheetsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const asked = parseIds(one(q.sites), LISTS.saved.max);
  const ids = asked.length ? asked : (await readLists()).saved;
  const cards = await cardsFor(ids);
  if (cards.length === 0) redirect("/shortlist/");
  const now = Date.now();
  const from = isDay(one(q.from)) ? one(q.from) : undefined;
  const to = isDay(one(q.to)) && (!from || one(q.to) >= from) ? one(q.to) : undefined;
  const back = `/shortlist/${asked.length ? `?sites=${asked.join(",")}` : ""}`;

  return (
    <main id="main" className="bg-paper">
      <BasketEnhance />
      <div className="oh-noprint border-hairline bg-paper-raised z-10 border-b sm:sticky sm:top-0">
        <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="t-display-sm">Site sheets</h1>
            <p className="t-small text-ink-muted hidden sm:block">
              {cards.length === 1 ? "1 site" : `${cards.length} sites`}, one to a page. In the print
              window, choose &ldquo;Save as PDF&rdquo; to make a file.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={back} className="oh-btn ghost sm" rel="nofollow">
              Back to the shortlist
            </a>
            <button type="button" className="oh-btn primary sm" data-print="">
              Print or save as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-4 py-6">
        {cards.map((card, i) => {
          const { site, owner } = card;
          const price = priceOf(site);
          const availability = availabilityOf(site, now);
          const pic = picture(card.photo, "hero");
          const icon = (formatDef(site.format)?.icon ?? "hoarding") as IconName;
          return (
            <article
              key={site.id}
              className="oh-sheet border-hairline bg-paper-raised mb-6 rounded-md border p-6"
              data-site={site.permanentId}
            >
              <header className="border-hairline flex items-start justify-between gap-4 border-b pb-4">
                <div className="min-w-0">
                  <h2 className="t-display-sm">{site.title}</h2>
                  <p className="t-body text-ink-muted mt-1">
                    {site.road}, {placeLine(site)}
                    {site.landmark ? ` · ${site.landmark}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Wordmark size={20} />
                  <p className="t-data-sm text-ink-muted mt-1">
                    {i + 1} of {cards.length}
                  </p>
                </div>
              </header>

              {site.sample ? (
                <p className="t-small bg-lit-tint text-ink mt-4 rounded-sm px-3 py-2">
                  A sample listing for development. It is not a real site.
                </p>
              ) : null}

              <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
                <div className="border-hairline bg-paper-sunken text-ink-muted grid aspect-video place-items-center overflow-hidden rounded-sm border">
                  {pic ? (
                    <img
                      src={pic.src}
                      alt={pic.alt || `Approach view of ${site.title}`}
                      width={pic.width}
                      height={pic.height}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <Icon name={icon} size={24} />
                      <span className="t-small">No photo yet</span>
                    </span>
                  )}
                </div>
                <div>
                  <p className="oh-amount">
                    {price.shown ? (
                      <>
                        {price.prefix}
                        {price.amount} <small>/ month</small>
                      </>
                    ) : (
                      "Price on request"
                    )}
                  </p>
                  <ul className="t-small text-ink mt-2 space-y-1">
                    {[
                      site.minPeriod ? `${site.minPeriod} minimum` : null,
                      site.productionCost ? `Printing and mounting: ${site.productionCost}` : null,
                      price.shown ? site.taxesNote : null,
                    ]
                      .filter(Boolean)
                      .map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                  </ul>
                  <p className="t-body text-ink mt-3 font-semibold">{availability.label}</p>
                  {availability.note ? (
                    <p className="t-small text-ink-muted">{availability.note}</p>
                  ) : null}
                  {from ? (
                    <p className="t-small text-ink-muted mt-1">
                      Dates asked about: {to ? dateRange(from, to) : `from ${formatDate(from)}`}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {badgesOf(site, owner, now).map((b) => (
                      <Badge key={b.kind + b.text} kind={b.kind}>
                        {b.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <p className="t-body text-ink mt-4">{summaryOf(site, owner)}</p>
              <div className="mt-4">
                <SpecSheet site={site} now={now} />
              </div>

              <footer className="border-hairline t-small text-ink-muted mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t pt-3">
                <span>
                  Owner and seller:{" "}
                  <span className="text-ink font-semibold">{owner?.name ?? "Not named"}</span>
                </span>
                <span className="min-w-0 font-mono text-[12px] break-all">
                  {absolute(card.listing.url)}
                </span>
                <span className="w-full">
                  From ohworks on {formatDate(new Date(now).toISOString())}. Every figure is the
                  owner&rsquo;s own. ohworks never sells media or takes a media margin.
                </span>
              </footer>
            </article>
          );
        })}
      </div>
    </main>
  );
}
