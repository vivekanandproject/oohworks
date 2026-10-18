import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Container, Note } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { BasketEnhance, ListSync } from "@/components/sites/Basket";
import { MapPanel } from "@/components/sites/MapPanel";
import { PlanBar } from "@/components/sites/PlanBar";
import { QuickView } from "@/components/sites/QuickView";
import { SiteCard } from "@/components/sites/SiteCard";
import { StillMap } from "@/components/sites/StillMap";
import { absolute, alternates, JsonLd } from "@/lib/seo";
import { hubPath, type Hub } from "@/lib/sites/hubs";
import { readLists } from "@/lib/sites/lists-server";
import { planText, summarise } from "@/lib/sites/plan";
import { hubData, listingsFor } from "@/lib/sites/queries";
import { DEFAULT_STATE, toUrl } from "@/lib/sites/state";
import { cityDef, formatDef } from "@/lib/sites/taxonomy";

const MAP_STYLE = process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

/** The page number in a hub's address: 2 and up. "1" belongs to the hub's own address. */
export function hubPageNumber(hub: Hub | null, raw: string): number {
  if (!hub || !/^[1-9]\d{0,3}$/.test(raw)) notFound();
  const n = Number(raw);
  if (n === 1) permanentRedirect(hubPath(hub));
  return n;
}

export async function hubMetadata(hub: Hub | null, page: number): Promise<Metadata> {
  const data = hub ? await hubData(hub, page) : null;
  if (!hub || !data) return {};
  return {
    title: `${data.title}${page > 1 ? ` · page ${page}` : ""}`,
    description: data.fact,
    // A preview exists only to be looked at locally. It is never offered to a search engine.
    robots: data.preview ? { index: false, follow: false } : { index: true, follow: true },
    alternates: alternates(hubPath(hub, page)),
  };
}

function Chips({
  title,
  links,
}: {
  title: string;
  links: { label: string; count: number; href: string; hub: boolean }[];
}) {
  if (links.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-section={`hub-${title === "By format" ? "formats" : "areas"}`}
    >
      <span className="t-small text-ink-muted w-full sm:w-auto">{title}</span>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="oh-chip"
          {...(l.hub ? {} : { rel: "nofollow" })}
          data-hub-link={l.hub ? "hub" : "search"}
        >
          {l.label} <span className="count">{l.count}</span>
        </a>
      ))}
    </div>
  );
}

/**
 * A hub: the page for a city, an area of it, or one format in a city. It opens with a dated fact
 * worked out from the listings, then shows the same cards and map as the search results.
 */
