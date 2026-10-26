import { Button, Badge, NEUTRALITY_LINE, Avatar } from "@ohworks/ui";
import { formatDate } from "@/lib/editorial/format";
import type { Lists } from "@/lib/sites/lists-server";
import type { SitePage } from "@/lib/sites/queries";
import { lightingDef } from "@/lib/sites/taxonomy";
import {
  availabilityOf,
  badgesOf,
  facingText,
  lakh,
  monthYear,
  placeLine,
  priceOf,
  siteUrl,
  sizeFull,
} from "@/lib/sites/view";
import { ListToggle } from "./ListToggle";
import { AvailabilityChip } from "./SiteCard";
import { Gallery } from "./SiteParts";

function Fact({
  label,
  value,
  source,
}: {
  label: string;
  value: string | null;
  source?: string | null;
}) {
  return (
    <div className="border-hairline flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0">
      <dt className="t-label text-ink-muted shrink-0">{label}</dt>
      <dd className="t-data text-right">
        {value ?? <span className="text-ink-muted font-sans">Not provided yet</span>}
        {source ? (
          <span className="text-ink-muted block font-sans text-[12px] leading-4">{source}</span>
        ) : null}
      </dd>
    </div>
  );
}

/** The main facts of one site, for the quick view panel: enough to keep or drop it without leaving the list. */
export function QuickBody({ found, now, lists }: { found: SitePage; now: number; lists: Lists }) {
  const { site, owner, ownerSiteCount } = found;
  const id = site.permanentId ?? "";
  const title = site.title ?? "This site";
  const url = siteUrl(site);
  const price = priceOf(site);
  const availability = availabilityOf(site, now);
  const badges = badgesOf(site, owner, now);
  const light = lightingDef(site.lighting)?.label ?? null;
  const facing = facingText(site.facingDeg);
  const audience =
    site.audience?.figure && site.audience.source && site.audience.measuredOn
      ? site.audience
      : null;
  const terms = [
    price.shown ? (site.priceDisplay === "from" ? "“From” price" : "Owner rate") : null,
    site.minPeriod ? `${site.minPeriod} minimum` : null,
    site.availabilityConfirmedOn
      ? `availability confirmed ${formatDate(site.availabilityConfirmedOn)}`
      : null,
  ].filter(Boolean);
  const ownerFacts = owner
    ? [
        owner.verified ? "Verified owner" : "Not yet verified",
        owner.medianReplyHours != null && owner.medianReplyHours < 24
          ? "replies in under a day"
          : null,
        `${ownerSiteCount} ${ownerSiteCount === 1 ? "site" : "sites"}`,
      ].filter(Boolean)
    : [];
  return (
    <>
      <Gallery site={site} />
      <div>
        <h3 className="text-[18px] leading-6 font-semibold">{title}</h3>
        <p className="t-small text-ink-muted mt-1">
          {site.road}, {placeLine(site)}
          {site.landmark ? ` · ${site.landmark}` : ""}
        </p>
        {badges.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((b) => (
              <Badge key={b.kind + b.text} kind={b.kind}>
                {b.text}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <dl>
        <Fact label="Size" value={sizeFull(site)} />
        <Fact
          label="Lighting"
          value={light ? `${light}${site.litHours ? `, ${site.litHours}` : ""}` : null}
        />
        <Fact
          label="Facing"
          value={
            facing
              ? `${facing}${site.trafficDirection ? `, ${site.trafficDirection} traffic` : ""}`
              : null
          }
        />
        <Fact
          label="Audience"
          value={audience?.figure ? `${lakh(audience.figure)} a week` : null}
          source={audience ? `${audience.source}, ${monthYear(audience.measuredOn)}` : null}
        />
      </dl>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="oh-amount" data-quick-price="">
            {price.shown ? (
              <>
                {price.prefix}
                {price.amount} <small>/ month</small>
              </>
            ) : (
              "Price on request"
            )}
          </p>
          <AvailabilityChip availability={availability} />
        </div>
        {terms.length ? <p className="t-small text-ink-muted mt-1">{terms.join(" · ")}</p> : null}
      </div>
      {owner ? (
        <div className="border-hairline flex items-center gap-3 border-t pt-4">
          <Avatar name={owner.name} />
          <div className="min-w-0">
            <p className="t-body-strong">{owner.name}</p>
            <p className="t-small text-ink-muted">{ownerFacts.join(" · ")}</p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <ListToggle list="saved" id={id} title={title} on={lists.saved.includes(id)} back={url} />
        <ListToggle
          list="compare"
          id={id}
          title={title}
          on={lists.compare.includes(id)}
          back={url}
        />
        <Button variant="secondary" size="sm" href={url}>
          Open full page
        </Button>
      </div>
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        href={`/enquire/${id}/`}
        rel="nofollow"

        data-action="enquire"
      >
        {price.shown ? "Send enquiry" : "Ask for a quote"}
      </Button>
      <p className="t-small text-ink-muted">
        {owner ? `Goes straight to ${owner.name}. ` : ""}
        {NEUTRALITY_LINE}
      </p>
    </>
  );
}
