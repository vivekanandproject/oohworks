export interface Edition {
  code: string;
  label: string;
  href?: string;
  current?: boolean;
}

/** Fixed-height strip for editions. Always rendered, never geo-targeted, so it never shifts layout. */
export function EditionStrip({ editions }: { editions: Edition[] }) {
  return (
    <div className="border-hairline bg-paper-sunken h-9 border-b">
      <div className="text-ink-muted t-small max-w-content mx-auto flex h-full w-full items-center gap-3 overflow-x-auto px-4 lg:px-10">
        <span className="t-label shrink-0">Editions</span>
        {editions.map((e, i) => (
          <span key={e.code} className="flex shrink-0 items-center gap-3">
            {i > 0 ? <span aria-hidden="true">·</span> : null}
            {e.href ? (
              <a href={e.href} className="oh-link" aria-current={e.current ? "page" : undefined}>
                {e.label}
              </a>
            ) : (
              <span className={e.current ? "text-ink font-medium" : ""}>{e.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
