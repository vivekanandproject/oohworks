import type { Metadata } from "next";
import { Button, Container, EmptyState, Notice } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { BasketEnhance } from "@/components/sites/Basket";
import { AvailabilityChip } from "@/components/sites/SiteCard";
import { Thumb } from "@/components/sites/SiteParts";
import { distanceKm } from "@/lib/sites/filter";
import { LISTS, parseIds } from "@/lib/sites/lists";
import { readLists } from "@/lib/sites/lists-server";
import { distanceText, spanKm } from "@/lib/sites/plan";
import { cardsFor, type Card } from "@/lib/sites/queries";
import { lightingDef } from "@/lib/sites/taxonomy";
import {
  availabilityOf,
  facingText,
  lakh,
  monthYear,
  permitState,
  placeLine,
  priceOf,
  sizeFull,
} from "@/lib/sites/view";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Compare sites",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim();
const GAP = <span className="text-ink-muted font-sans">Not provided yet</span>;

function Line({
  label,
  cards,
  data = true,
  cell,
}: {
  label: string;
  cards: Card[];
  data?: boolean;
  cell: (card: Card, index: number) => ReactNode;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {cards.map((card, i) => (
        <td key={card.site.id} className={data ? "data" : undefined}>
          {cell(card, i)}
        </td>
      ))}
    </tr>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const lists = await readLists();
  const linked = one(q.sites) !== "";
  const ids = linked ? parseIds(one(q.sites), LISTS.compare.max) : lists.compare;
  const cards = await cardsFor(ids);
  const now = Date.now();
  const live = cards.map((c) => c.site.permanentId ?? "");
  const first = cards[0];
  const span = cards.length >= 2 ? spanKm(cards.map((c) => c.site)) : 0;
  const unsaved = live.filter((id) => !lists.saved.includes(id)).length;
  // One enquiry is split into one request per owner, so the button says how many owners it reaches.
  const owners = new Set(cards.map((c) => c.owner?.id ?? c.site.permanentId)).size;
  const here = linked ? `/compare/?sites=${live.join(",")}` : "/compare/";

  return (
    <Shell active="find">
      <BasketEnhance />
      <Container className="py-8 lg:py-12">
        <p className="t-label text-ink-muted">Find sites</p>
        <h1 className="t-display-md mt-2" data-section="compare-heading">
          {cards.length >= 2 ? `Compare ${cards.length} sites` : "Compare sites"}
        </h1>

        {one(q.full) === "1" ? (
          <Notice
            tone="warning"
            title="You can compare four sites at a time."
            section="compare-full"
            className="mt-5"
          >
            Remove one below to add another.
          </Notice>
        ) : null}

        {cards.length === 0 ? (
          <div className="mx-auto mt-6 w-full max-w-[760px]" data-section="compare-empty">
            <EmptyState
              icon="pin"
              title="Nothing to compare yet"
              actions={
                <Button href="/search/" variant="primary" size="sm">
                  Find sites
                </Button>
              }
            >
              Press Compare on two to four sites in the results. They appear here side by side, fact
              by fact.
            </EmptyState>
          </div>
        ) : (
          <>
            <p className="t-body text-ink-muted mt-2 max-w-[68ch]" data-section="compare-lead">
              {cards.length === 1
                ? "Press Compare on at least one more site to see them side by side."
                : span >= 50
                  ? `Side by side, fact by fact. The two furthest apart are ${distanceText(span)} from each other.`
                  : `Side by side, fact by fact. These sites lie within ${distanceText(span)} of each other.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2" data-section="compare-actions">
              {unsaved > 0 ? (
                <form method="post" action="/api/lists/" data-plain="">
                  <input type="hidden" name="list" value="saved" />
                  <input type="hidden" name="action" value="add" />
                  <input type="hidden" name="ids" value={live.join(",")} />
                  <input type="hidden" name="return" value={here} />
                  <button type="submit" className="oh-btn primary sm">
                    Save {unsaved === cards.length ? "all" : `the other ${unsaved}`} to your
                    shortlist
                  </button>
                </form>
              ) : (
                <a href="/shortlist/" className="oh-btn primary sm" rel="nofollow">
                  View shortlist
                </a>
              )}
              {cards.length >= 2 ? (
                <a
                  href={`/enquire/plan/?sites=${live.join(",")}`}
                  rel="nofollow"
                  className="oh-btn accent sm"
                  data-action="enquire-all"
                >
                  {owners === 1
                    ? "Send one enquiry for these sites"
                    : `Send enquiry to ${owners} owners`}
                </a>
              ) : null}
              <button
                type="button"
                className="oh-btn secondary sm"
                data-copy={`/compare/?sites=${live.join(",")}`}
              >
                Copy link
              </button>
              <a href="/search/" className="oh-btn ghost sm">
                Back to results
              </a>
            </div>

            <div
              // "relative" keeps the screen-reader-only labels inside the scroller, so they cannot widen the page.
              className="border-hairline relative mt-6 overflow-x-auto rounded-md border"
              tabIndex={0}
              role="region"
              aria-label="Sites side by side"
              data-section="compare-table"
            >
              <table className="oh-compare" style={{ minWidth: 132 + cards.length * 200 }}>
                <thead>
                  <tr>
                    <th scope="row">Site</th>
                    {cards.map((card) => {
                      const id = card.site.permanentId ?? "";
                      const title = card.site.title ?? "This site";
                      return (
                        <th key={card.site.id} scope="col" data-site={id}>
                          <a
                            href={card.listing.url}
                            tabIndex={-1}
                            aria-hidden="true"
                            className="block"
                          >
                            <Thumb card={card} className="w-full" />
                          </a>
                          <a
                            href={card.listing.url}
                            className="oh-rowlink t-body-strong mt-2 block"
                          >
                            {title}
                          </a>
                          <span className="t-small text-ink-muted block font-normal">
                            {placeLine(card.site)}
                          </span>
                          <span className="mt-2 block">
                            {linked ? (
                              live.length > 1 ? (
                                <a
                                  href={`/compare/?sites=${live.filter((x) => x !== id).join(",")}`}
                                  className="oh-link t-small inline-flex min-h-11 items-center"
                                  rel="nofollow"
                                >
                                  Remove<span className="sr-only">: {title}</span>
                                </a>
                              ) : null
                            ) : (
                              <form method="post" action="/api/lists/" data-plain="">
                                <input type="hidden" name="list" value="compare" />
                                <input type="hidden" name="action" value="remove" />
                                <input type="hidden" name="id" value={id} />
                                <input type="hidden" name="return" value="/compare/" />
                                <button
                                  type="submit"
                                  className="oh-link t-small inline-flex min-h-11 cursor-pointer items-center font-normal"
                                >
                                  Remove<span className="sr-only">: {title}</span>
                                </button>
                              </form>
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <Line label="Size" cards={cards} cell={(c) => sizeFull(c.site)} />
                  <Line
                    label="Lighting"
                    cards={cards}
                    cell={(c) =>
                      `${lightingDef(c.site.lighting)?.label ?? ""}${c.site.litHours ? `, ${c.site.litHours}` : ""}` ||
                      GAP
                    }
                  />
                  <Line
                    label="Facing"
                    cards={cards}
                    cell={(c) =>
                      facingText(c.site.facingDeg) ? (
                        <>
                          {facingText(c.site.facingDeg)}
                          {c.site.trafficDirection ? (
                            <span className="src">{c.site.trafficDirection} traffic</span>
                          ) : null}
                        </>
                      ) : (
                        GAP
                      )
                    }
                  />
                  <Line
                    label="Audience"
                    cards={cards}
                    cell={(c) => {
                      const a = c.site.audience;
                      return a?.figure && a.source && a.measuredOn ? (
                        <>
                          {lakh(a.figure)} a week
                          <span className="src">
                            {a.source}, {monthYear(a.measuredOn)}
                          </span>
                        </>
                      ) : (
                        GAP
                      );
                    }}
                  />
                  <Line
                    label="Price a month"
                    cards={cards}
                    cell={(c) => {
                      const price = priceOf(c.site);
                      return price.shown ? `${price.prefix}${price.amount}` : "Price on request";
                    }}
                  />
                  <Line
                    label="Minimum period"
                    cards={cards}
                    cell={(c) => c.site.minPeriod || GAP}
                  />
                  <Line
                    label="Printing and mounting"
                    cards={cards}
                    cell={(c) =>
                      c.site.productionCost ||
                      (c.listing.isDigital ? "Not needed for a screen" : GAP)
                    }
                  />
                  <Line
                    label="Availability"
                    cards={cards}
                    data={false}
                    cell={(c) => {
                      const a = availabilityOf(c.site, now);
                      return (
                        <>
                          <AvailabilityChip availability={a} />
                          {a.note ? <span className="src mt-1">{a.note}</span> : null}
                        </>
                      );
                    }}
                  />
                  <Line
                    label="Owner"
                    cards={cards}
                    data={false}
                    cell={(c) => (
                      <>
                        {c.owner?.name ?? "Owner"}
                        <span className="src">
                          {c.owner?.medianReplyHours != null
                            ? c.owner.medianReplyHours < 24
                              ? "Replies in under a day"
                              : `Replies in about ${Math.round(c.owner.medianReplyHours / 24)} ${Math.round(c.owner.medianReplyHours / 24) === 1 ? "day" : "days"}`
                            : "Reply time not known yet"}
                        </span>
                      </>
                    )}
                  />
                  <Line
                    label="Checked"
                    cards={cards}
                    data={false}
                    cell={(c) => {
                      const checks = [
                        c.owner?.verified ? "Owner" : null,
                        c.site.verifiedLocation ? "Location" : null,
                        permitState(c.site, now) === "valid" ? "Permit" : null,
                      ].filter(Boolean);
                      return checks.length ? (
                        checks.join(" · ")
                      ) : (
                        <span className="text-ink-muted">Nothing yet</span>
                      );
                    }}
                  />
                  <Line
                    label="From the first site"
                    cards={cards}
                    cell={(c, i) =>
                      i === 0 || !first ? "This one" : distanceText(distanceKm(first.site, c.site))
                    }
                  />
                  <Line
                    label="Ask the owner"
                    cards={cards}
                    data={false}
                    cell={(c) => (
                      <a
                        href={`/enquire/${c.site.permanentId}/`}
                        rel="nofollow"
                        className="oh-btn secondary sm"
                      >
                        Enquire<span className="sr-only">: {c.site.title}</span>
                      </a>
                    )}
                  />
                </tbody>
              </table>
            </div>
            {!linked ? (
              <form method="post" action="/api/lists/" data-plain="" className="mt-4">
                <input type="hidden" name="list" value="compare" />
                <input type="hidden" name="action" value="clear" />
                <input type="hidden" name="return" value="/compare/" />
                <button type="submit" className="oh-btn ghost sm">
                  Clear the comparison
                </button>
              </form>
            ) : null}
          </>
        )}
      </Container>
    </Shell>
  );
}
