import { Badge, type BadgeKind } from "./Badge";
import { Icon, type IconName } from "../icons/Icon";

export interface ListingCardProps {
  href: string;
  title: string;
  meta: string;
  format: IconName;
  photo?: { src: string; alt: string; width: number; height: number; takenOn: string } | null;
  badges?: { kind: BadgeKind; text: string }[];
  /** Formatted price such as "₹ 85,000" or null for "Price on request". */
  price?: string | null;
  period?: string;
}

/** One card per physical face. Photo first because a site is something you can see. */
export function ListingCard({
  href,
  title,
  meta,
  format,
  photo,
  badges = [],
  price,
  period = "/ month",
}: ListingCardProps) {
  return (
    <article className="oh-card">
      <a href={href} className="block">
        <div className="photo">
          {photo ? (
            <img
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon name={format} size={24} />
          )}
          <span className="t-small absolute bottom-2 left-3">
            {photo ? `Approach view · ${photo.takenOn}` : "No photo yet"}
          </span>
        </div>
      </a>
      <div className="body">
        <h3 className="title">
          <a href={href} className="text-ink hover:text-navy-700">
            {title}
          </a>
        </h3>
        <div className="meta">{meta}</div>
        {badges.length ? (
          <div className="badges">
            {badges.map((b) => (
              <Badge key={b.kind + b.text} kind={b.kind}>
                {b.text}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="row">
          <div className="price">
            {price ?? "Price on request"} {price ? <small>{period}</small> : null}
          </div>
          <a className="oh-btn accent sm" href={`${href}#enquire`}>
            Enquire
          </a>
        </div>
      </div>
    </article>
  );
}
