import type { ReactNode } from "react";
import { EditionStrip, Footer, NavBar } from "@ohworks/ui";
import { EDITIONS } from "@/lib/site";

export function Shell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "find" | "guides" | "news" | "owners" | undefined;
}) {
  return (
    <>
      <a
        href="#main"
        className="focus:bg-paper-raised sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <EditionStrip editions={EDITIONS} />
      <NavBar active={active} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
