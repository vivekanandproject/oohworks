import { Wordmark } from "../brand/Wordmark";

/** The neutrality line, word for word, wherever a buyer reads it (design system, copy rules). */
export const NEUTRALITY_LINE =
  "OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients.";
/** The same promise, addressed to an owner. */
export const NEUTRALITY_LINE_OWNER =
  "OOHWORKS never sells media or takes a media margin. You set the price and keep the client.";

interface Col {
  title: string;
  /** `when` ties a link to the bar's state: shown to a visitor, or to a signed-in owner. */
  links: { href: string; label: string; when?: "out" | "owner" }[];
}

const COLS: Col[] = [
  {
    title: "Product",
    links: [
      { href: "/search/", label: "Find sites" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/newsroom/", label: "Newsroom" },
      { href: "/guides/", label: "Guides" },
      { href: "/charter/", label: "The charter" },
    ],
  },
  {
    title: "For owners",
    links: [
      { href: "/list-your-sites/", label: "List your sites" },
      { href: "/for-owners/#assisted", label: "Assisted onboarding" },
      { href: "/for-owners/#badges", label: "Verification badges" },
      { href: "/sign-in/", label: "Sign in", when: "out" },
      { href: "/owner/", label: "Your sites", when: "owner" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/charter/", label: "What we never do" },
      { href: "/newsroom/corrections/", label: "Corrections" },
      { href: "/feed.xml", label: "RSS feed" },
      { href: "/cookies/", label: "Cookies" },
      { href: "mailto:hello@oohworks.co", label: "Contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-hairline bg-paper border-t">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a
              href="/"
              aria-label="OOHWORKS home"
              className="inline-flex min-h-11 items-center rounded-sm"
            >
              <Wordmark size={28} />
            </a>
            <p className="text-ink-muted t-body mt-4 max-w-[36ch]">
              The open map of out-of-home advertising, where the owner is always the seller.
            </p>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="t-label text-ink-muted">{c.title}</h2>
              <ul className="mt-2 flex flex-col">
                {c.links.map((l) => (
                  <li key={l.href + l.label} data-bar-when={l.when}>
                    <a
                      href={l.href}
                      className="text-ink hover:text-navy-700 inline-flex min-h-11 items-center"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-hairline text-ink-muted t-small mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[60ch]">{NEUTRALITY_LINE}</p>
          <p>© {year} OOHWORKS</p>
        </div>
      </div>
    </footer>
  );
}
