import type { Metadata } from "next";
import type { CSSProperties } from "react";
import {
  Badge,
  Button,
  Container,
  Icon,
  NEUTRALITY_LINE,
  Reveal,
  type BadgeKind,
  Numeral,
} from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { SiteSheet } from "@/components/SiteSheet";
import { BriefField } from "@/components/home/BriefField";
import { PersonaTabs } from "@/components/home/PersonaTabs";
import { PERSONAS } from "@/components/home/personas";
import { PieceCard } from "@/components/editorial/PieceBits";
import { latestForHome } from "@/lib/editorial/queries";
import { CHARTER } from "@/lib/site";
import { JsonLd, SITE_NAME, alternates, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

/** Cached, then refreshed every minute and whenever something is published. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME}: every billboard, findable. The open map of out-of-home advertising`,
  },
  alternates: alternates("/", [{ hrefLang: "en", path: "/" }]),
};

/** Stagger index for a list item. */
const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Briefs the built-in rules read in full (src/lib/sites/brief.test.ts keeps them honest). */
const EXAMPLES = [
  { label: "hoardings in Bengaluru", q: "hoardings in Bengaluru" },
  { label: "LED screens in Mumbai", q: "LED screens in Mumbai" },
  { label: "20 × 10 near Silk Board under 1 lakh", q: "20x10 near Silk Board under 1 lakh" },
];

/** What every site page records, beside the sample sheet. */
const ANATOMY = [
  {
    t: "The exact place",
    d: "Coordinates to five decimals and the direction the face looks, so you know which traffic sees it.",
  },
  { t: "The real size", d: "Width and height in feet and metres, and the height above the road." },
  { t: "Light", d: "Front-lit, back-lit or digital, and the hours it is lit." },
  {
    t: "Audience, with its source",
    d: "Who measured it, how and when. Without a source, no figure.",
  },
  {
    t: "The owner's price",
    d: "An exact rate, a “from” price or on request, as the owner chose, with the minimum period.",
  },
  { t: "Availability", d: "Booked until when, and the date the owner last confirmed it." },
  { t: "Permit", d: "Number, authority and expiry, when the owner has one on file." },
  { t: "The owner, named", d: "Who sells it, and how fast they usually reply." },
];

/** The badges a site or owner can earn, and what earns each. */
const CHECKS: { kind: BadgeKind; label: string; how: string }[] = [
  {
    kind: "verified",
    label: "Verified owner",
    how: "Company documents and contact details checked by our team.",
  },
  {
    kind: "verified",
    label: "Verified location",
    how: "The pin matches the site on the street, and the date it was checked is shown.",
  },
  {
    kind: "permit",
    label: "Permit on file",
    how: "Permit number, issuing authority and expiry, shown on the page.",
  },
  {
    kind: "fresh",
    label: "Updated recently",
    how: "Availability or photos confirmed in the last 30 days. Older pages say so.",
  },
  {
    kind: "responsive",
    label: "Replies in under a day",
    how: "Earned from how fast the owner actually answers enquiries.",
  },
];

/** Where owners can list. Every country is welcome; these name the markets by region, and say where search opens first. */
const REGIONS: { name: string; countries: string[]; note: string }[] = [
  {
    name: "South Asia",
    countries: ["India", "Sri Lanka", "Bangladesh", "Nepal"],
    note: "Search opens in India first",
  },
  {
    name: "Middle East",
    countries: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Oman"],
    note: "Owners welcome now",
  },
  {
    name: "Europe",
    countries: ["United Kingdom", "Germany", "France", "Netherlands"],
    note: "Owners welcome now",
  },
  {
    name: "The Americas",
    countries: ["United States", "Canada", "Mexico", "Brazil"],
    note: "Owners welcome now",
  },
  {
    name: "Africa",
    countries: ["Nigeria", "Kenya", "South Africa", "Egypt"],
    note: "Owners welcome now",
  },
  {
    name: "Asia Pacific",
    countries: ["Singapore", "Malaysia", "Indonesia", "Australia"],
    note: "Owners welcome now",
  },
];

const OWNER_FACTS = [
  {
    icon: "hoarding" as const,
    t: "We do the typing",
    d: "Send a media kit or a spreadsheet. Your sites come back as drafts for you to check.",
  },
  {
    icon: "enquiry" as const,
    t: "Leads straight to you",
    d: "No reselling, no rerouting. Your name is on every page about your site.",
  },
  {
    icon: "verified" as const,
    t: "Verified, not just listed",
    d: "Company, location and permit checks earn badges buyers trust.",
  },
  {
    icon: "responsive" as const,
    t: "A free storefront",
    d: "A public page for your company with all your sites, even if you have no website.",
  },
];

export default async function HomePage() {
  const latest = await latestForHome(3);
  return (
    <Shell>
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />

      {/* Hero: centred. The H1 is the LCP element and is never inside a reveal */}
      <section className="border-hairline border-b" data-section="hero">
        <Container className="py-14 lg:py-20">
          <div className="mx-auto flex max-w-[800px] flex-col items-center text-center">
            <p className="t-label text-ink-muted">The open map of out-of-home</p>
            <h1 className="t-display-xl text-ink mt-4">Every billboard, findable.</h1>
            <p className="t-body-xl text-ink-muted mt-6 max-w-[48ch]">
              Describe the sites you need in plain words. See who owns each one, and ask the owner
              in one step. Free for advertisers; the owner is always the seller.
            </p>
            <div className="mt-8 w-full max-w-[680px]">
              <BriefField examples={EXAMPLES} />
            </div>
          </div>
        </Container>
      </section>

      {/* How it works, one tab per kind of visitor */}
      <section className="border-hairline border-b" data-section="how-it-works" id="how-it-works">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <p className="t-label text-ink-muted">How it works</p>
            <h2 className="t-display-md mt-3">How it works, for you</h2>
          </Reveal>
          <div className="mt-8">
            <PersonaTabs personas={PERSONAS} />
          </div>
        </Container>
      </section>

      {/* Inside a site page: the sample sheet beside what every page records */}
      <section className="border-hairline border-b" data-section="anatomy">
        <Container className="py-12 lg:py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[6fr_6fr] lg:gap-14">
            <div>
              <Reveal>
                <p className="t-label text-ink-muted">Inside a site page</p>
                <h2 className="t-display-md mt-3">Everything you would check, on one page</h2>
                <p className="t-body text-ink-muted mt-3 max-w-[52ch]">
                  Every site is recorded the same way, so two sites from two owners compare line by
                  line. Real pages lead with dated photos from the street.
                </p>
              </Reveal>
              <Reveal stagger>
                <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {ANATOMY.map((a, i) => (
                    <div key={a.t} data-stagger-item style={at(i)}>
                      <dt className="t-body-strong">{a.t}</dt>
                      <dd className="t-body text-ink-muted mt-1">{a.d}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
            {/* The sheet illustrates the list beside it; on a phone it would trail after it as a near-empty box. */}
            <div className="hidden lg:sticky lg:top-24 lg:block">
              <SiteSheet />
            </div>
          </div>
        </Container>
      </section>

      {/* How we verify */}
      <section className="border-hairline border-b" data-section="verify">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <p className="t-label text-ink-muted">How we verify</p>
            <h2 className="t-display-md mt-3 max-w-[24ch]">Checked before you see it</h2>
            <p className="t-body text-ink-muted mt-3 max-w-[60ch]">
              Inflated traffic claims, one structure sold twice, a location swapped, a proof photo
              borrowed from somewhere else. Each badge answers one of these, and says when it was
              checked. Every photo is checked for stock images and for pictures already used on
              another site before a buyer sees it.
            </p>
          </Reveal>
          <Reveal stagger>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKS.map((c, i) => (
                <li key={c.label} className="oh-box" data-stagger-item style={at(i)}>
                  <Badge kind={c.kind}>{c.label}</Badge>
                  <p className="t-body text-ink-muted mt-3">{c.how}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* Countries: owners anywhere, grouped by region, with where search opens first */}
      <section className="border-hairline border-b" data-section="countries">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <p className="t-label text-ink-muted">Where we work</p>
            <h2 className="t-display-md mt-3">Countries worldwide</h2>
            <p className="t-body text-ink-muted mt-3 max-w-[60ch]">
              OOHWORKS is one map for out-of-home in every country. Media owners anywhere can open a
              company page and send their media kit today. Search opens in India first, and each
              country follows as its owners list and verify their sites.
            </p>
          </Reveal>
          <Reveal stagger>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3 lg:gap-x-8">
              {REGIONS.map((r, i) => (
                <li
                  key={r.name}
                  className="border-hairline border-t pt-4"
                  data-stagger-item
                  data-region={r.name}
                  style={at(i)}
                >
                  <h3 className="t-body-strong">{r.name}</h3>
                  <ul className="t-body mt-3 grid gap-1.5">
                    {r.countries.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <p className="t-small text-ink-muted mt-3">{r.note}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <p className="t-body text-ink-muted mt-8">
            Your country not named here? Every country is welcome.{" "}
            <a href="/list-your-sites/" className="oh-link">
              List your sites free
            </a>
            .
          </p>
        </Container>
      </section>

      {/* For media owners */}
      <section className="bg-navy text-on-navy" data-section="owners">
        <Container className="py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:gap-14">
            <Reveal>
              <p className="t-label opacity-80">For media owners</p>
              <h2 className="t-display-lg mt-3">Your sites, found by every buyer, at no cost.</h2>
              <p className="t-body-lg mt-5 max-w-[48ch] opacity-90">
                List every face free. Set your own price, or none. Enquiries come straight to you,
                you keep the client, and we take no commission.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/list-your-sites/" variant="on-navy">
                  List your sites
                </Button>
                <Button href="/for-owners/#assisted" variant="ghost-on-navy">
                  How assisted onboarding works
                </Button>
              </div>
            </Reveal>
            <Reveal stagger>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {OWNER_FACTS.map((f, i) => (
                  <li key={f.t} className="flex gap-3" data-stagger-item style={at(i)}>
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
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Newsroom: only when pieces exist */}
      {latest.length > 0 ? (
        <section className="border-hairline border-b" data-section="newsroom">
          <Container className="py-12 lg:py-16">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="t-label text-ink-muted">From the newsroom</p>
                  <h2 className="t-display-md mt-3">News, analysis and guides</h2>
                </div>
                <a href="/newsroom/" className="oh-link t-body">
                  Go to the newsroom
                </a>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((p) => (
                <PieceCard key={`${p.collection}-${p.id}`} piece={p} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* The charter, and the close */}
      <section className="bg-paper-sunken" data-section="neutrality">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <div className="text-center">
              <p className="t-label text-ink-muted">Our charter</p>
              <h2 className="t-display-md mx-auto mt-4 max-w-[30ch]">{NEUTRALITY_LINE}</h2>
            </div>
          </Reveal>
          <Reveal stagger>
            <ol className="mx-auto mt-10 grid max-w-[1000px] gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {CHARTER.map((rule, i) => (
                <li key={rule.title} data-stagger-item style={at(i)}>
                  <Numeral n={i + 1} />
                  <h3 className="t-body-strong mt-1">{rule.title}</h3>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button href="/search/" variant="primary">
                Search sites
              </Button>
              <Button href="/list-your-sites/" variant="secondary">
                List your sites free
              </Button>
              <Button href="/charter/" variant="ghost">
                Read the charter
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </Shell>
  );
}
