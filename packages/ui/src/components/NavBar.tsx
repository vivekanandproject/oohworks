import type { ReactNode } from "react";
import { Wordmark } from "../brand/Wordmark";

export interface NavBarProps {
  active?: "find" | "how" | "news" | "owners" | undefined;
  /** Where "List your sites" leads. The start page points it at its own email box. */
  listHref?: string | undefined;
  /** The country switcher, beside Sign in on a wide screen. */
  country?: ReactNode;
  /** The same, as a row in the phone menu. */
  countryMenu?: ReactNode;
}

const LINKS: { key: NonNullable<NavBarProps["active"]>; href: string; label: string }[] = [
  { key: "find", href: "/search/", label: "Find sites" },
  { key: "how", href: "/#how-it-works", label: "How it works" },
  { key: "news", href: "/newsroom/", label: "Newsroom" },
  { key: "owners", href: "/for-owners/", label: "For owners" },
];

/**
 * The same bar on every page. On phones the links sit behind "Menu"; "List your sites" stays visible.
 * Guides live in the footer.
 *
 * Both the signed-out and the signed-in owner's links are in the page. Which pair shows is decided by
 * `data-bar` on the html element, set before first paint from a marker cookie, so a page can be the
 * same for everyone, and cached, and still show an owner the way to their sites.
 */
export function NavBar({
  active,
  listHref = "/list-your-sites/",
  country,
  countryMenu,
}: NavBarProps) {
  // On a short screen (a phone on its side) the bar scrolls away, so it and a page's own bottom bar
  // together never take more than a quarter of the screen.
  return (
    <header className="border-hairline bg-paper sticky top-0 z-30 border-b [@media(max-height:480px)]:static">
      <div className="max-w-content mx-auto flex h-16 w-full items-center gap-2 px-4 sm:gap-6 lg:px-10">
        <a
          href="/"
          aria-label="OOHWORKS home"
          className="inline-flex min-h-11 shrink-0 items-center rounded-sm"
        >
          <Wordmark size={28} />
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.key}
              href={l.href}
              aria-current={active === l.key ? "page" : undefined}
              className={`text-ink hover:text-navy-700 rounded-sm font-medium ${active === l.key ? "decoration-navy underline decoration-2 underline-offset-8" : ""}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <span className="flex-1" />
        {country}
        <a href="/sign-in/" className="oh-btn ghost sm hidden sm:inline-flex" data-bar-when="out">
          Sign in
        </a>
        <a href={listHref} className="oh-btn primary sm" data-bar-when="out">
          List your sites
        </a>
        <a href="/owner/" className="oh-btn primary sm" data-bar-when="owner">
          Your sites
        </a>
        <details className="oh-menu relative lg:hidden">
          <summary className="oh-btn ghost sm cursor-pointer list-none px-2! select-none [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav
            aria-label="Primary, phone"
            className="border-hairline bg-paper-raised shadow-float absolute top-full right-0 z-20 mt-2 flex w-56 flex-col rounded-md border p-2"
          >
            {LINKS.map((l) => (
              <a
                key={l.key}
                href={l.href}
                className="text-ink hover:bg-navy-200 flex min-h-11 items-center rounded-sm px-3 font-medium"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/sign-in/"
              className="text-ink hover:bg-navy-200 flex min-h-11 items-center rounded-sm px-3 font-medium sm:hidden"
              data-bar-when="out"
            >
              Sign in
            </a>
            {countryMenu ? (
              <div className="border-hairline mt-1 border-t pt-1">{countryMenu}</div>
            ) : null}
          </nav>
        </details>
      </div>
    </header>
  );
}
