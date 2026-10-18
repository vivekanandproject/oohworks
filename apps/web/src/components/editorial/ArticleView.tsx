import { Badge, Container } from "@ohworks/ui";
import type { Correction, Media, Person } from "@/payload-types";
import { JsonLd, absolute } from "@/lib/seo";
import { formatDate, readTime } from "@/lib/editorial/format";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/editorial/jsonld";
import { countWords, factsIn, headingIndex, refId } from "@/lib/editorial/lexical";
import { picture } from "@/lib/editorial/media";
import { PILLARS } from "@/lib/editorial/pillars";
import {
  correctionsFor,
  relatedTo,
  resolveBlockDocs,
  resolveSources,
  type Piece,
  type ResolvedSources,
} from "@/lib/editorial/queries";
import { CopyLink, ReadingProgress, TocHighlight } from "./ArticleClient";
import { Body, type BodyContext } from "./Body";
import { BriefingBand, PieceCard, TextRow, authorNames, eyebrow } from "./PieceBits";

/** Rails appear on pieces long enough to need a map: at least two sections and this many words. */
const RAILS_MIN_WORDS = 300;

function Avatar({ person, size = 48 }: { person: Person | undefined; size?: number }) {
  const photo =
    person && typeof person.photo === "object" && person.photo !== null
      ? picture(person.photo as Media, "thumb")
      : null;
  if (photo) {
    return (
      <img
        src={photo.src}
        alt=""
        width={size}
        height={size}
        className="rounded-pill bg-paper-sunken shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="rounded-pill bg-navy font-display text-on-navy grid shrink-0 place-items-center text-[18px] font-bold"
      style={{ width: size, height: size }}
    >
      {(person?.name ?? "o").charAt(0).toUpperCase()}
    </span>
  );
}

function Byline({ piece }: { piece: Piece }) {
  const first = piece.authors[0];
  return (
    <div className="flex items-center gap-3" data-section="byline">
      <Avatar person={first} />
      <div className="min-w-0">
        <p className="t-body-strong">
          {piece.authors.length
            ? piece.authors.map((a, i) => (
                <span key={a.id}>
                  {i > 0 ? (i === piece.authors.length - 1 ? " and " : ", ") : ""}
                  {a.slug ? (
                    <a href={`/authors/${a.slug}/`} className="oh-rowlink" rel="author">
                      {a.name}
                    </a>
                  ) : (
                    a.name
                  )}
                </span>
              ))
            : "OOHWORKS"}
        </p>
        <p className="t-small text-ink-muted">
          {first?.role ? `${first.role} · ` : ""}
          <time dateTime={piece.publishedAt}>{formatDate(piece.publishedAt)}</time> ·{" "}
          {readTime(piece.readingTime)}
          {piece.refreshedAt ? ` · figures refreshed ${formatDate(piece.refreshedAt)}` : ""}
        </p>
      </div>
    </div>
  );
}

function Share({ piece }: { piece: Piece }) {
  const url = absolute(piece.url);
  return (
    <div className="flex flex-wrap items-center gap-2" data-section="share">
      <CopyLink />
      <a
        className="oh-chip"
        href={`mailto:?subject=${encodeURIComponent(piece.title)}&body=${encodeURIComponent(url)}`}
      >
        Email
      </a>
      <a
        className="oh-chip"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener"
      >
        LinkedIn
      </a>
      <a
        className="oh-chip"
        href={`https://wa.me/?text=${encodeURIComponent(`${piece.title} ${url}`)}`}
        target="_blank"
        rel="noopener"
      >
        WhatsApp
      </a>
    </div>
  );
}

function Head({ piece }: { piece: Piece }) {
  const pillar = PILLARS[piece.pillar];
  return (
    <header className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="t-small text-ink-muted">
        <a className="oh-link" href="/newsroom/">
          Newsroom
        </a>{" "}
        <span aria-hidden="true">›</span>{" "}
        <a className="oh-link" href={`${pillar.path}/`}>
          {pillar.label}
        </a>
      </nav>
      <p className="t-label text-ink-muted">{eyebrow(piece)}</p>
      <h1 className="t-display-lg text-ink">{piece.title}</h1>
      <p className="t-body-xl text-ink-muted">{piece.standfirst}</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Byline piece={piece} />
        <Share piece={piece} />
      </div>
    </header>
  );
}

function Sources({
  sources,
  corrections,
}: {
  sources: ResolvedSources;
  corrections: Correction[];
}) {
  if (!sources.list.length && !corrections.length) return null;
  return (
    <section id="sources" className="scroll-mt-24" data-section="sources">
      {sources.list.length ? (
        <>
          <h2 className="t-display-md">Sources</h2>
          <ol className="oh-sources mt-3">
            {sources.list.map((s, i) => (
              <li key={s.id} id={`src-${i + 1}`}>
                <span>
                  {s.url ? (
                    <a className="oh-link" href={s.url} rel="noopener">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                  <span className="text-ink-muted">
                    , {s.publisher}
                    {s.publishedOn
                      ? `, published ${formatDate(s.publishedOn)}`
                      : `, retrieved ${formatDate(s.retrievedOn)}`}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {corrections.length ? (
        <div className="mt-5" data-section="corrections">
          <h2 className="t-label text-ink-muted">Corrections</h2>
          {corrections.map((c) => (
            <p key={c.id} className="t-small text-ink-muted mt-1">
              <time dateTime={c.correctedAt}>{formatDate(c.correctedAt)}</time>: {c.note}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AuthorCards({ piece }: { piece: Piece }) {
  if (!piece.authors.length) return null;
  return (
    <div className="flex flex-col gap-4" data-section="authors">
      {piece.authors.map((a) => (
        <section
          key={a.id}
          className="border-hairline bg-paper-raised flex items-start gap-4 rounded-md border p-5"
        >
          <Avatar person={a} />
          <div className="min-w-0">
            <h2 className="t-body-strong">
              {a.slug ? (
                <a href={`/authors/${a.slug}/`} className="oh-rowlink">
                  {a.name}
                </a>
              ) : (
                a.name
              )}
            </h2>
            <p className="t-small text-ink-muted">{a.role}</p>
            {a.verified ? (
              <p className="mt-2">
                <Badge kind="verified">Verified contributor</Badge>
              </p>
            ) : null}
            <p className="t-body text-ink-muted mt-2">{a.bio}</p>
          </div>
        </section>
      ))}
    </div>
  );
}

function Topics({ piece }: { piece: Piece }) {
  const tags = [...piece.places, ...piece.tags].filter(
    (t, i, all) => t.slug && all.findIndex((x) => x.id === t.id) === i,
  );
  if (!tags.length) return null;
  return (
    <nav aria-label="Topics" className="flex flex-wrap items-center gap-2" data-section="topics">
      <span className="t-label text-ink-muted mr-1">Topics</span>
      {tags.map((t) => (
        <a key={t.id} href={`/topics/${t.slug}/`} className="oh-chip">
          {t.name}
        </a>
      ))}
    </nav>
  );
}

/**
 * One template for every piece. Long pieces get rails: contents on the left, key facts on the right.
 * Short pieces are a single reading column. Showcase pieces may open on a full-width photo.
 */
export async function ArticleView({ piece }: { piece: Piece }) {
  const pillar = PILLARS[piece.pillar];
  const { list: headings, ids } = headingIndex(piece.body);
  const toc = headings.filter((h) => h.level === 2);
  const [sources, blockDocs, corrections, related] = await Promise.all([
    resolveSources(piece),
    resolveBlockDocs(piece),
    correctionsFor(piece),
    relatedTo(piece, 3),
  ]);

  const hero = picture(piece.hero, "hero");
  const immersive = piece.layout === "immersive" && hero !== null;
  const rails = !immersive && toc.length >= 2 && countWords(piece.body) >= RAILS_MIN_WORDS;
  const layout = immersive ? "immersive" : rails ? "rails" : "column";
  const keyFacts = rails
    ? factsIn(piece.body)
        .filter((f) => f.label)
        .slice(0, 4)
    : [];

  const ctx: BodyContext = {
    headingIds: ids,
    sourceNumber: sources.numberOf,
    sources: sources.byId,
    media: blockDocs.media,
    people: blockDocs.people,
  };
  const method = piece.methodNotes ? headingIndex(piece.methodNotes) : null;

  const bodyBlock = (
    <>
      <Body body={piece.body} ctx={ctx} />
      {method ? (
        <section className="mt-12" data-section="method">
          <h2 className="t-display-md">Method</h2>
          <Body
            body={piece.methodNotes}
            ctx={{ ...ctx, headingIds: method.ids }}
            className="mt-3"
          />
        </section>
      ) : null}
      <div className="mt-8">
        <Topics piece={piece} />
      </div>
    </>
  );

  const jsonLd = [
    articleJsonLd(
      piece,
      sources.list.map((s) => s.url).filter((u): u is string => Boolean(u)),
    ),
    breadcrumbJsonLd([
      { name: "Newsroom", path: "/newsroom/" },
      { name: pillar.label, path: `${pillar.path}/` },
      { name: piece.title, path: piece.url },
    ]),
  ];

  return (
    <article id="piece" data-layout={layout} data-pillar={piece.pillar}>
      <JsonLd data={jsonLd} />
      <ReadingProgress targetId="piece" />
      {piece.sponsor ? (
        <div className="border-hairline bg-lit-tint border-b" data-section="sponsor">
          <Container className="py-2">
            <p className="t-small text-ink">Sponsored by {piece.sponsor}</p>
          </Container>
        </div>
      ) : null}

      {immersive && hero ? (
        <img
          src={hero.src}
          alt={hero.alt}
          width={hero.width}
          height={hero.height}
          fetchPriority="high"
          decoding="async"
          className="bg-paper-sunken block h-[240px] w-full object-cover sm:h-[380px] lg:h-[520px]"
        />
      ) : null}

      <Container className={immersive ? "pb-14" : "pt-8 pb-14 lg:pt-10"}>
        {immersive && hero ? (
          <>
            <div className="border-hairline bg-paper-raised relative mx-auto -mt-10 max-w-[880px] rounded-md border p-5 sm:p-8 lg:-mt-24 lg:p-10">
              <Head piece={piece} />
            </div>
            <p className="t-small text-ink-muted mx-auto mt-3 max-w-[880px]">
              Photo: {hero.credit}
            </p>
            <div className="mx-auto mt-8 max-w-[680px]">{bodyBlock}</div>
          </>
        ) : rails ? (
          <>
            <div className="max-w-[860px]">
              <Head piece={piece} />
            </div>
            {hero ? (
              <figure className="mt-6">
                <img
                  src={hero.src}
                  alt={hero.alt}
                  width={hero.width}
                  height={hero.height}
                  fetchPriority="high"
                  decoding="async"
                  className="bg-paper-sunken aspect-[16/9] w-full rounded-md object-cover lg:aspect-[21/9]"
                />
                <figcaption className="t-small text-ink-muted mt-2">
                  Photo: {hero.credit}
                </figcaption>
              </figure>
            ) : null}
            <div className="mt-8 grid gap-8 lg:grid-cols-[160px_minmax(0,1fr)_256px] lg:items-start">
              <nav
                aria-label="On this page"
                data-toc=""
                className="oh-toc lg:sticky lg:top-[92px] lg:col-start-1 lg:row-start-1"
              >
                <p className="t-label text-ink-muted max-lg:mr-1 lg:mb-1.5">On this page</p>
                {toc.map((h) => (
                  <a key={h.id} href={`#${h.id}`}>
                    {h.text}
                  </a>
                ))}
                {sources.list.length ? <a href="#sources">Sources</a> : null}
              </nav>
              <div className="min-w-0 lg:col-start-2 lg:row-start-1">{bodyBlock}</div>
              {keyFacts.length ? (
                <aside
                  aria-label="Key facts"
                  className="lg:sticky lg:top-[92px] lg:col-start-3 lg:row-start-1"
                  data-section="key-facts"
                >
                  <div className="border-hairline bg-paper-raised rounded-md border p-5">
                    <h2 className="t-label text-ink-muted">Key facts</h2>
                    <ul className="mt-1">
                      {keyFacts.map((f, i) => {
                        const id = refId(f.source);
                        const src = id !== undefined ? sources.byId.get(id) : undefined;
                        return (
                          <li key={i} className="border-hairline border-t py-3 first:border-t-0">
                            <p
                              className="t-data-lg text-ink break-words"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {f.value}
                              {f.unit ? <span className="t-small"> {f.unit}</span> : null}
                            </p>
                            <p className="t-body text-ink">{f.label}</p>
                            <p className="t-small text-ink-muted">
                              {src ? `${src.publisher}, ` : ""}
                              {formatDate(f.asOf)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </aside>
              ) : null}
            </div>
            <TocHighlight
              ids={[...toc.map((h) => h.id), ...(sources.list.length ? ["sources"] : [])]}
            />
          </>
        ) : (
          <div className="mx-auto max-w-[680px]">
            <Head piece={piece} />
            {hero ? (
              <figure className="mt-6">
                <img
                  src={hero.src}
                  alt={hero.alt}
                  width={hero.width}
                  height={hero.height}
                  fetchPriority="high"
                  decoding="async"
                  className="bg-paper-sunken aspect-[16/9] w-full rounded-md object-cover"
                />
                <figcaption className="t-small text-ink-muted mt-2">
                  Photo: {hero.credit}
                </figcaption>
              </figure>
            ) : null}
            <div className="mt-8">{bodyBlock}</div>
          </div>
        )}

        {rails ? (
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <Sources sources={sources} corrections={corrections} />
            <div className="flex flex-col gap-6">
              <AuthorCards piece={piece} />
              <BriefingBand from={piece.url} id="brief-article" />
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-12 flex max-w-[680px] flex-col gap-8">
            <Sources sources={sources} corrections={corrections} />
            <AuthorCards piece={piece} />
            <BriefingBand from={piece.url} id="brief-article" />
          </div>
        )}

        {related.length ? (
          <section
            className={`mt-12 ${rails || immersive ? "" : "mx-auto max-w-[680px]"}`}
            data-section="related"
          >
            <h2 className="t-display-md">Related</h2>
            {rails || immersive ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <PieceCard key={`${r.collection}-${r.id}`} piece={r} />
                ))}
              </div>
            ) : (
              <div className="mt-3">
                {related.map((r) => (
                  <TextRow key={`${r.collection}-${r.id}`} piece={r} />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </Container>
    </article>
  );
}

export { authorNames };
