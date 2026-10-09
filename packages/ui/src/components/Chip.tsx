import type { ReactNode } from "react";

export interface ChipProps {
  children: ReactNode;
  /** A link chip toggles a URL state; a button chip is for client-side filters. */
  href?: string;
  pressed?: boolean;
  count?: number | string;
  /** Shows a small × so the chip reads as removable. */
  removable?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

/** Filter chip. Pressed fills navy; counts sit in mono. Links keep the fixed facet order the SEO rules set. */
export function Chip({
  children,
  href,
  pressed = false,
  count,
  removable = false,
  onClick,
  ariaLabel,
}: ChipProps) {
  const inner = (
    <>
      {children}
      {count !== undefined ? <span className="count">{count}</span> : null}
      {removable ? (
        <span className="x" aria-hidden="true">
          ×
        </span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className="oh-chip"
        aria-pressed={pressed}
        aria-label={ariaLabel}
        rel="nofollow"
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      className="oh-chip"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}