export async function HubPage({ hub, page }: { hub: Hub | null; page: number }) {
  if (!hub) notFound();
  const data = await hubData(hub, page);
  if (!data) notFound();
  const lists = await readLists();
  const plan = planText(summarise(await listingsFor(lists.saved)));
  const now = Date.now();
  const here = hubPath(hub, page);
  const city = cityDef(hub.city)?.label ?? hub.city;
  const cityHub: Hub = { kind: "city", city: hub.city };
  const formatLabel =
    hub.kind === "format"
      ? hub.format === "led-screen"
        ? "LED screens"
        : (formatDef(hub.format)?.plural ?? "")
      : "";
  const leaf =
    hub.kind === "locality"
      ? (data.localityLabel ?? hub.locality)
      : hub.kind === "format"
        ? formatLabel
        : null;
  const searchUrl = toUrl({
    ...DEFAULT_STATE,
    city: hub.city,
    localities: hub.kind === "locality" ? [hub.locality] : [],
    formats: hub.kind === "format" ? [hub.format] : [],
  });
  const areaBase = toUrl({ ...DEFAULT_STATE, formats: hub.kind === "format" ? [hub.format] : [] });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "OOHWORKS", item: absolute("/") },
        { "@type": "ListItem", position: 2, name: city, item: absolute(hubPath(cityHub)) },
        ...(leaf
          ? [{ "@type": "ListItem", position: 3, name: leaf, item: absolute(hubPath(hub)) }]
          : []),
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: data.title,
      numberOfItems: data.total,
      itemListElement: data.cards.map((c, i) => ({
        "@type": "ListItem",
        position: (page - 1) * 12 + i + 1,
        name: c.site.title,
        url: absolute(c.listing.url),
      })),
    },
  ];

  return (
    <Shell active="find">
      {data.preview ? null : <JsonLd data={jsonLd} />}
      <BasketEnhance />
      <ListSync />
      <QuickView />
      <Container className="pt-6 pb-14">
        <nav aria-label="Breadcrumb" className="t-small text-ink-muted" data-section="breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <a href="/search/" className="oh-link">
                Find sites
              </a>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              {leaf ? (
                <a href={hubPath(cityHub)} className="oh-link">
                  {city}
                </a>
              ) : (
                <span aria-current="page">{city}</span>
              )}
            </li>
            {leaf ? (
              <>
                <li aria-hidden="true">›</li>
                <li>
                  <span aria-current="page">{leaf}</span>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        {data.preview ? (
          <Note section="hub-preview" className="mt-4">
            Preview, for this machine only. This page needs {data.status.needed} indexable sites to
            be published and has {data.status.indexable}, so on the live site this address answers
            &ldquo;not found&rdquo;.
            {data.anySample ? " The listings below are samples, not real sites." : ""}
          </Note>
        ) : null}

        <h1 className="t-display-lg mt-4" data-section="hub-title">
          {data.title}
        </h1>
        <p className="t-body-lg text-ink mt-4 max-w-[68ch]" data-section="hub-fact">
          {data.fact}
        </p>

        <div className="mt-6 space-y-3">
          <Chips title="By format" links={data.formats} />
          <Chips title="By area" links={data.areas} />
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-8 pb-4">
          <h2 className="t-display-sm" data-section="heading">
            {data.pages > 1
              ? `Sites ${(page - 1) * 12 + 1} to ${(page - 1) * 12 + data.cards.length} of ${data.total}`
              : data.total === 1
                ? "The one site listed"
                : `All ${data.total} sites`}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <a
              href={searchUrl}
              className="oh-link t-body"
              rel="nofollow"
              data-action="filter-these"
            >
              Filter and sort these sites
            </a>
            <a href="/how-results-are-ordered/" className="oh-link t-body">
              How results are ordered
            </a>
          </div>
        </div>

        <div
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
          data-section="results"
          data-layout="map"
        >
          <div className="min-w-0">
            <div className="grid gap-5 sm:grid-cols-2">
              {data.cards.map((card) => (
                <SiteCard
                  key={card.site.id}
                  card={card}
                  now={now}
                  lists={lists}
                  back={here}
                  level={3}
                />
              ))}
            </div>
            {data.pages > 1 ? (
              <nav
                aria-label="Pages"
                className="border-hairline mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
                data-section="pager"
              >
                <span className="t-data text-ink-muted">
                  Page {page} of {data.pages}
                </span>
                <div className="flex flex-wrap gap-2">
                  {page > 1 ? (
                    <a href={hubPath(hub, page - 1)} rel="prev" className="oh-btn secondary sm">
                      Previous
                    </a>
                  ) : null}
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) =>
                    n === page ? (
                      <span key={n} aria-current="page" className="oh-btn primary sm">
                        {n}
                      </span>
                    ) : (
                      <a key={n} href={hubPath(hub, n)} className="oh-btn secondary sm">
                        {n}
                      </a>
                    ),
                  )}
                  {page < data.pages ? (
                    <a href={hubPath(hub, page + 1)} rel="next" className="oh-btn secondary sm">
                      Next
                    </a>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </div>
          <aside
            id="map"
            aria-label="Map of these sites"
            className="border-hairline bg-paper-sunken order-first h-[200px] scroll-mt-24 overflow-hidden rounded-md border sm:h-[300px] lg:sticky lg:top-24 lg:order-none lg:h-[640px]"
            data-section="map"
          >
            <MapPanel points={data.points} styleUrl={MAP_STYLE} areaBase={areaBase} remember>
              <StillMap
                points={data.points}
                label={`Where the ${data.total} sites sit relative to each other. Open the live map for streets.`}
              />
            </MapPanel>
          </aside>
        </div>
      </Container>
      <div className="sticky bottom-0 z-20">
        <PlanBar text={plan} saved={lists.saved.length} compare={lists.compare.length} />
      </div>
    </Shell>
  );
}
