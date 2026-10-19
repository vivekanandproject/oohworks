import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Container, EmptyState, Note, Notice, SearchField } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { FollowForm } from "@/components/FollowForm";
import { BasketEnhance, ListSync } from "@/components/sites/Basket";
import { FilterEnhance } from "@/components/sites/Enhance";
import { FilterBar, FilterPanel, PhoneBar } from "@/components/sites/Filters";
import { MapPanel } from "@/components/sites/MapPanel";
import { PlanBar } from "@/components/sites/PlanBar";
import { QuickView } from "@/components/sites/QuickView";
import { SiteCard } from "@/components/sites/SiteCard";
import { StillMap } from "@/components/sites/StillMap";
import { formatDate } from "@/lib/editorial/format";
import { readLists } from "@/lib/sites/lists-server";
import { planText, summarise } from "@/lib/sites/plan";
import { listingsFor, searchSites } from "@/lib/sites/queries";
import {
  firstPage,
  toUrl,
  toggle,
  without,
  type RawParams,
  type SearchState,
} from "@/lib/sites/state";
import { TRUST, cityDef, formatDef, lightingDef } from "@/lib/sites/taxonomy";
import { dateRange } from "@/lib/sites/enquiry";
import { readStateSmart } from "@/lib/sites/understand";
import { indiaDate } from "@/lib/sites/calendar";
import { inr } from "@/lib/sites/view";

export const dynamic = "force-dynamic";

/** Search results are never indexed; hubs and site pages are the pages that rank. */
export const metadata: Metadata = {
  title: "Find sites",
  robots: { index: false, follow: true },
};

const MAP_STYLE = process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

/** "hoardings in Koramangala, Bengaluru", "LED screens", or plain "sites". One site is named in the singular. */
function describe(state: SearchState, localityLabel: string | undefined, single = false): string {
  const format = state.formats.length === 1 ? formatDef(state.formats[0]) : undefined;
  const plural = format
    ? format.slug === "led-screen"
      ? "LED screens"
      : format.plural.toLowerCase()
    : "sites";
  const what = single ? (format ? format.inSentence : "site") : plural;
  const city = cityDef(state.city)?.label;
  const where = state.bbox
    ? " in this map area"
    : city
      ? ` in ${localityLabel ? `${localityLabel}, ` : ""}${city}`
      : "";
  return `${what}${where}`;
}

