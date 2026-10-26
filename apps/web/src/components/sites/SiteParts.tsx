import type { ReactNode } from "react";
import {
  Button,
  Badge,
  Icon,
  NEUTRALITY_LINE,
  type IconName,
  Chip,
  Avatar,
  Numeral,
} from "@ohworks/ui";
import { formatDate } from "@/lib/editorial/format";
import { picture } from "@/lib/editorial/media";
import type { MonthView } from "@/lib/sites/calendar";
import type { Card } from "@/lib/sites/queries";
import { cityDef, ENVIRONMENTS, formatDef, lightingDef } from "@/lib/sites/taxonomy";
import {
  coords,
  facingText,
  formatLabel,
  lakh,
  monthYear,
  permitState,
  priceOf,
  sizeFeet,
  sizeFull,
  type Availability,
} from "@/lib/sites/view";
import type { Owner, Site } from "@/payload-types";
import { AvailabilityChip } from "./SiteCard";

const KIND = { approach: "Approach view", day: "Day, close", night: "Night" } as const;
const GAP = "Not provided yet";

/** 16:9, approach view first, every photograph dated. A missing photograph says so. */
export function Gallery({ site }: { site: Site }) {
  const shots = (site.photos ?? []).flatMap((p) => {
    const pic = picture(typeof p.image === "object" ? p.image : null, "hero");
    return pic ? [{ pic, kind: p.kind, takenOn: p.takenOn, gps: Boolean(p.gps) }] : [];
  });
  if (shots.length === 0) {
    const icon = (formatDef(site.format)?.icon ?? "hoarding") as IconName;
    return (
      <div
        className="border-hairline bg-paper-sunken text-ink-muted flex aspect-video flex-col items-center justify-center gap-2 rounded-md border px-6 text-center"
        data-section="gallery"
        data-photos="0"
      >
        <Icon name={icon} size={24} />
        <p className="t-body-strong text-ink">No photo yet</p>
        <p className="t-small max-w-[420px]">
          {site.sample
            ? "Sample listings carry no photographs. A real listing shows the approach, day and night views, each with its date."
            : "The owner has not added photographs. Ask them for the approach, day and night views."}
        </p>
      </div>
    );
  }
  return (
    <div data-section="gallery" data-photos={shots.length}>
      <div
        className="border-hairline bg-paper-sunken flex snap-x snap-mandatory overflow-x-auto rounded-md border"
        tabIndex={shots.length > 1 ? 0 : undefined}
        role={shots.length > 1 ? "group" : undefined}
        aria-label={shots.length > 1 ? "Photographs of this site" : undefined}
      >
        {shots.map((s, i) => (
          <figure
            key={s.pic.src}
            id={`photo-${i + 1}`}
            className="relative m-0 w-full shrink-0 snap-center scroll-mt-28"
          >
            <img
              src={s.pic.src}
              srcSet={s.pic.srcSet}
              sizes="(min-width: 1024px) 760px, 100vw"
              alt={s.pic.alt || `${KIND[s.kind]} of this site`}
              width={s.pic.width}
              height={s.pic.height}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className="aspect-video w-full object-cover"
            />
            <figcaption className="t-data-sm bg-paper-raised text-ink absolute bottom-3 left-3 rounded-xs px-2 py-1">
              {KIND[s.kind]} · {formatDate(s.takenOn)}
              {s.gps ? " · GPS-stamped" : ""}
            </figcaption>
            {shots.length > 1 ? (
              <span className="t-data-sm bg-paper-raised text-ink absolute top-3 right-3 rounded-xs px-2 py-1">
                {i + 1} of {shots.length}
              </span>
            ) : null}
          </figure>
        ))}
      </div>
      {shots.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {shots.map((s, i) => (
            <Chip key={s.pic.src} href={`#photo-${i + 1}`}>
              {KIND[s.kind]}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-paper-raised px-4 py-3">
      <dt className="t-label text-ink-muted">{label}</dt>
      <dd className="t-data text-ink mt-1 font-medium tabular-nums">{children}</dd>
    </div>
  );
}

/** The five things a buyer checks first. */
export function KeyFacts({ site, availability }: { site: Site; availability: Availability }) {
  const price = priceOf(site);
  return (
    <dl
      className="border-hairline bg-hairline grid grid-cols-2 gap-px overflow-hidden rounded-md border sm:grid-cols-3"
      data-section="keyfacts"
    >
      <Fact label="Size">{sizeFeet(site)}</Fact>
      <Fact label="Lighting">{lightingDef(site.lighting)?.label ?? GAP}</Fact>
      <Fact label="Facing">{facingText(site.facingDeg) ?? GAP}</Fact>
      <Fact label="Price">
        {price.shown ? `${price.prefix}${price.amount} / month` : "On request"}
      </Fact>
      <div className="bg-paper-raised col-span-2 px-4 py-3">
        <dt className="t-label text-ink-muted">Availability</dt>
        <dd className="mt-1">
          <AvailabilityChip availability={availability} />
        </dd>
      </div>
    </dl>
  );
}

export function Spec({
  label,
  value,
  source,
}: {
  label: string;
  value: string | null | undefined;
  source?: string | null | undefined;
}) {
  return (
    <div>
      <dt>{label}</dt>
      {value ? (
        <dd>
          {value}
          {source ? <span className="src">{source}</span> : null}
        </dd>
      ) : (
        <dd className="gap">
          {GAP}
          <span className="src">Ask the owner</span>
        </dd>
      )}
    </div>
  );
}

/** The system's fixed order. No value appears without its source; a missing one says so. */
export function SpecSheet({ site, now }: { site: Site; now: number }) {
  const isDigital = site.format === "led-screen" || site.lighting === "digital";
  const light = lightingDef(site.lighting)?.label;
  const permit = permitState(site, now);
  const audience =
    site.audience?.figure && site.audience.source && site.audience.measuredOn
      ? site.audience
      : null;
  const environment = ENVIRONMENTS.find((e) => e.slug === site.environment)?.label;
  const d = site.digital;
  return (
    <dl className="oh-spec" data-section="specs">
      <Spec
        label="Format"
        value={`${formatLabel(site.format)}, ${isDigital ? "digital" : "static"}`}
        source={environment}
      />
      <Spec label="Size" value={sizeFull(site)} />
      <Spec
        label="Lighting"
        value={light ? `${light}${site.litHours ? `, ${site.litHours}` : ""}` : null}
      />
      <Spec
        label="Facing"
        value={facingText(site.facingDeg)}
        source={site.trafficDirection ? `${site.trafficDirection} traffic` : null}
      />
      <Spec
        label="Coordinates"
        value={coords(site.lat, site.lng)}
        source={
          site.verifiedLocation
            ? `verified${site.lastVerifiedOn ? ` ${formatDate(site.lastVerifiedOn)}` : ""}`
            : "owner-supplied, not yet verified"
        }
      />
      <Spec
        label="Height above road"
        value={site.heightAboveRoadM ? `${site.heightAboveRoadM} m` : null}
      />
      <Spec
        label="Audience"
        value={audience?.figure ? `${lakh(audience.figure)} a week` : null}
        source={audience ? `${audience.source}, ${monthYear(audience.measuredOn)}` : null}
      />
      <Spec
        label="Permit"
        value={permit === "none" ? null : site.permit?.number}
        source={
          [
            site.permit?.authority,
            site.permit?.expiresOn
              ? `${permit === "expired" ? "expired" : "valid to"} ${monthYear(site.permit.expiresOn)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || null
        }
      />
      <Spec label="Unit ID" value={site.permanentId} source="never changes" />
      <Spec
        label="Last verified"
        value={site.lastVerifiedOn ? formatDate(site.lastVerifiedOn) : null}
      />
      {isDigital ? (
        <>
          <Spec label="Resolution" value={d?.resolution} />
          <Spec label="Spot length" value={d?.spotSeconds ? `${d.spotSeconds} s` : null} />
          <Spec label="Loop length" value={d?.loopSeconds ? `${d.loopSeconds} s` : null} />
          <Spec
            label="Advertisers in the loop"
            value={d?.advertisers ? String(d.advertisers) : null}
          />
          <Spec label="Programmatic via" value={d?.exchanges} />
        </>
      ) : null}
    </dl>
  );
}

/** The owner's price in the mode the owner chose, with its terms and the one buyer action. */
export function PriceBlock({
  site,
  owner,
  availability,
}: {
  site: Site;
  owner: Owner | null;
  availability: Availability;
}) {
  const price = priceOf(site);
  const terms = [
    site.minPeriod ? `${site.minPeriod} minimum` : null,
    site.productionCost ? `Printing and mounting: ${site.productionCost}` : null,
    price.shown ? site.taxesNote : null,
  ].filter(Boolean);
  return (
    <section
      className="oh-box"
      aria-label="Price"
      data-section="price"
      data-price={price.shown ? site.priceDisplay : "request"}
    >
      {price.shown ? (
        <p className="oh-amount">
          {price.prefix}
          {price.amount} <small>/ month</small>
        </p>
      ) : (
        <p className="oh-amount">Price on request</p>
      )}
      <p className="t-small text-ink-muted mt-1">
        {!price.shown
          ? "Ask the owner; most reply within a day."
          : site.priceDisplay === "from"
            ? "The rate depends on dates and length. Ask for an exact figure."
            : `Owner rate · listing updated ${formatDate(site.updatedAt)}`}
      </p>
      {terms.length ? (
        <ul className="t-body text-ink mt-3 space-y-1">
          {terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
      <div className="border-hairline mt-4 border-t pt-4">
        <AvailabilityChip availability={availability} />
        {availability.note ? (
          <p className="t-small text-ink-muted mt-2">{availability.note}</p>
        ) : null}
      </div>
      <Button
        variant="accent"
        size="lg"
        className="mt-4 hidden w-full lg:inline-flex"
        href={`/enquire/${site.permanentId}/`}
        rel="nofollow"

        data-action="enquire"
      >
        {price.shown ? "Send enquiry" : "Ask for a quote"}
      </Button>
      <p className="t-small text-ink-muted mt-4">
        {owner ? `Goes straight to ${owner.name}. ` : ""}
        {NEUTRALITY_LINE}
      </p>
    </section>
  );
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** One month of the owner's calendar. Booked days are struck through, so colour is never the only sign. */
export function Calendar({
  site,
  month,
  availability,
  base,
}: {
  site: Site;
  month: MonthView;
  availability: Availability;
  base: string;
}) {
  const known = Boolean(site.availabilityConfirmedOn) || availability.state === "booked";
  const booked = month.days.filter((d) => d.state === "booked").length;
  const free = month.days.filter((d) => d.state === "free").length;
  return (
    <section
      id="availability"
      className="scroll-mt-28"
      data-section="calendar"
      data-month={month.key}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="t-display-sm">Availability</h2>
        {site.availabilityConfirmedOn ? (
          <p className="t-small text-ink-muted">
            Confirmed by the owner on {formatDate(site.availabilityConfirmedOn)}
          </p>
        ) : null}
      </div>
      {known ? (
        <div className="oh-box mt-4 grid gap-6 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              {month.prev ? (
                <Button
                  variant="ghost"
                  size="sm"
                  href={`${base}?m=${month.prev}#availability`}
                  rel="nofollow"
                >
                  Earlier
                </Button>
              ) : (
                <span className="oh-btn ghost sm invisible" aria-hidden="true">
                  Earlier
                </span>
              )}
              <p className="t-body-strong">{month.label}</p>
              {month.next ? (
                <Button
                  variant="ghost"
                  size="sm"
                  href={`${base}?m=${month.next}#availability`}
                  rel="nofollow"
                >
                  Later
                </Button>
              ) : (
                <span className="oh-btn ghost sm invisible" aria-hidden="true">
                  Later
                </span>
              )}
            </div>
            <p className="sr-only">
              {month.label}: {booked} {booked === 1 ? "day" : "days"} booked, {free} free.
            </p>
            <div className="oh-cal" aria-hidden="true">
              {WEEK.map((d, i) => (
                <span key={`${d}${i}`} className="h">
                  {d}
                </span>
              ))}
              {Array.from({ length: month.blanks }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {month.days.map((d) => (
                <span key={d.iso} className={`d ${d.state === "free" ? "" : d.state}`}>
                  {d.n}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <AvailabilityChip availability={availability} />
            </div>
            {availability.note ? <p className="t-body text-ink">{availability.note}</p> : null}
            <p className="oh-legend">
              <span>
                <i className="bg-verified-tint" />
                Free
              </span>
              <span>
                <i className="bg-paper-sunken" />
                Booked
              </span>
            </p>
            <p className="t-small text-ink-muted">
              This is the owner&rsquo;s calendar. The owner confirms your dates when they reply.
            </p>
          </div>
        </div>
      ) : (
        <p className="oh-box t-body text-ink mt-3 max-w-[60ch]">
          The owner has not confirmed availability yet, so no calendar is shown. Ask them about your
          dates.
        </p>
      )}
    </section>
  );
}

/** The seller, by name. Contact details appear only when a buyer asks to see them. */
export function OwnerCard({ owner, siteCount }: { owner: Owner; siteCount: number }) {
  const city = cityDef(owner.city ?? undefined)?.label;
  return (
    <section className="oh-box" aria-label="The owner" data-section="owner">
      <p className="t-label text-ink-muted">Owner and seller</p>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={owner.name} />
        <div className="min-w-0">
          <h2 className="t-title">{owner.name}</h2>
          <p className="t-small text-ink-muted">
            {[city, `${siteCount} ${siteCount === 1 ? "site" : "sites"} on OOHWORKS`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {owner.verified ? (
          <Badge kind="verified">Verified owner</Badge>
        ) : (
          <Badge kind="neutral">Owner not yet verified</Badge>
        )}
        {owner.medianReplyHours != null && owner.medianReplyHours < 24 ? (
          <Badge kind="responsive">Replies in under a day</Badge>
        ) : null}
        {owner.sample ? <Badge kind="neutral">Sample owner</Badge> : null}
      </div>
      {owner.verified && owner.verifiedOn ? (
        <p className="t-small text-ink-muted mt-2">
          Company documents and contact details checked on {formatDate(owner.verifiedOn)}.
        </p>
      ) : null}
      {owner.about ? <p className="t-body text-ink mt-3">{owner.about}</p> : null}
      <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-2">
        {owner.phone ? (
          <details data-section="owner-phone">
            <summary className="oh-btn secondary sm cursor-pointer list-none">Show phone</summary>
            <p className="t-data text-ink mt-2 select-all">{owner.phone}</p>
          </details>
        ) : null}
        {owner.slug ? (
          <a
            href={`/search/?owner=${owner.slug}`}
            rel="nofollow"
            className="oh-link t-body inline-flex min-h-11 items-center"
          >
            See all their sites
          </a>
        ) : null}
      </div>
    </section>
  );
}

/** What an enquiry sets in motion, in three plain steps. */
export function EnquirySteps({ ownerName }: { ownerName: string }) {
  const steps = [
    {
      t: "It goes straight to the owner",
      d: `${ownerName} gets your dates, category and budget. Nobody sits in between.`,
    },
    { t: "They reply to you", d: "The owner answers by email, to the address you confirm." },
    {
      t: "You deal directly",
      d: "Contract, invoice and payment stay between you and them. OOHWORKS charges nothing.",
    },
  ];
  return (
    <ol className="grid gap-4 sm:grid-cols-3" data-section="steps">
      {steps.map((s, i) => (
        <li key={s.t} className="oh-box">
          <Numeral n={i + 1} />
          <h3 className="t-title mt-1">{s.t}</h3>
          <p className="t-small text-ink-muted mt-1">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

/** What a card or sheet shows in place of a photograph the owner has not added. */
export function NoPhoto({ icon }: { icon: IconName }) {
  return (
    <span className="flex flex-col items-center gap-2">
      <Icon name={icon} size={24} />
      <span className="t-small">No photo yet</span>
    </span>
  );
}

/** A small 3:2 picture of a site for lists and tables. No photograph is said, never faked. */
export function Thumb({ card, className = "" }: { card: Card; className?: string }) {
  const pic = picture(card.photo, "thumb");
  const icon = (formatDef(card.site.format)?.icon ?? "hoarding") as IconName;
  return (
    <span
      className={`border-hairline bg-paper-sunken text-ink-muted grid aspect-[3/2] place-items-center overflow-hidden rounded-sm border ${className}`}
    >
      {pic ? (
        <img
          src={pic.src}
          alt=""
          width={pic.width}
          height={pic.height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon name={icon} size={24} />
      )}
    </span>
  );
}
