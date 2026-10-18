import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { permanentIdFromSlug } from "@ohworks/core";
import { Badge, Button, Container } from "@ohworks/ui";
import { PageHead } from "@/components/owners/Frame";
import { Shell } from "@/components/Shell";
import { BasketEnhance } from "@/components/sites/Basket";
import { ListToggle } from "@/components/sites/ListToggle";
import { MapPanel } from "@/components/sites/MapPanel";
import { QuickView } from "@/components/sites/QuickView";
import { SiteCard } from "@/components/sites/SiteCard";
import {
  Calendar,
  EnquirySteps,
  Gallery,
  KeyFacts,
  OwnerCard,
  PriceBlock,
  Spec,
  SpecSheet,
} from "@/components/sites/SiteParts";
import { StillMap } from "@/components/sites/StillMap";
import type { Site } from "@/payload-types";
import { picture } from "@/lib/editorial/media";
import { absolute, alternates, JsonLd } from "@/lib/seo";
import { monthView } from "@/lib/sites/calendar";
import { readLists } from "@/lib/sites/lists-server";
import { getSite, hubLinksFor, similarSites } from "@/lib/sites/queries";
import { ReportListing } from "@/components/sites/ReportListing";
import { cityDef, lightingDef } from "@/lib/sites/taxonomy";
import {
  availabilityOf,
  badgesOf,
  coords,
  facingText,
  isIndexable,
  lakh,
  monthYear,
  placeLine,
  priceOf,
  siteUrl as sitePath,
  summaryOf,
} from "@/lib/sites/view";

export const dynamic = "force-dynamic";

const MAP_STYLE = process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

interface Params {
  country: string;
  city: string;
  locality: string;
  unit: string;
}

/**
 * The permanent id at the end of the address is what finds the site. A site that was taken down is still
 * found: its page says it is gone, with the middleware answering 410 (src/middleware.ts).
 */
async function load(params: Params) {
  const id = permanentIdFromSlug(params.unit);
  if (!id) return null;
  return getSite(id);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const found = await load(await params);
  if (!found) return {};
  const { site, owner } = found;
  if (site.removed)
    return {
      title: `No longer listed: ${site.title}, ${placeLine(site)}`,
      robots: { index: false, follow: true },
    };
  const price = priceOf(site);
  return {
    title: `${site.title}, ${placeLine(site)}`,
    description: `${summaryOf(site, owner)} ${price.shown ? `${price.prefix}${price.amount} a month.` : "Price on request."}`,
    robots: isIndexable(site, owner)
      ? { index: true, follow: true }
      : { index: false, follow: true },
    alternates: alternates(sitePath(site)),
  };
}

