import type { Metadata } from "next";
import { Badge, Button, Container, EmptyState, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { BasketEnhance } from "@/components/sites/Basket";
import { ListToggle } from "@/components/sites/ListToggle";
import { QuickView } from "@/components/sites/QuickView";
import { AvailabilityChip } from "@/components/sites/SiteCard";
import { Thumb } from "@/components/sites/SiteParts";
import { formatDate } from "@/lib/editorial/format";
import { absolute } from "@/lib/seo";
import { dateRange } from "@/lib/sites/enquiry";
import { LISTS, parseIds } from "@/lib/sites/lists";
import { readLists } from "@/lib/sites/lists-server";
import { budgetLine, freeFor, summarise } from "@/lib/sites/plan";
import { cardsFor, type Card } from "@/lib/sites/queries";
import { lightingDef } from "@/lib/sites/taxonomy";
import { availabilityOf, inr, placeLine, priceOf } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your shortlist",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim();
const isDate = (v: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

function Remove({ id, title, back }: { id: string; title: string; back: string }) {
  return (
    <form method="post" action="/api/lists/" data-plain="">
      <input type="hidden" name="list" value="saved" />
      <input type="hidden" name="action" value="remove" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="return" value={back} />
      <button type="submit" className="oh-btn ghost sm px-2">
        Remove<span className="sr-only">: {title}</span>
      </button>
    </form>
  );
}

function Row({
  card,
  now,
  from,
  enquiry,
  own,
  back,
  comparing,
  saved,
}: {
  card: Card;
  now: number;
  from: string | undefined;
  enquiry: string;
  own: boolean;
  back: string;
  comparing: boolean;
  saved: boolean;
}) {
  const { site, listing } = card;
  const id = site.permanentId ?? "";
  const title = site.title ?? "This site";
  const price = priceOf(site);
  const availability = availabilityOf(site, now);
  const forDates = freeFor(listing, from);
  return (
    <li
      className="border-hairline flex flex-wrap gap-x-4 gap-y-3 border-b px-4 py-4 last:border-b-0"
      data-site={id}
    >
      <a href={listing.url} tabIndex={-1} aria-hidden="true" className="w-24 shrink-0">
        <Thumb card={card} />
      </a>
      <div className="min-w-[180px] flex-1">
        <h3 className="text-[16px] leading-[22px] font-semibold">
          <a href={listing.url} className="oh-rowlink">
            {title}
          </a>
        </h3>
        <p className="t-small text-ink-muted mt-0.5">
          {[placeLine(site), lightingDef(site.lighting)?.label.toLowerCase()]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-2" data-row-availability="">
          {forDates === "free" && availability.state === "free" ? (
            <span className="oh-badge verified">Free for your dates</span>
          ) : (
            <AvailabilityChip availability={availability} />
          )}
        </p>
      </div>
      <div className="flex min-w-[150px] flex-col items-end gap-2 sm:ml-auto">
        <p
          className="font-mono text-[16px] leading-6 font-medium"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {price.shown ? (
            <>
              {price.prefix}
              {price.amount}{" "}
              <span className="t-small text-ink-muted font-sans font-normal">/ month</span>
            </>
          ) : (
            "Price on request"
          )}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {own ? (
            <Remove id={id} title={title} back={back} />
          ) : (
            <ListToggle
              list="saved"
              id={id}
              title={title}
              on={saved}
              back={back}
              className="oh-btn ghost sm px-2"
            />
          )}
          <ListToggle
            list="compare"
            id={id}
            title={title}
            on={comparing}
            back={back}
            className="oh-btn ghost sm px-2"
          />
          <a href={`/enquire/${id}/${enquiry}`} rel="nofollow" className="oh-btn secondary sm">
            Enquire
          </a>
        </div>
      </div>
    </li>
  );
}

export default async function ShortlistPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const lists = await readLists();
  const shared = one(q.sites) !== "";
  const ids = shared ? parseIds(one(q.sites), LISTS.saved.max) : lists.saved;
  const cards = await cardsFor(ids);
  const gone = ids.length - cards.length;
  const now = Date.now();

  const from = isDate(one(q.from)) ? one(q.from) : undefined;
  const to = isDate(one(q.to)) && (!from || one(q.to) >= from) ? one(q.to) : undefined;
  const budgetRaw = Number(one(q.budget).replace(/[\s,₹]/g, ""));
  const budget =
    Number.isFinite(budgetRaw) && budgetRaw > 0 && budgetRaw < 1e10
      ? Math.round(budgetRaw)
      : undefined;

  const summary = summarise(cards.map((c) => c.listing));
  const line = budgetLine(summary, budget);
  const dates = new URLSearchParams();
  if (from) dates.set("from", from);
  if (to) dates.set("to", to);
  const enquiry = dates.size ? `?${dates.toString()}` : "";
  const own = new URLSearchParams(dates);
  if (budget) own.set("budget", String(budget));
  const live = cards.map((c) => c.site.permanentId).join(",");
  // The link carries the sites and the dates. The budget stays with the buyer.
  const sharePath = `/shortlist/?sites=${live}${dates.size ? `&${dates.toString()}` : ""}`;
  const back = shared
    ? `${sharePath}${budget ? `&budget=${budget}` : ""}`
    : `/shortlist/${own.size ? `?${own.toString()}` : ""}`;
  const shareUrl = absolute(sharePath);

  const groups = new Map<number, Card[]>();
  for (const card of cards)
    groups.set(card.listing.ownerId, [...(groups.get(card.listing.ownerId) ?? []), card]);
  const unsaved = cards.filter((c) => !lists.saved.includes(c.site.permanentId ?? "")).length;

  return (
    <Shell active="find">
      <BasketEnhance />
      <QuickView />
      <Container className="py-8 lg:py-12">
        <p className="t-label text-ink-muted">Find sites</p>
        <h1 className="t-display-md mt-2">{shared ? "A shared shortlist" : "Your shortlist"}</h1>
        <p className="t-body text-ink-muted mt-2 max-w-[68ch]">
          {shared
            ? "Someone sent you these sites. They are not saved in your browser unless you save them."
            : "The sites you saved, grouped by the owner who sells them. It is kept in this browser; nobody sees it until you enquire or share it."}
        </p>

        {gone > 0 ? (
          <p
            className="t-small border-hairline bg-lit-tint text-ink mt-5 max-w-[68ch] rounded-sm border px-3 py-2"
            data-section="gone"
          >
            {gone === 1
              ? "One site here is no longer listed, so it is not shown."
              : `${gone} sites here are no longer listed, so they are not shown.`}
          </p>
        ) : null}

        {cards.length === 0 ? (
          <div className="mx-auto mt-6 w-full max-w-[760px]" data-section="shortlist-empty">
            <EmptyState icon="pin" title="No sites saved yet">
              Press Save on any site in the results, or on its page, and it appears here with the
              others from the same owner.
            </EmptyState>
            <div className="mt-4">
              <Button href="/search/" variant="primary">
                Find sites
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
            <div className="min-w-0 space-y-5" data-section="shortlist">
              {shared && unsaved > 0 ? (
                <form
                  method="post"
                  action="/api/lists/"
                  data-plain=""
                  className="border-hairline bg-paper-raised flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
                  data-section="save-all"
                >
                  <input type="hidden" name="list" value="saved" />
                  <input type="hidden" name="action" value="add" />
                  <input type="hidden" name="ids" value={live} />
                  <input
                    type="hidden"
                    name="return"
                    value={`/shortlist/${dates.size ? `?${dates.toString()}` : ""}`}
                  />
                  <p className="t-body text-ink">
                    Keep these in your own shortlist to come back to them.
                  </p>
                  <button type="submit" className="oh-btn primary sm">
                    Save {unsaved === cards.length ? "all" : `the other ${unsaved}`} to your
                    shortlist
                  </button>
                </form>
              ) : null}
              {[...groups.entries()].map(([ownerId, items]) => {
                const owner = items[0]?.owner;
                return (
                  <section
                    key={ownerId}
                    className="border-hairline bg-paper-raised overflow-hidden rounded-md border"
                    data-owner-group={owner?.slug ?? ownerId}
                  >
                    <header className="border-hairline bg-paper-sunken flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                      <h2 className="text-[16px] leading-[22px] font-semibold">
                        {owner?.name ?? "Owner"}{" "}
                        <span className="t-small text-ink-muted font-normal">
                          · {items.length === 1 ? "1 site" : `${items.length} sites`}
                        </span>
                      </h2>
                      <div className="flex flex-wrap gap-1">
                        {owner?.verified ? <Badge kind="verified">Verified owner</Badge> : null}
                        {owner?.medianReplyHours != null && owner.medianReplyHours < 24 ? (
                          <Badge kind="responsive">Replies in under a day</Badge>
                        ) : null}
                      </div>
                    </header>
                    <ul>
                      {items.map((card) => (
                        <Row
                          key={card.site.id}
                          card={card}
                          now={now}
                          from={from}
                          enquiry={enquiry}
                          own={!shared}
                          back={back}
                          comparing={lists.compare.includes(card.site.permanentId ?? "")}
                          saved={lists.saved.includes(card.site.permanentId ?? "")}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
              {!shared ? (
                <form method="post" action="/api/lists/" data-plain="">
                  <input type="hidden" name="list" value="saved" />
                  <input type="hidden" name="action" value="clear" />
                  <input type="hidden" name="return" value="/shortlist/" />
                  <button type="submit" className="oh-btn ghost sm">
                    Clear the shortlist
                  </button>
                </form>
              ) : null}
            </div>

            <aside
              className="border-hairline bg-paper-raised space-y-5 rounded-md border p-5 lg:sticky lg:top-24"
              aria-label="Summary"
              data-section="plan-summary"
            >
              <h2 className="t-display-sm">Summary</h2>
              <form
                method="get"
                action="/shortlist/"
                className="grid grid-cols-2 gap-3"
                data-section="plan-form"
              >
                {shared ? <input type="hidden" name="sites" value={live} /> : null}
                <div>
                  <label htmlFor="plan-from" className="oh-label block">
                    From
                  </label>
                  <input
                    id="plan-from"
                    name="from"
                    type="date"
                    defaultValue={from ?? ""}
                    className="oh-input data mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="plan-to" className="oh-label block">
                    Until
                  </label>
                  <input
                    id="plan-to"
                    name="to"
                    type="date"
                    defaultValue={to ?? ""}
                    className="oh-input data mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="plan-budget" className="oh-label block">
                    Budget a month, optional
                  </label>
                  <div className="oh-affix mt-1">
                    <span aria-hidden="true">₹</span>
                    <input
                      id="plan-budget"
                      name="budget"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9, ]*"
                      maxLength={14}
                      defaultValue={budget ?? ""}
                      className="oh-input data"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <button type="submit" className="oh-btn secondary sm">
                    Update the summary
                  </button>
                </div>
              </form>

              <dl
                className="border-hairline divide-hairline divide-y border-y"
                data-section="plan-totals"
              >
                {[
                  ["Sites", String(summary.sites)],
                  ["Owners", String(summary.owners)],
                  [
                    "Shown prices, a month",
                    summary.priced
                      ? `${summary.floor ? "From " : ""}${inr(summary.shown)}`
                      : "None shown",
                  ],
                  [
                    "Price on request",
                    summary.onRequest === 0
                      ? "None"
                      : summary.onRequest === 1
                        ? "1 site"
                        : `${summary.onRequest} sites`,
                  ],
                  ...(from && to
                    ? [["Your dates", dateRange(from, to)]]
                    : from
                      ? [["From", formatDate(from)]]
                      : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="t-body text-ink-muted">{label}</dt>
                    <dd
                      className="text-right font-mono text-[15px] leading-[22px] font-medium"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {line ? (
                <p
                  className={`t-body text-ink rounded-sm px-3 py-2 ${line.state === "over" ? "bg-lit-tint" : "bg-verified-tint"}`}
                  data-section="plan-budget"
                  data-budget={line.state}
                >
                  {line.text}
                </p>
              ) : null}
              <p className="t-small text-ink-muted">
                The sum counts only the prices owners show, before taxes, printing and mounting.
                Nothing is estimated.
              </p>

              <div className="space-y-3" data-section="plan-actions">
                <a
                  href={`/enquire/plan/?sites=${live}${dates.size ? `&${dates.toString()}` : ""}`}
                  rel="nofollow"
                  className="oh-btn accent lg w-full text-center whitespace-normal"
                  data-action="enquire-all"
                >
                  {cards.length === 1
                    ? "Send enquiry"
                    : summary.owners === 1
                      ? "Send one enquiry for these sites"
                      : `Send enquiry to ${summary.owners} owners`}
                </a>
                <p className="t-small text-ink-muted">
                  {summary.owners === 1
                    ? "It goes straight to the owner."
                    : "One request goes to each owner. Each sees only their own sites, never the rest of your shortlist."}{" "}
                  Your budget is not sent.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/export/shortlist/?sites=${live}${from ? `&from=${from}` : ""}`}
                    rel="nofollow"
                    className="oh-btn secondary sm"
                    data-action="export-excel"
                  >
                    Download Excel
                  </a>
                  <a
                    href={`/shortlist/sheets/?sites=${live}${dates.size ? `&${dates.toString()}` : ""}`}
                    rel="nofollow"
                    className="oh-btn secondary sm"
                    data-action="export-sheets"
                  >
                    Site sheets to print
                  </a>
                </div>
              </div>

              <div data-section="plan-share">
                <label htmlFor="plan-link" className="oh-label block">
                  Share this shortlist
                </label>
                <input
                  id="plan-link"
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="oh-input data mt-1"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="oh-btn secondary sm" data-copy={sharePath}>
                    Copy link
                  </button>
                  <a
                    className="oh-btn secondary sm"
                    href={`https://wa.me/?text=${encodeURIComponent(`A shortlist of ${summary.sites} out-of-home ${summary.sites === 1 ? "site" : "sites"} on OOHWORKS: ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    WhatsApp
                  </a>
                  {cards.length >= 2 ? (
                    <a
                      className="oh-btn secondary sm"
                      href={`/compare/?sites=${cards
                        .slice(0, LISTS.compare.max)
                        .map((c) => c.site.permanentId)
                        .join(",")}`}
                      rel="nofollow"
                      data-action="compare-these"
                    >
                      Compare{" "}
                      {cards.length > LISTS.compare.max
                        ? `the first ${LISTS.compare.max}`
                        : "these"}
                    </a>
                  ) : null}
                </div>
                <p className="t-small text-ink-muted mt-2">
                  The link carries the sites and your dates, never your budget.
                </p>
              </div>
              <p className="t-small text-ink-muted border-hairline border-t pt-4">
                Each enquiry goes straight to that site&rsquo;s owner. {NEUTRALITY_LINE}
              </p>
            </aside>
          </div>
        )}
      </Container>
    </Shell>
  );
}
