import { Badge, Icon, type IconName } from "@ohworks/ui";
import { formatDate } from "@/lib/editorial/format";
import { picture } from "@/lib/editorial/media";
import type { Lists } from "@/lib/sites/lists-server";
import type { Card } from "@/lib/sites/queries";
import { formatDef } from "@/lib/sites/taxonomy";
import { availabilityOf, badgesOf, metaLine, priceOf, type Availability } from "@/lib/sites/view";
import { ListToggle } from "./ListToggle";

const AVAIL_CLASS: Record<Availability["state"], string> = {
  free: "oh-badge verified",
  booked: "oh-badge booked",
  stale: "oh-badge fresh",
};

export function AvailabilityChip({ availability }: { availability: Availability }) {
  return (
    <span className={AVAIL_CLASS[availability.state]} data-availability={availability.state}>
      {availability.label}
    </span>
  );
}

/**
 * One card per physical face: what it is, where, what it looks like, what it costs, whether it is free,
 * and who sells it. A missing photo says so; it is never a blank box or a stock image.
 */
export function SiteCard({
  card,
  now,
  lists,
  back,
  level = 2,
  distance,
}: {
  card: Card;
  now: number;
  /** What this buyer has saved and ticked for comparing, so each card shows its own state. */
  lists: Lists;
  /** The page the card is on: where a browser without script returns after saving. */
  back: string;
  level?: 2 | 3;
  distance?: string;
}) {
  const { site, owner, photo, listing } = card;
  const pic = picture(photo, "card");
  const price = priceOf(site);
  const availability = availabilityOf(site, now);
  const badges = badgesOf(site, owner, now);
  const first = site.photos?.[0];
  const count = site.photos?.length ?? 0;
  const icon = (formatDef(site.format)?.icon ?? "hoarding") as IconName;
  const H = level === 2 ? "h2" : "h3";
  const id = site.permanentId ?? "";
  const title = site.title ?? "this site";
  return (
    <article className="oh-card flex flex-col" data-site={site.permanentId}>
      <div className="relative">
        <div className="absolute top-2 right-2 z-[1]">
          <ListToggle
            list="saved"
            id={id}
            title={title}
            on={lists.saved.includes(id)}
            back={back}
          />
        </div>
        <a href={listing.url} className="photo" tabIndex={-1} aria-hidden="true">
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
            <span className="flex flex-col items-center gap-2">
              <Icon name={icon} size={24} />
              <span className="t-small">No photo yet</span>
            </span>
          )}
          {pic && first ? (
            <span className="t-data-sm bg-paper-raised text-ink absolute bottom-2 left-2 rounded-xs px-1.5 py-0.5">
              Approach view · {formatDate(first.takenOn)}
            </span>
          ) : null}
          {count > 1 ? (
            <span className="t-data-sm bg-paper-raised text-ink absolute right-2 bottom-2 rounded-xs px-1.5 py-0.5">
              {count} photos
            </span>
          ) : null}
        </a>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <H className="t-title">
          <a href={listing.url} className="oh-rowlink">
            {site.title}
          </a>
        </H>
        <p className="t-small text-ink-muted">
          {distance ? `${distance} · ${metaLine(site)}` : metaLine(site)}
        </p>
        {badges.length ? (
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <Badge key={b.kind + b.text} kind={b.kind}>
                {b.text}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <p
            className="t-price"
            style={{ fontVariantNumeric: "tabular-nums" }}
            data-price={price.shown ? "shown" : "request"}
          >
            {price.shown ? (
              <>
                {price.prefix}
                {price.amount}{" "}
                <span className="t-small text-ink-muted font-sans font-normal">/ month</span>
              </>
            ) : (
              <span className="text-[16px]">Price on request</span>
            )}
          </p>
          <AvailabilityChip availability={availability} />
        </div>
        <div className="border-hairline flex flex-col gap-2 border-t pt-3">
          <span className="t-small text-ink-muted min-w-0 truncate">{owner?.name ?? "Owner"}</span>
          <div className="flex flex-wrap items-center gap-1">
            <ListToggle
              list="compare"
              id={id}
              title={title}
              on={lists.compare.includes(id)}
              back={back}
              className="oh-btn ghost sm px-2"
            />
            <a className="oh-btn ghost sm px-2" href={listing.url} data-quick={id}>
              Quick view<span className="sr-only">: {title}</span>
            </a>
            <a
              className="oh-btn secondary sm ml-auto"
              href={`/enquire/${site.permanentId}/`}
              rel="nofollow"
            >
              Enquire
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
