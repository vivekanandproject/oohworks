import type { ReactNode } from "react";

export interface Crumb {
  label: ReactNode;
  /** Leave out for the page itself, which is then marked as the current page. */
  href?: string | undefined;
  /** "nofollow" for a crumb that points at a search rather than a published page. */
  rel?: string | undefined;
  /** Names the crumb for tests and scripts (`data-crumb`). */
  name?: string | undefined;
}

/** Where a page sits, in `small`, crumbs joined by ›. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="t-small text-ink-muted" data-section="breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => (
          <li key={i} className="contents">
            {i > 0 ? <span aria-hidden="true">›</span> : null}
            {c.href ? (
              <a href={c.href} rel={c.rel} className="oh-link" data-crumb={c.name}>
                {c.label}
              </a>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
