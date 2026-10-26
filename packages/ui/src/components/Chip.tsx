import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

interface Common {
  children: ReactNode;
  /** A figure beside the label, in mono. */
  count?: number | string | undefined;
  /** Shows a small × so the chip reads as removable. */
  removable?: boolean;
  className?: string | undefined;
}

/** A link chip moves to an address: a filter, a section, a part of the page. */
export type ChipLinkProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    href: string;
    /** The chip for the page or filter in force. */
    current?: boolean;
  };
/** A button chip toggles a filter on the page itself. */
export type ChipButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: undefined;
    pressed?: boolean;
  };

/** Filter chip. The one in force fills navy; counts sit in mono. */
export function Chip(props: ChipLinkProps | ChipButtonProps) {
  const { children, count, removable = false, className, ...rest } = props;
  const cls = ["oh-chip", className ?? ""].filter(Boolean).join(" ");
  const inner = (
    <>
      {children}
      {/* The space keeps "Hoardings 9" apart for a screen reader; the flex gap spaces it on screen. */}
      {count !== undefined ? (
        <>
          {" "}
          <span className="count">{count}</span>
        </>
      ) : null}
      {removable ? (
        <span className="x" aria-hidden="true">
          ×
        </span>
      ) : null}
    </>
  );
  if (typeof rest.href === "string") {
    const { current = false, ...link } = rest as ChipLinkProps;
    return (
      <a className={cls} aria-current={current ? "page" : undefined} {...link}>
        {inner}
      </a>
    );
  }
  const { pressed, ...button } = rest as ChipButtonProps;
  return (
    <button type="button" className={cls} aria-pressed={pressed} {...button}>
      {inner}
    </button>
  );
}
