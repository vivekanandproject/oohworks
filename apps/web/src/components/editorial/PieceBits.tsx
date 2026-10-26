import { Button, Chip } from "@ohworks/ui";
import { formatDate, readTime, timeAgo } from "@/lib/editorial/format";
import { picture } from "@/lib/editorial/media";
import { PILLARS, PILLAR_KEYS, type PillarKey } from "@/lib/editorial/pillars";
import type { Piece } from "@/lib/editorial/queries";

/** "Analysis · Bengaluru", or the pillar alone when the piece has no place. Reports show their period. */
export function eyebrow(piece: Piece): string {
  const label = PILLARS[piece.pillar].label;
  const detail = piece.period ?? piece.places[0]?.name;
  return detail ? `${label} · ${detail}` : label;
}

export function authorNames(piece: Piece): string {
  const names = piece.authors.map((a) => a.name);
  if (names.length <= 1) return names[0] ?? "OOHWORKS";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function Meta({ piece }: { piece: Piece }) {
  return (
    <p className="t-small text-ink-muted">
      {authorNames(piece)} ·{" "}
      <time dateTime={piece.publishedAt}>{formatDate(piece.publishedAt)}</time> ·{" "}
      {readTime(piece.readingTime)}
    </p>
  );
}

/** A row in a stream: an optional square photo, then pillar, headline, standfirst and byline. */
export function PieceRow({ piece, level = 3 }: { piece: Piece; level?: 2 | 3 }) {
  const pic = picture(piece.hero, "thumb");
  const H = level === 2 ? "h2" : "h3";
  return (
    <article
      className={`border-hairline grid gap-4 border-t py-4 sm:gap-5 ${pic ? "grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)]" : ""}`}
      data-piece={piece.slug}
    >
      {pic ? (
        <a href={piece.url} tabIndex={-1} aria-hidden="true">
          <img
            src={pic.src}
            alt=""
            width={pic.width}
            height={pic.height}
            loading="lazy"
            decoding="async"
            className="bg-paper-sunken aspect-square w-full rounded-md object-cover"
          />
        </a>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="t-label text-ink-muted">{eyebrow(piece)}</p>
        <H className="t-display-sm">
          <a href={piece.url} className="oh-rowlink">
            {piece.title}
          </a>
        </H>
        <p className="t-body text-ink-muted">{piece.standfirst}</p>
        <Meta piece={piece} />
      </div>
    </article>
  );
}

/** A card in a grid. The photo appears only when the piece has a real one. */
export function PieceCard({ piece, level = 3 }: { piece: Piece; level?: 2 | 3 }) {
  const pic = picture(piece.hero, "card");
  const H = level === 2 ? "h2" : "h3";
  return (
    <article className="oh-card flex flex-col" data-piece={piece.slug}>
      {pic ? (
        <a href={piece.url} tabIndex={-1} aria-hidden="true">
          <img
            src={pic.src}
            alt=""
            width={pic.width}
            height={pic.height}
            loading="lazy"
            decoding="async"
            className="bg-paper-sunken aspect-[3/2] w-full object-cover"
          />
        </a>
      ) : null}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="t-label text-ink-muted">{eyebrow(piece)}</p>
        <H className="text-[17px] leading-[1.25] font-bold">
          <a href={piece.url} className="oh-rowlink">
            {piece.title}
          </a>
        </H>
        <p className="t-small text-ink-muted mt-auto pt-1">
          {authorNames(piece)} ·{" "}
          <time dateTime={piece.publishedAt}>{formatDate(piece.publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}

/** A text-only row for the "Latest" list. */
export function TextRow({ piece }: { piece: Piece }) {
  return (
    <a
      href={piece.url}
      className="oh-rowlink border-hairline flex flex-col gap-1 border-t py-3.5"
      data-piece={piece.slug}
    >
      <span className="t-label text-ink-muted">{eyebrow(piece)}</span>
      <span className="t-title">{piece.title}</span>
      <time className="t-small text-ink-muted" dateTime={piece.publishedAt}>
        {timeAgo(piece.publishedAt)}
      </time>
    </a>
  );
}

/** Section links. A pillar with nothing published is left out, so no link leads to an empty page. */
export function PillarChips({
  current,
  counts,
}: {
  current: PillarKey | "all" | null;
  counts: Record<PillarKey, number>;
}) {
  // With nothing published, "All" would be the only chip.
  if (PILLAR_KEYS.every((k) => counts[k] === 0)) return null;
  return (
    <nav
      aria-label="Sections"
      className="chips-scroll border-hairline flex flex-wrap gap-2 border-t pt-4"
      data-section="pillars"
    >
      <Chip href="/newsroom/" current={current === "all"}>
        All
      </Chip>
      {PILLAR_KEYS.filter((k) => counts[k] > 0 || k === current).map((k) => (
        <Chip key={k} href={`${PILLARS[k].path}/`} current={current === k}>
          {PILLARS[k].label}
        </Chip>
      ))}
    </nav>
  );
}

/** The newsletter sign-up, in the page and never a pop-up. A plain form: it works without JavaScript. */
export function BriefingBand({ from, id }: { from: string; id: string }) {
  return (
    <section className="oh-box flex flex-wrap items-start gap-6" data-section="briefing">
      <div className="min-w-0 flex-[999_1_300px]">
        <h2 className="t-display-sm">The daily briefing</h2>
        <p className="t-body text-ink-muted mt-1">
          The day&rsquo;s out-of-home news in five minutes. Leave your email and the first issue
          reaches you when it starts.
        </p>
      </div>
      <form
        method="post"
        action="/api/subscribe/"
        className="flex min-w-0 flex-[1_1_300px] flex-col gap-2"
      >
        <input type="hidden" name="from" value={from} />
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />
        <label htmlFor={id} className="oh-label">
          Work email
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={id}
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            autoComplete="email"
            className="oh-input min-w-0 flex-[1_1_180px]"
          />
          <Button variant="primary" type="submit">
            Get the briefing
          </Button>
        </div>
      </form>
    </section>
  );
}