function away(km: number): string {
  return km < 1
    ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m away`
    : `${km.toFixed(1)} km away`;
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ m?: string | string[]; reported?: string; report?: string }>;
}) {
  const p = await params;
  const found = await load(p);
  if (!found) notFound();
  const { site, owner, ownerSiteCount } = found;

  // The permanent id wins: if any other part of the address drifted, send the visitor to the true one.
  const canonical = sitePath(site);
  if (`/${p.country}/${p.city}/${p.locality}/${p.unit}/` !== canonical)
    permanentRedirect(canonical);

  const now = Date.now();
  if (site.removed) return <Gone site={site} now={now} />;
  const asked = await searchParams;
  const m = asked.m;
  const month = monthView(Array.isArray(m) ? m[0] : m, site.bookedUntil, now);
  const availability = availabilityOf(site, now);
  const badges = badgesOf(site, owner, now);
  const price = priceOf(site);
  const similar = await similarSites(site, 3);
  const lists = await readLists();
  const hubs = await hubLinksFor(site);
  const unitId = site.permanentId ?? "";
  const city = cityDef(site.city)?.label ?? site.city;
  const point = {
    id: site.permanentId ?? "site",
    lat: site.lat,
    lng: site.lng,
    title: site.title ?? "This site",
    url: canonical,
    price: price.shown ? price.amount : null,
  };
  const audience =
    site.audience?.figure && site.audience.source && site.audience.measuredOn
      ? site.audience
      : null;
  const isDigital = site.format === "led-screen" || site.lighting === "digital";
  const action = price.shown ? "Send enquiry" : "Ask for a quote";

  const images = (site.photos ?? []).flatMap((ph) => {
    const pic = picture(typeof ph.image === "object" ? ph.image : null, "hero");
    return pic ? [absolute(pic.src)] : [];
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: site.title,
    sku: site.permanentId,
    url: absolute(canonical),
    category: "Out-of-home advertising space",
    description: summaryOf(site, owner),
    ...(images.length ? { image: images } : {}),
    additionalProperty: [
      { "@type": "PropertyValue", name: "format", value: site.format },
      { "@type": "PropertyValue", name: "width_mm", value: site.widthMm },
      { "@type": "PropertyValue", name: "height_mm", value: site.heightMm },
      { "@type": "PropertyValue", name: "illumination", value: lightingDef(site.lighting)?.label },
      ...(site.facingDeg != null
        ? [{ "@type": "PropertyValue", name: "facing_deg", value: site.facingDeg }]
        : []),
      { "@type": "PropertyValue", name: "latitude", value: Number(site.lat.toFixed(5)) },
      { "@type": "PropertyValue", name: "longitude", value: Number(site.lng.toFixed(5)) },
    ],
    // A price is marked up only when the page shows one.
    ...(price.shown && site.rate
      ? {
          offers: {
            "@type": "Offer",
            businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            url: absolute(canonical),
            price: site.rate,
            priceCurrency: "INR",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceCurrency: "INR",
              unitCode: "MON",
              ...(site.priceDisplay === "from" ? { minPrice: site.rate } : { price: site.rate }),
            },
            ...(owner ? { seller: { "@type": "Organization", name: owner.name } } : {}),
          },
        }
      : {}),
  };

  return (
    <Shell active="find">
      {site.sample ? null : <JsonLd data={jsonLd} />}
      <BasketEnhance />
      <QuickView />
      <Container className="pt-6 pb-12 lg:pb-16">
        <nav aria-label="Breadcrumb" className="t-small text-ink-muted" data-section="breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <a href="/search/" className="oh-link">
                Find sites
              </a>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <a
                href={hubs.city ?? `/search/?city=${site.city}`}
                {...(hubs.city ? {} : { rel: "nofollow" })}
                className="oh-link"
                data-crumb="city"
              >
                {city}
              </a>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <a
                href={hubs.locality ?? `/search/?city=${site.city}&locality=${site.localitySlug}`}
                {...(hubs.locality ? {} : { rel: "nofollow" })}
                className="oh-link"
                data-crumb="locality"
              >
                {site.locality}
              </a>
            </li>
          </ol>
        </nav>

        {site.sample ? (
          <p
            className="t-small border-hairline bg-lit-tint text-ink mt-4 rounded-sm border px-3 py-2"
            data-section="sample-notice"
          >
            This is a sample listing for development. It is not a real site, and it is never shown
            to search engines.
          </p>
        ) : null}

        <h1 className="t-display-md mt-4" data-section="title">
          {site.title}
        </h1>
        <p className="t-body text-ink-muted mt-1">
          {site.road}, {placeLine(site)}
          {site.landmark ? ` · ${site.landmark}` : ""}
        </p>
        {badges.length ? (
          <div className="mt-3 flex flex-wrap gap-1" data-section="badges">
            {badges.map((b) => (
              <Badge key={b.kind + b.text} kind={b.kind}>
                {b.text}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="min-w-0 space-y-5 lg:col-start-1">
            <Gallery site={site} />
            <KeyFacts site={site} availability={availability} />
            <p className="t-body-lg text-ink max-w-[68ch]" data-section="summary">
              {summaryOf(site, owner)}
            </p>
          </div>

          <aside
            className="space-y-5 self-start lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
            data-section="aside"
          >
            <PriceBlock site={site} owner={owner} availability={availability} />
            <div className="flex flex-wrap items-center gap-2" data-section="keep">
              <ListToggle
                list="saved"
                id={unitId}
                title={site.title ?? "this site"}
                on={lists.saved.includes(unitId)}
                back={canonical}
              />
              <ListToggle
                list="compare"
                id={unitId}
                title={site.title ?? "this site"}
                on={lists.compare.includes(unitId)}
                back={canonical}
              />
              <button type="button" className="oh-btn secondary sm" data-copy={canonical}>
                Copy link
              </button>
              <a
                href="/shortlist/"
                rel="nofollow"
                className="oh-link t-body ml-auto inline-flex min-h-11 items-center"
              >
                View shortlist
              </a>
            </div>
            {owner ? <OwnerCard owner={owner} siteCount={ownerSiteCount} /> : null}
          </aside>

          <div className="min-w-0 space-y-10 lg:col-start-1">
            <Calendar site={site} month={month} availability={availability} base={canonical} />

            <section data-section="specifications">
              <h2 className="t-display-sm">Specifications</h2>
              <div className="mt-4">
                <SpecSheet site={site} now={now} />
              </div>
              <p className="t-small text-ink-muted mt-2">
                No value appears without its source. A missing one says so, and you can ask the
                owner for it.
              </p>
            </section>

            <section data-section="location">
              <h2 className="t-display-sm">Location</h2>
              <p className="t-body text-ink-muted mt-1">
                {site.road}, {placeLine(site)}
                {site.landmark ? ` · ${site.landmark}` : ""}
              </p>
              <div className="border-hairline bg-paper-sunken mt-4 h-[280px] overflow-hidden rounded-md border sm:h-[380px]">
                <MapPanel points={[point]} styleUrl={MAP_STYLE} here>
                  <StillMap
                    points={[point]}
                    facing={site.facingDeg ?? null}
                    label={`The position of this site${site.facingDeg != null ? ` and the direction it faces, ${facingText(site.facingDeg)}` : ""}. Open the live map for streets.`}
                  />
                </MapPanel>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="t-data text-ink">{coords(site.lat, site.lng)}</span>
                {site.facingDeg != null ? (
                  <span className="t-data text-ink">Faces {facingText(site.facingDeg)}</span>
                ) : null}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${site.lat.toFixed(5)},${site.lng.toFixed(5)}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="oh-link t-body"
                >
                  Open in Google Maps
                </a>
              </div>
            </section>

            <section data-section="audience">
              <h2 className="t-display-sm">Who sees it</h2>
              {audience?.figure ? (
                <div className="border-hairline bg-paper-raised mt-3 rounded-md border p-5">
                  <p className="oh-amount">
                    {lakh(audience.figure)} <small>people a week</small>
                  </p>
                  <p className="t-small text-ink-muted mt-2">
                    {[
                      audience.metric ? `Metric: ${audience.metric}` : null,
                      `Source: ${audience.source}`,
                      audience.method ? `Method: ${audience.method}` : null,
                      monthYear(audience.measuredOn),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ) : (
                <p className="t-body border-hairline bg-paper-raised text-ink mt-3 max-w-[60ch] rounded-md border p-5">
                  Not provided yet. We show an audience figure only with a named source and a date.
                  Ask the owner.
                </p>
              )}
            </section>

            <section data-section="supply">
              <h2 className="t-display-sm">What you supply</h2>
              <dl className="oh-spec mt-4">
                <Spec label="Artwork size" value={site.artworkSpec} />
                <Spec label="File type" value={site.fileTypes} />
                <Spec
                  label="Lead time"
                  value={
                    site.leadTimeDays != null ? `${site.leadTimeDays} days before the start` : null
                  }
                />
                <Spec label="Printing and mounting" value={site.productionCost} />
                <Spec label="Minimum period" value={site.minPeriod} />
                <Spec label="Categories not accepted" value={site.notAccepted} />
                {isDigital && site.digital?.spotSeconds ? (
                  <Spec label="Spot length" value={`${site.digital.spotSeconds} s`} />
                ) : null}
              </dl>
            </section>

            <section data-section="how">
              <h2 className="t-display-sm">What happens when you enquire</h2>
              <div className="mt-4">
                <EnquirySteps ownerName={owner?.name ?? "The owner"} />
              </div>
            </section>
          </div>
        </div>

        {similar.length ? (
          <section id="similar" className="mt-14 scroll-mt-28" data-section="similar">
            <h2 className="t-display-sm">Similar sites nearby</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((card) => (
                <SiteCard
                  key={card.site.id}
                  card={card}
                  now={now}
                  lists={lists}
                  back={canonical}
                  level={3}
                  distance={away(card.km)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <ReportListing
          unitId={unitId}
          path={canonical}
          sent={asked.reported === "1"}
          problem={typeof asked.report === "string" ? asked.report : null}
        />
      </Container>

      <div
        className="border-hairline bg-paper-raised sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden"
        data-section="enquire-bar"
      >
        <div className="min-w-0">
          <p className="t-price truncate">
            {price.shown ? `${price.prefix}${price.amount} / month` : "Price on request"}
          </p>
          <p className="t-small text-ink-muted truncate">{availability.label}</p>
        </div>
        <a
          href={`/enquire/${site.permanentId}/`}
          rel="nofollow"
          className="oh-btn accent shrink-0"
          data-action="enquire"
        >
          {action}
        </a>
      </div>
    </Shell>
  );
}

/** A site that was taken down: what happened, where to look instead, and the sites nearby. */
async function Gone({ site, now }: { site: Site; now: number }) {
  const similar = await similarSites(site, 6);
  const lists = await readLists();
  const city = cityDef(site.city)?.label ?? site.city;
  return (
    <Shell active="find">
      <BasketEnhance />
      <QuickView />
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[560px] text-center" data-section="gone">
          <PageHead center eyebrow="Removed listing" title="This site is no longer listed">
            {site.title}, {placeLine(site)}, has been taken off OOHWORKS. Its owner may no longer
            sell it, or it was not as described. The sites below are nearby.
          </PageHead>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href={`/search/?city=${site.city}`} variant="primary">
              Find sites in {city}
            </Button>
            <Button href="/" variant="ghost">
              Go to the homepage
            </Button>
          </div>
        </div>
        {similar.length ? (
          <section className="mt-14" data-section="similar">
            <h2 className="t-display-sm">Similar sites nearby</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((card) => (
                <SiteCard
                  key={card.site.id}
                  card={card}
                  now={now}
                  lists={lists}
                  back={sitePath(site)}
                  level={3}
                  distance={away(card.km)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </Shell>
  );
}
