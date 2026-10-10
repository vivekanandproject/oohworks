import type { ReactNode } from "react";
import { Footer, NavBar } from "@ohworks/ui";

export function Shell({
  children,
  active,
  listHref,
}: {
  children: ReactNode;
  active?: "find" | "news" | "owners" | undefined;
  /** Where the bar's "List your sites" leads, when a page wants it to point at its own form. */
  listHref?: string | undefined;
}) {
  return (
    <>
      <a
        href="#main"
        className="focus:bg-paper-raised sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <NavBar active={active} listHref={listHref} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