function Pages({ state, pages }: { state: SearchState; pages: number }) {
  if (pages <= 1) return null;
  const from = Math.max(1, Math.min(state.page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => from + i).filter(
    (n) => n <= pages,
  );
  return (
    <nav
      aria-label="Pages"
      className="border-hairline mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      data-section="pager"
    >
      <span className="t-data text-ink-muted">
        Page {state.page} of {pages}
      </span>
      <div className="flex flex-wrap gap-2">
        {state.page > 1 ? (
          <a
            href={toUrl(state, { page: state.page - 1 })}
            rel="prev nofollow"
            className="oh-btn secondary sm"
          >
            Previous
          </a>
        ) : null}
        {numbers.map((n) =>
          n === state.page ? (
            <span key={n} aria-current="page" className="oh-btn primary sm">
              {n}
            </span>
          ) : (
            <a
              key={n}
              href={toUrl(state, { page: n })}
              rel="nofollow"
              className="oh-btn secondary sm"
            >
              {n}
            </a>
          ),
        )}
        {state.page < pages ? (
          <a
            href={toUrl(state, { page: state.page + 1 })}
            rel="next nofollow"
            className="oh-btn secondary sm"
          >
            Next
          </a>
        ) : null}
      </div>
    </nav>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams;
  const { state, typed, understood } = await readStateSmart(raw, indiaDate(Date.now()));
  const followed = raw.followed === "1";
  const followInvalid = raw.follow === "invalid";

  // One address per search. A filter form can leave an empty or out-of-order parameter behind, so the
  // visitor is sent to the tidy address. A typed query is left alone: it is what the visitor wrote.
  if (typed === state.q) {
    const given = new URLSearchParams();
    for (const [k, v] of Object.entries(raw))
      for (const x of Array.isArray(v) ? v : [v ?? ""]) given.append(k, x);
    const asked = `/search/${given.size ? `?${given.toString().replace(/%2C/g, ",")}` : ""}`;
    const base = toUrl(state);
    const extra = followed ? "followed=1" : followInvalid ? "follow=invalid" : "";
    const tidy = extra ? `${base}${base.includes("?") ? "&" : "?"}${extra}` : base;
    if (asked !== tidy) redirect(tidy);
  }

  const result = await searchSites(state);
  if (state.page > result.pages) redirect(toUrl(state, { page: 1 }));

  const now = Date.now();
  const onlyLocality =
    state.localities.length === 1
      ? result.facets.localities.find((l) => l.slug === state.localities[0])?.label
      : undefined;
  const what = describe(state, onlyLocality);
  const here = toUrl(state, { panel: false });
  const showMap = state.map && result.total > 0;
  const lists = await readLists();
  const plan = planText(summarise(await listingsFor(lists.saved)));
  // "Search this area" replaces the place: the map area becomes the place.
  const areaBase = toUrl(without(state, "city", "localities", "bbox"), { page: 1, panel: false });

  const chips: { key: string; label: string; remove: string }[] = [];
  if (understood) {
    if (state.city)
      chips.push({
        key: "city",
        label: cityDef(state.city)?.label ?? state.city,
        remove: toUrl(without(state, "city", "localities"), firstPage),
      });
    for (const f of state.formats)
      chips.push({
        key: `format-${f}`,
        label: formatDef(f)?.plural ?? f,
        remove: toUrl({ ...state, formats: toggle(state.formats, f) }, firstPage),
      });
    if (state.size)
      chips.push({
        key: "size",
        label: `${state.size.w} × ${state.size.h} ft`,
        remove: toUrl(without(state, "size"), firstPage),
      });
    if (state.max)
      chips.push({
        key: "max",
        label: `Under ${inr(state.max)} a month`,
        remove: toUrl(without(state, "max"), firstPage),
      });
    for (const l of state.lighting)
      chips.push({
        key: `lit-${l}`,
        label: lightingDef(l)?.label ?? l,
        remove: toUrl({ ...state, lighting: toggle(state.lighting, l) }, firstPage),
      });
    if (state.type)
      chips.push({
        key: "type",
        label: state.type === "digital" ? "Digital" : "Static",
        remove: toUrl(without(state, "type"), firstPage),
      });
    if (state.min)
      chips.push({
        key: "min",
        label: `From ${inr(state.min)} a month`,
        remove: toUrl(without(state, "min"), firstPage),
      });
    if (state.from)
      chips.push({
        key: "dates",
        label: state.to ? dateRange(state.from, state.to) : `From ${formatDate(state.from)}`,
        remove: toUrl(without(state, "from", "to"), firstPage),
      });
    for (const t of state.trust)
      chips.push({
        key: `trust-${t}`,
        label: TRUST.find((x) => x.key === t)?.label ?? t,
        remove: toUrl({ ...state, trust: toggle(state.trust, t) }, firstPage),
      });
    if (state.q)
      chips.push({
        key: "q",
        label: `“${state.q}”`,
        remove: toUrl({ ...state, q: "" }, firstPage),
      });
  }

  return (
    <Shell active="find">
      <FilterEnhance />
      <BasketEnhance />
      <ListSync />
      <QuickView />
      <Container className="pt-8 pb-4">
        <SearchField
          defaultValue={typed || state.q}
          size="lg"
          tone="primary"
          placeholder="Try: hoardings in Bengaluru, or 20 × 10 ft near Silk Board"
        />
        {chips.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2" data-section="understood">
            <span className="t-small text-ink-muted">Understood as</span>
            {chips.map((c) => (
              <a
                key={c.key}
                href={c.remove}
                className="oh-chip max-w-full"
                aria-current="page"
                aria-label={`Remove ${c.label}`}
                rel="nofollow"
              >
                <span className="truncate">{c.label}</span>
                <span className="x" aria-hidden="true">
                  ×
                </span>
              </a>
            ))}
          </div>
        ) : null}
      </Container>

      <FilterBar state={state} facets={result.facets} />

      <Container className="pt-5 pb-14">
        {result.anySample ? (
          <Note section="sample-notice" className="mb-4">
            These are sample listings for development. They are not real sites, and they are never
            shown to search engines.
          </Note>
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pb-4">
          <div>
            <h1 className="t-display-md" data-section="heading">
              {result.total > 0 ? (
                <>
                  <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {result.total}
                  </span>{" "}
                  {describe(state, onlyLocality, result.total === 1)}
                </>
              ) : (
                "Find sites"
              )}
            </h1>
            {result.median ? (
              <p className="t-small text-ink-muted mt-1" data-section="median">
                Median rate {inr(result.median.rate)} a month, from {result.median.n} sites that
                show a price · OOHWORKS data,{" "}
                {formatDate(new Date(now).toISOString()).replace(/^\d+ /, "")}
              </p>
            ) : null}
          </div>
          <a href="/how-results-are-ordered/" className="oh-link t-body">
            How results are ordered
          </a>
        </div>

        {followed ? (
          <Notice tone="success" title="Check your email." className="mb-6">
            {result.total > 0
              ? `We sent a link to confirm. After that, we will email you when new ${what} are listed, with a way to stop in every email.`
              : `We sent a link to confirm. After that, we will email you when the first ${what} are listed, with a way to stop in every email.`}
          </Notice>
        ) : null}
        {followInvalid ? (
          <Notice tone="error" title="That email did not look right." className="mb-6">
            Check it and try again; nothing was saved.
          </Notice>
        ) : null}

        {result.total > 0 ? (
          <div
            className={
              showMap ? "grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""
            }
            data-section="results"
            data-layout={showMap ? "map" : "list"}
          >
            <div className="min-w-0">
              <div className={`grid gap-5 sm:grid-cols-2 ${showMap ? "" : "lg:grid-cols-3"}`}>
                {result.cards.map((card) => (
                  <SiteCard key={card.site.id} card={card} now={now} lists={lists} back={here} />
                ))}
              </div>
              <Pages state={state} pages={result.pages} />
            </div>
            {showMap ? (
              <aside
                id="map"
                aria-label="Map of results"
                className="border-hairline bg-paper-sunken order-first h-[200px] scroll-mt-24 overflow-hidden rounded-md border sm:h-[300px] lg:sticky lg:top-[142px] lg:order-none lg:h-[640px]"
                data-section="map"
              >
                <MapPanel
                  points={result.points}
                  styleUrl={MAP_STYLE}
                  bbox={state.bbox}
                  areaBase={areaBase}
                  remember
                >
                  <StillMap
                    points={result.points}
                    label={`Where the ${result.total} matching sites sit relative to each other. Open the live map for streets.`}
                  />
                </MapPanel>
              </aside>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[760px]" data-section="results" data-layout="empty">
            <EmptyState
              icon="pin"
              title={result.catalogueSize === 0 ? "No sites listed yet" : `No ${what} yet`}
              actions={
                <>
                  <Button href="/list-your-sites/" variant="ghost" size="sm">
                    Own sites here? List them free
                  </Button>
                  <Button href="/guides/" variant="ghost" size="sm">
                    Read the guides
                  </Button>
                </>
              }
            >
              {result.catalogueSize === 0
                ? "The first verified sites go live city by city with the founding owners. Leave your email and we will tell you when your city opens."
                : `Nothing matches every filter you chose. Widen the search below, or leave your email and we will tell you the day ${what} appear.`}
            </EmptyState>
            {!followed ? (
              <FollowForm
                city={state.city}
                format={state.formats[0]}
                query={typed || state.q}
                returnTo={here}
                what={what}
                center
              />
            ) : null}
          </div>
        )}

        {result.total > 0 && !followed ? (
          <details
            className="border-hairline bg-paper-raised mx-auto mt-8 max-w-[760px] rounded-md border p-5"
            data-section="save-search"
            open={followInvalid}
          >
            <summary className="oh-link t-body-strong cursor-pointer py-3">
              Email me new sites for this search
            </summary>
            <p className="t-body text-ink-muted mt-2">
              We keep the search and your email, and write when a new site matches it. One email,
              then you choose.
            </p>
            <FollowForm
              city={state.city}
              format={state.formats[0]}
              query={typed || state.q}
              returnTo={here}
              what={what}
              search={here}
              label={`Email me new ${what}`}
            />
          </details>
        ) : null}

        {result.wider.length ? (
          <section
            className="border-hairline bg-paper-raised mx-auto mt-8 max-w-[760px] rounded-md border p-5"
            data-section="wider"
          >
            <h2 className="t-display-sm">Widen your search</h2>
            <p className="t-body text-ink-muted mt-1">
              Each change shows how many sites it would add.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.wider.map((w) => (
                <a key={w.label} href={w.url} className="oh-chip" rel="nofollow">
                  {w.label} <span className="count">+{w.add}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      {/* One strip at the foot of the screen. From 640px up it is what the buyer has saved; on a phone it
          is the filter, sort, map and shortlist controls, so the header and strip together stay under a
          quarter of the screen. */}
      <div className="bg-paper-raised sticky bottom-0 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="hidden sm:block">
          <PlanBar text={plan} saved={lists.saved.length} compare={lists.compare.length} />
        </div>
        <PhoneBar state={state} saved={lists.saved.length} compare={lists.compare.length} />
      </div>
      {state.panel ? (
        <FilterPanel state={state} facets={result.facets} total={result.total} />
      ) : null}
    </Shell>
  );
}
