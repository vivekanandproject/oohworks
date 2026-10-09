export interface ArticleCardProps {
  href: string;
  pillar: string;
  place?: string;
  title: string;
  author: string;
  date: string;
  readTime?: string;
  thumb?: { src: string; alt: string } | null;
}

export function ArticleCard({
  href,
  pillar,
  place,
  title,
  author,
  date,
  readTime,
  thumb,
}: ArticleCardProps) {
  return (
    <article className="oh-article">
      <a href={href} className="thumb overflow-hidden" aria-hidden="true" tabIndex={-1}>
        {thumb ? (
          <img
            src={thumb.src}
            alt=""
            width={96}
            height={96}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </a>
      <div>
        <div className="t-label text-ink-muted">
          {pillar}
          {place ? ` · ${place}` : ""}
        </div>
        <h3>
          <a href={href} className="text-ink hover:text-navy-700">
            {title}
          </a>
        </h3>
        <div className="meta">
          {author} · {date}
          {readTime ? ` · ${readTime}` : ""}
        </div>
      </div>
    </article>
  );
}
