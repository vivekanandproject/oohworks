import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleCard,
  Button,
  Container,
  Icon,
  ListingCard,
  type ListingCardProps,
  type ArticleCardProps,
  SearchField,
  NEUTRALITY_LINE,
} from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { SiteSheet } from "@/components/SiteSheet";
import { CHARTER, HERO_FACT } from "@/lib/site";
import { JsonLd, SITE_NAME, alternates, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME}: every billboard, findable. The open map of out-of-home advertising`,
  },
  alternates: alternates("/", [{ hrefLang: "en", path: "/" }]),
};

/** Newest indexable faces. Empty until the first owner's site clears the content bar (M2 wires this to Postgres). */
const NEW_SITES: ListingCardProps[] = [];

/** Latest articles. Empty until the newsroom publishes (M5). */
const LATEST_ARTICLES: ArticleCardProps[] = [];

const STEPS = [
  {
    icon: "pin" as const,
    title: "Find the site",
    body: "Search by place, road, format or size. Every page shows real photos, exact coordinates, dimensions and the verified owner.",
  },
  {
    icon: "enquiry" as const,
    title: "Ask the owner",
    body: "One enquiry, straight to the owner. A whole plan across several owners becomes one request each. We never sit in between.",
  },
  {
    icon: "responsive" as const,
    title: "Hear back directly",
    body: "Owners reply by web, email or WhatsApp into one thread. Contract, invoice and payment stay between you and them.",
  },
];

export default function HomePage() {
  return (
    <Shell>
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />

      {/* Hero */}
      <section className="border-hairline border-b" data-section="hero">
        <Container className="py-12 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[11fr_9fr] lg:gap-14">
            <div>
              <p className="t-label text-ink-muted">The open map of out-of-home</p>
              <h1 className="text-ink t-display-xl mt-4">Every billboard, findable.</h1>
              <p className="text-ink-muted t-body-xl mt-6 max-w-[46ch]">
                ohworks is the open map of out-of-home advertising. Search any site, see the owner,
                ask in one step. The owner always sells.
              </p>
              <div className="mt-8">
                <SearchField />
              </div>
              <p className="text-ink-muted t-small mt-5 max-w-[60ch]">
                <span className="text-ink font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {HERO_FACT.text}
                </span>{" "}
                Source:{" "}
                <a href={HERO_FACT.href} className="oh-link" rel="noopener">
                  {HERO_FACT.source}
                </a>
                , as of {HERO_FACT.asOf}.
              </p>
            </div>
            <div className="lg:w-full lg:justify-self-end">
              <SiteSheet />
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-hairline border-b" data-section="how-it-works">
        <Container className="py-12 lg:py-16">
          <h2 className="t-display-md">Three steps, no middleman</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 sm:flex-col">
                <div className="bg-paper-sunken text-ink flex h-12 w-12 shrink-0 items-center justify-center rounded-sm">
                  <Icon name={s.icon} size={24} />
                </div>
                <div>
                  <h3 className="t-display-sm">
                    <span
                      className="text-ink-muted mr-2 font-mono"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      0{i + 1}
                    </span>
                    {s.title}
                  </h3>
                  <p className="text-ink-muted t-body mt-2 max-w-[44ch]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Charter */}
      <section className="border-hairline bg-survey-tint border-b" data-section="charter">
        <Container className="py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-14">
            <div>
              <p className="t-label text-survey-text">The charter</p>
              <h2 className="t-display-md mt-3">Five things we will never do</h2>
              <p className="text-ink-muted t-body mt-4 max-w-[40ch]">
                They answer the fears owners and agencies told us about. They are published here and
                they do not change.
              </p>
              <div className="mt-6">
                <Button href="/charter/" variant="secondary">
                  Read the charter
                </Button>
              </div>
            </div>
            <ol className="divide-hairline border-hairline bg-paper-raised divide-y rounded-md border">
              {CHARTER.map((rule, i) => (
                <li key={rule.title} className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                  <span className="t-data-lg text-ink-faint w-8 shrink-0">{i + 1}</span>
                  <div>
                    <h3 className="t-body-strong text-ink">{rule.title}</h3>
                    <p className="text-ink-muted t-body mt-1 max-w-[56ch]">{rule.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* New sites: only when real indexable faces exist */}
      {NEW_SITES.length > 0 ? (
        <section className="border-hairline border-b" data-section="new-sites">
          <Container className="py-12 lg:py-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="t-display-md">New sites this week</h2>
              <Link href="/search/" className="oh-link t-body">
                See all sites
              </Link>
            </div>
            <div
              className="mt-8 grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {NEW_SITES.map((s) => (
                <ListingCard key={s.href} {...s} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* For media owners */}
      <section className="bg-navy text-on-navy" data-section="owners">
        <Container className="py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:gap-14">
            <div>
              <p className="t-label opacity-80">For media owners</p>
              <h2 className="t-display-lg mt-3">Your sites, found by every buyer, at no cost.</h2>
              <p className="t-body-lg mt-5 max-w-[48ch] opacity-90">
                List every face free. Set your own price, or none. Enquiries come straight to you by
                email and WhatsApp, and you keep the client.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/for-owners/" variant="on-navy">
                  List your sites
                </Button>
                <Button href="/for-owners/#assisted" variant="ghost-on-navy">
                  How assisted onboarding works
                </Button>
              </div>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  icon: "verified" as const,
                  t: "Verified, not just listed",
                  d: "Company, location and permit checks earn badges buyers trust.",
                },
                {
                  icon: "enquiry" as const,
                  t: "Leads straight to you",
                  d: "No reselling, no rerouting. Your name is on every page about your site.",
                },
                {
                  icon: "responsive" as const,
                  t: "A free storefront",
                  d: "A public page for your company with all your sites, even if you have no website.",
                },
                {
                  icon: "hoarding" as const,
                  t: "We do the typing",
                  d: "Send a media kit or a spreadsheet. We turn it into listings and send you the links.",
                },
              ].map((f) => (
                <li key={f.t} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 opacity-90">
                    <Icon name={f.icon} size={24} />
                  </span>
                  <div>
                    <h3 className="t-body-strong">{f.t}</h3>
                    <p className="t-body mt-1 opacity-80">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Agencies and brands */}
      <section className="border-hairline border-b" data-section="buyers">
        <Container className="py-12 lg:py-16">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="border-hairline bg-paper-raised rounded-md border p-5 sm:p-6">
              <p className="t-label text-ink-muted">Agencies and OOH specialists</p>
              <h2 className="t-display-sm mt-3">
                The fastest way to find and check any site, including the independents no exchange
                carries.
              </h2>
              <p className="text-ink-muted t-body mt-3 max-w-[56ch]">
                Standard site sheets, one availability request across many owners, exports for your
                plans. We will never compete with you, and we never contact your clients.
              </p>
              <Link href="/charter/" className="oh-link t-body mt-4 inline-block">
                Read what we never do
              </Link>
            </article>
            <article className="border-hairline bg-paper-raised rounded-md border p-5 sm:p-6">
              <p className="t-label text-ink-muted">Brands and small businesses</p>
              <h2 className="t-display-sm mt-3">
                See real sites, real owners and real prices, then ask in one step.
              </h2>
              <p className="text-ink-muted t-body mt-3 max-w-[56ch]">
                Most hoardings in India rent by the month. A &ldquo;from&rdquo; price, photos and an
                exact location tell you in a minute whether a site fits.
              </p>
              <Link href="/search/" className="oh-link t-body mt-4 inline-block">
                Start a search
              </Link>
            </article>
          </div>
        </Container>
      </section>

      {/* Newsroom: only when articles exist */}
      {LATEST_ARTICLES.length > 0 ? (
        <section className="border-hairline border-b" data-section="newsroom">
          <Container className="py-12 lg:py-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="t-display-md">From the newsroom</h2>
              <Link href="/news/" className="oh-link t-body">
                All news
              </Link>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {LATEST_ARTICLES.map((a) => (
                <ArticleCard key={a.href} {...a} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Neutrality line */}
      <section className="bg-paper-sunken" data-section="neutrality">
        <Container className="py-12 lg:py-16">
          <p className="t-label text-ink-muted">Our charter, in one line</p>
          <blockquote className="t-display-md mt-4 max-w-[30ch]">{NEUTRALITY_LINE}</blockquote>
        </Container>
      </section>
    </Shell>
  );
}
