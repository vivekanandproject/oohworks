import { Wordmark } from "../brand/Wordmark";

export interface NavBarProps {
  active?: "find" | "guides" | "news" | "owners" | undefined;
  signedIn?: boolean | undefined;
}

const LINKS: { key: NonNullable<NavBarProps["active"]>; href: string; label: string }[] = [
  { key: "find", href: "/search/", label: "Find sites" },
  { key: "guides", href: "/guides/", label: "Guides" },
  { key: "news", href: "/news/", label: "News" },
  { key: "owners", href: "/for-owners/", label: "For owners" },
];

/** The same bar on every page. On phones the four links sit behind "Menu"; "List your sites" stays visible. */
export function NavBar({ active, signedIn = false }: NavBarProps) {
  return (
    <header className="border-hairline bg-paper border-b">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 sm:gap-6 lg:px-10">
        <a href="/" aria-label="ohworks home" className="shrink-0 rounded-sm">
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
        <a
          href={signedIn ? "/dashboard/" : "/sign-in/"}
          className="oh-btn ghost sm hidden sm:inline-flex"
        >
          {signedIn ? "Dashboard" : "Sign in"}
        </a>
        <a href="/for-owners/" className="oh-btn primary sm">
          List your sites
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
                className="text-ink hover:bg-navy-200 rounded-sm px-3 py-2.5 font-medium"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/sign-in/"
              className="text-ink hover:bg-navy-200 rounded-sm px-3 py-2.5 font-medium sm:hidden"
            >
              Sign in
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
