/** Numbered pages as real links: where you are, Previous, up to five page numbers, Next. */
export function Pager({
  page,
  pages,
  href,
  nofollow = false,
  className,
}: {
  page: number;
  pages: number;
  /** The address of page n. */
  href: (n: number) => string;
  /** For pages of a search, which search engines should not follow. */
  nofollow?: boolean;
  className?: string | undefined;
}) {
  if (pages <= 1) return null;
  const from = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => from + i).filter(
    (n) => n <= pages,
  );
  const rel = (r?: string) =>
    [r, nofollow ? "nofollow" : ""].filter(Boolean).join(" ") || undefined;
  return (
    <nav
      aria-label="Pages"
      className={`border-hairline flex flex-wrap items-center justify-between gap-4 border-t pt-5 ${className ?? ""}`}
      data-section="pager"
    >
      <span className="t-data text-ink-muted">
        Page {page} of {pages}
      </span>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? (
          <a href={href(page - 1)} rel={rel("prev")} className="oh-btn secondary sm">
            Previous
          </a>
        ) : null}
        {numbers.map((n) =>
          n === page ? (
            <span key={n} aria-current="page" className="oh-btn primary sm">
              {n}
            </span>
          ) : (
            <a key={n} href={href(n)} rel={rel()} className="oh-btn secondary sm">
              {n}
            </a>
          ),
        )}
        {page < pages ? (
          <a href={href(page + 1)} rel={rel("next")} className="oh-btn secondary sm">
            Next
          </a>
        ) : null}
      </div>
    </nav>
  );
}
