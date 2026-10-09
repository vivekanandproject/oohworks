import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  "primary" | "accent" | "secondary" | "ghost" | "danger" | "on-navy" | "ghost-on-navy";
type Size = "sm" | "md" | "lg";

interface Base {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export type ButtonProps = Base & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
export type ButtonLinkProps = Base & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

function classes(variant: Variant, size: Size, className?: string) {
  return ["oh-btn", variant, size === "md" ? "" : size, className ?? ""].filter(Boolean).join(" ");
}

/** A button names the outcome it causes. `accent` is for exactly one action per view. */
export function Button(props: ButtonProps | ButtonLinkProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  if ("href" in rest && typeof rest.href === "string") {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={classes(variant, size, className)} {...anchorProps}>
        {children}
      </a>
    );
  }
  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes(variant, size, className)} {...buttonProps}>
      {children}
    </button>
  );
}
