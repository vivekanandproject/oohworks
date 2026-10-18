import type { ReactNode } from "react";
import { Container } from "@ohworks/ui";
import type { Facets, Option } from "@/lib/sites/filter";
import {
  activeCount,
  firstPage,
  toUrl,
  toggle,
  without,
  type SearchState,
} from "@/lib/sites/state";
import { SORTS, cityDef, type TrustKey } from "@/lib/sites/taxonomy";
import { inr } from "@/lib/sites/view";

/** The other filters, carried through a small form so applying one never drops the rest. */
function Carry({ state, omit }: { state: SearchState; omit: string[] }) {
  const params = new URLSearchParams(toUrl(state, firstPage).split("?")[1] ?? "");
  return (
    <>
      {[...params.entries()]
        .filter(([k]) => !omit.includes(k))
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
    </>
  );
}

/** A filter option drawn as a tick box, but a real link: it works without script and can be shared. */
function Opt({
  href,
  on,
  label,
  count,
  radio = false,
}: {
  href: string;
  on: boolean;
  label: string;
  count?: number;
  radio?: boolean;
}) {
  const cls = `oh-opt${radio ? " radio" : ""}${on ? " on" : ""}`;
  if (!on && count === 0) {
    return (
      <span className={`${cls} none`} aria-disabled="true">
        <span className="box" aria-hidden="true" />
        {label}
        <span className="n">0</span>
      </span>
    );
  }
  return (
    <a href={href} className={cls} rel="nofollow" aria-current={on ? "true" : undefined}>
      <span className="box" aria-hidden="true" />
      <span>
        {on ? <span className="sr-only">Selected: </span> : null}
        {label}
      </span>
      {count !== undefined ? <span className="n">{count}</span> : null}
    </a>
  );
}

function Drop({
  label,
  set,
  align,
  up,
  children,
  name,
}: {
  label: ReactNode;
  set: boolean;
  align?: "right";
  up?: boolean;
  children: ReactNode;
  name: string;
}) {
  return (
    <details className="oh-dd" data-filter={name}>
      <summary className={`oh-chip ${set ? "set" : ""}`}>{label}</summary>
      <div className={`oh-pop ${align === "right" ? "right" : ""} ${up ? "up" : ""}`}>
        {children}
      </div>
    </details>
  );
}

function CityOptions({ state, facets }: { state: SearchState; facets: Facets }) {
  return (
    <>
      {facets.cities.map((c) => (
        <Opt
          key={c.slug}
          radio
          label={c.label}
          count={c.count}
          on={state.city === c.slug}
          href={
            state.city === c.slug
              ? toUrl(without(state, "city", "localities"), firstPage)
              : toUrl(without({ ...state, city: c.slug, localities: [] }, "bbox"), firstPage)
          }
        />
      ))}
    </>
  );
}

function LocalityOptions({
  state,
  facets,
  limit,
}: {
  state: SearchState;
  facets: Facets;
  limit?: number;
}) {
  if (!state.city || facets.localities.length === 0) return null;
  const shown = limit ? facets.localities.slice(0, limit) : facets.localities;
  return (
    <>
      {shown.map((l) => (
        <Opt
          key={l.slug}
          label={l.label}
          count={l.count}
          on={state.localities.includes(l.slug)}
          href={toUrl({ ...state, localities: toggle(state.localities, l.slug) }, firstPage)}
        />
      ))}
    </>
  );
}

function ListOptions({
  state,
  options,
  field,
}: {
  state: SearchState;
  options: Option[];
  field: "formats" | "lighting";
}) {
  return (
    <>
      {options.map((o) => (
        <Opt
          key={o.slug}
          label={o.label}
          count={o.count}
          on={state[field].includes(o.slug)}
          href={toUrl({ ...state, [field]: toggle(state[field], o.slug) }, firstPage)}
        />
      ))}
    </>
  );
}

function SizeForm({ state, id }: { state: SearchState; id: string }) {
  return (
    <form action="/search/" method="get" className="flex flex-col gap-3">
      <Carry state={without(state, "size")} omit={["size"]} />
      <label className="oh-label" htmlFor={`${id}-size`}>
        Width × height, in feet
      </label>
      <input
        id={`${id}-size`}
        name="size"
        className="oh-input data"
        placeholder="20x10"
        defaultValue={state.size ? `${state.size.w}x${state.size.h}` : ""}
        pattern="\d{1,3}(\.\d)?x\d{1,3}(\.\d)?"
        inputMode="text"
        autoComplete="off"
      />
      <p className="t-small text-ink-muted">Matches sites within a tenth of this size.</p>
      <div className="flex items-center justify-between gap-2">
        {state.size ? (
          <a
            href={toUrl(without(state, "size"), firstPage)}
            className="oh-link t-small inline-flex min-h-11 items-center"
            rel="nofollow"
          >
            Any size
          </a>
        ) : (
          <span />
        )}
        <button type="submit" className="oh-btn primary sm">
          Apply
        </button>
      </div>
    </form>
  );
}

function PriceForm({ state, facets, id }: { state: SearchState; facets: Facets; id: string }) {
  return (
    <div className="flex flex-col gap-3">
      <form action="/search/" method="get" className="flex flex-col gap-3">
        <Carry state={without(state, "min", "max")} omit={["min", "max"]} />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="oh-label" htmlFor={`${id}-min`}>
              From
            </label>
            <div className="oh-affix">
              <span>₹</span>
              <input
                id={`${id}-min`}
                name="min"
                className="oh-input data"
                inputMode="numeric"
                placeholder="Any"
                defaultValue={state.min ?? ""}
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="oh-label" htmlFor={`${id}-max`}>
              Up to
            </label>
            <div className="oh-affix">
              <span>₹</span>
              <input
                id={`${id}-max`}
                name="max"
                className="oh-input data"
                inputMode="numeric"
                placeholder="Any"
                defaultValue={state.max ?? ""}
              />
            </div>
          </div>
        </div>
        <p className="t-small text-ink-muted">
          A month. A price limit leaves out sites whose owners show no price.
        </p>
        <div className="flex items-center justify-between gap-2">
          {state.min || state.max ? (
            <a
              href={toUrl(without(state, "min", "max"), firstPage)}
              className="oh-link t-small inline-flex min-h-11 items-center"
              rel="nofollow"
            >
              Any price
            </a>
          ) : (
            <span />
          )}
          <button type="submit" className="oh-btn primary sm">
            Apply
          </button>
        </div>
      </form>
      <div className="border-hairline border-t pt-2">
        <Opt
          label="Only sites that show a price"
          count={facets.priced}
          on={state.priced}
          href={toUrl({ ...state, priced: !state.priced }, firstPage)}
        />
      </div>
    </div>
  );
}

function DatesForm({ state, id }: { state: SearchState; id: string }) {
  return (
    <form action="/search/" method="get" className="flex flex-col gap-3">
      <Carry state={without(state, "from", "to")} omit={["from", "to"]} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label className="oh-label" htmlFor={`${id}-from`}>
            Free from
          </label>
          <input
            id={`${id}-from`}
            name="from"
            type="date"
            className="oh-input"
            defaultValue={state.from ?? ""}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label className="oh-label" htmlFor={`${id}-to`}>
            Until
          </label>
          <input
            id={`${id}-to`}
            name="to"
            type="date"
            className="oh-input"
            defaultValue={state.to ?? ""}
          />
        </div>
      </div>
      <p className="t-small text-ink-muted">Shows sites that are not booked on your start date.</p>
      <div className="flex items-center justify-between gap-2">
        {state.from ? (
          <a
            href={toUrl(without(state, "from", "to"), firstPage)}
            className="oh-link t-small inline-flex min-h-11 items-center"
            rel="nofollow"
          >
            Any dates
          </a>
        ) : (
          <span />
        )}
        <button type="submit" className="oh-btn primary sm">
          Apply
        </button>
      </div>
    </form>
  );
}

function priceLabel(state: SearchState): string {
  if (state.min && state.max) return `${inr(state.min)} to ${inr(state.max)}`;
  if (state.max) return `Under ${inr(state.max)}`;
  if (state.min) return `From ${inr(state.min)}`;
  return state.priced ? "Price shown" : "Price";
}

function SortOptions({ state }: { state: SearchState }) {
  return (
    <>
      {SORTS.map((s) => (
        <Opt
          key={s.key}
          radio
          label={s.label}
          on={state.sort === s.key}
          href={toUrl({ ...state, sort: s.key }, firstPage)}
        />
      ))}
    </>
  );
}

/** The bar of most-used filters. It stays under the navigation while the results scroll. */
export function FilterBar({ state, facets }: { state: SearchState; facets: Facets }) {
  const n = activeCount(state);
  const sortLabel = SORTS.find((s) => s.key === state.sort)?.label ?? "Best match";
  const formatLabel =
    state.formats.length === 1
      ? (facets.formats.find((f) => f.slug === state.formats[0])?.label ?? "Format")
      : state.formats.length
        ? `${state.formats.length} formats`
        : "Format";
  return (
    <div
      className="border-hairline bg-paper z-10 hidden border-b sm:block lg:sticky lg:top-[65px]"
      data-section="filterbar"
    >
      <Container className="py-2.5">
        {/* Below desktop width a menu opens under the whole row, so it can never run off the screen. */}
        <div className="relative flex flex-wrap items-center gap-2">
          <Drop
            name="place"
            set={Boolean(state.city)}
            label={
              state.city
                ? `${cityDef(state.city)?.label}${state.localities.length ? ` · ${state.localities.length} ${state.localities.length === 1 ? "area" : "areas"}` : ""}`
                : "Place"
            }
          >
            <CityOptions state={state} facets={facets} />
            {state.city && facets.localities.length ? (
              <div className="border-hairline mt-1 border-t pt-1">
                <p className="t-label text-ink-muted px-2 py-1">Areas</p>
                <LocalityOptions state={state} facets={facets} limit={8} />
              </div>
            ) : null}
          </Drop>
          {state.bbox ? (
            <a
              href={toUrl(without(state, "bbox"), firstPage)}
              className="oh-chip set"
              aria-label="Remove the map area"
              rel="nofollow"
              data-remove-area=""
            >
              Map area
              <span className="x" aria-hidden="true">
                ×
              </span>
            </a>
          ) : null}
          <Drop name="format" set={state.formats.length > 0} label={formatLabel}>
            <ListOptions state={state} options={facets.formats} field="formats" />
          </Drop>
          <Drop
            name="size"
            set={Boolean(state.size)}
            label={state.size ? `${state.size.w} × ${state.size.h} ft` : "Size"}
          >
            <SizeForm state={state} id="bar" />
          </Drop>
          <Drop
            name="price"
            set={Boolean(state.min || state.max || state.priced)}
            label={priceLabel(state)}
          >
            <PriceForm state={state} facets={facets} id="bar" />
          </Drop>
          <Drop name="dates" set={Boolean(state.from)} label={state.from ? "Dates set" : "Dates"}>
            <DatesForm state={state} id="bar" />
          </Drop>
          <a
            href={toUrl(state, { panel: true })}
            className={`oh-chip ${n ? "set" : ""}`}
            rel="nofollow"
            data-open-filters=""
          >
            All filters {n ? <span className="count">{n}</span> : null}
          </a>
          <span className="flex-1" />
          <Drop name="sort" set={state.sort !== "best"} align="right" label={`Sort: ${sortLabel}`}>
            <SortOptions state={state} />
          </Drop>
          <a
            href={toUrl(state, { map: !state.map })}
            className="oh-chip"
            rel="nofollow"
            data-toggle-map=""
          >
            {state.map ? "Hide map" : "Show map"}
          </a>
        </div>
      </Container>
    </div>
  );
}

/** On a phone the same controls sit in a bar at the bottom of the screen: Filters, Sort and Map. */
/**
 * The strip at the foot of a phone screen: filters, sort, the map, and the shortlist once something is
 * saved. One strip, so that with the header it stays under a quarter of the screen.
 */
export function PhoneBar({ state, saved = 0 }: { state: SearchState; saved?: number }) {
  const n = activeCount(state);
  return (
    <div
      className="border-hairline bg-paper-raised flex items-center gap-2 border-t px-4 py-2 sm:hidden"
      data-section="phonebar"
    >
      <a href={toUrl(state, { panel: true })} className="oh-btn secondary sm flex-1" rel="nofollow">
        Filters {n ? <span className="font-mono">{n}</span> : null}
      </a>
      <details className="oh-dd flex-1" data-filter="sort-phone">
        <summary className="oh-btn secondary sm w-full">Sort</summary>
        <div className="oh-pop up">
          <SortOptions state={state} />
        </div>
      </details>
      <a href="#map" className="oh-btn primary sm flex-1">
        Map
      </a>
      <a
        href="/shortlist/"
        className="oh-btn primary sm flex-1"
        hidden={saved === 0}
        data-plan-saved=""
        rel="nofollow"
      >
        Shortlist{" "}
        <span className="font-mono" data-plan-saved-n="">
          {saved}
        </span>
      </a>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="group">
      <h3 className="t-label text-ink-muted pb-1">{title}</h3>
      {children}
    </section>
  );
}

/** Every filter in one panel, each option with the number of sites it would leave. A real page state, so it can be shared and the back button closes it. */
export function FilterPanel({
  state,
  facets,
  total,
}: {
  state: SearchState;
  facets: Facets;
  total: number;
}) {
  const closeUrl = toUrl(state, { panel: false });
  const clearUrl = toUrl({
    q: state.q,
    localities: [],
    formats: [],
    lighting: [],
    priced: false,
    trust: [],
    sort: state.sort,
    page: 1,
    map: state.map,
    panel: true,
  });
  return (
    <>
      <a
        href={closeUrl}
        className="oh-drawer-backdrop"
        aria-label="Close filters"
        rel="nofollow"
        tabIndex={-1}
      />
      <aside
        className="oh-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="All filters"
        data-section="filterpanel"
      >
        <div className="border-hairline flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="t-display-sm">All filters</h2>
          <a
            href={closeUrl}
            className="oh-link t-body-strong inline-flex min-h-11 items-center"
            rel="nofollow"
            data-drawer-close=""
          >
            Close
          </a>
        </div>
        <div className="scroll">
          <Group title="Place">
            {state.bbox ? (
              <a
                href={toUrl(without(state, "bbox"), firstPage)}
                className="oh-opt on"
                rel="nofollow"
                aria-current="true"
              >
                <span className="box" aria-hidden="true" />
                <span>Map area. Press to remove it</span>
              </a>
            ) : null}
            <CityOptions state={state} facets={facets} />
            {state.city && facets.localities.length ? (
              <>
                <p className="t-small text-ink-muted px-2 pt-2">
                  Areas in {cityDef(state.city)?.label}
                </p>
                <LocalityOptions state={state} facets={facets} />
              </>
            ) : null}
          </Group>
          <Group title="Site">
            <ListOptions state={state} options={facets.formats} field="formats" />
            <div className="flex flex-wrap gap-2 px-2 py-2">
              {facets.types.map((t) => (
                <a
                  key={t.slug}
                  href={
                    state.type === t.slug
                      ? toUrl(without(state, "type"), firstPage)
                      : toUrl({ ...state, type: t.slug as "static" | "digital" }, firstPage)
                  }
                  className="oh-chip"
                  aria-current={state.type === t.slug ? "page" : undefined}
                  rel="nofollow"
                >
                  {t.label} <span className="count">{t.count}</span>
                </a>
              ))}
            </div>
            <div className="px-2 pt-1">
              <SizeForm state={state} id="panel" />
            </div>
            <p className="t-small text-ink-muted px-2 pt-3">Lighting</p>
            <ListOptions state={state} options={facets.lighting} field="lighting" />
          </Group>
          <Group title="Price and dates">
            <div className="px-2">
              <PriceForm state={state} facets={facets} id="panel" />
            </div>
            <div className="px-2 pt-4">
              <DatesForm state={state} id="panel" />
            </div>
          </Group>
          <Group title="Checked by ohworks">
            {facets.trust.map((t) => (
              <Opt
                key={t.slug}
                label={t.label}
                count={t.count}
                on={state.trust.includes(t.slug as TrustKey)}
                href={toUrl(
                  { ...state, trust: toggle(state.trust, t.slug as TrustKey) },
                  firstPage,
                )}
              />
            ))}
          </Group>
        </div>
        <div className="border-hairline flex items-center justify-between gap-3 border-t px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <a
            href={clearUrl}
            className="oh-link t-body-strong inline-flex min-h-11 items-center"
            rel="nofollow"
          >
            Clear all
          </a>
          <a href={closeUrl} className="oh-btn primary" rel="nofollow" data-show-results="">
            Show {total} {total === 1 ? "site" : "sites"}
          </a>
        </div>
      </aside>
    </>
  );
}
