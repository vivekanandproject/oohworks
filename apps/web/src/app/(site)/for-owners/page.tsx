import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Badge, Button, Container, Reveal, Numeral } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { OWNER_FAQ, OWNER_SHORT_ANSWER, OWNER_STEPS, ownerFaqJsonLd } from "@/lib/owners/guide";
import { JsonLd, SITE_NAME, absolute, alternates } from "@/lib/seo";

const DESCRIPTION =
  "List every billboard, hoarding and screen free. Set your own price, get enquiries straight to you, keep your client. OOHWORKS never takes a media margin.";

export const metadata: Metadata = {
  title: "For media owners: list your billboards, hoardings and screens free",
  description: DESCRIPTION,
  alternates: {
    ...alternates("/for-owners/"),
    // The same guide as Markdown, for AI assistants helping an owner list (src/app/api/md-guide).
    types: { "text/markdown": absolute("/for-owners.md") },
  },
  openGraph: {
    type: "website",
    title: "List your billboards, hoardings and screens free on OOHWORKS",
    description: DESCRIPTION,
    url: absolute("/for-owners/"),
    siteName: SITE_NAME,
  },
  twitter: { card: "summary", title: "List your sites free on OOHWORKS", description: DESCRIPTION },
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

const BADGES = [
  {
    kind: "verified" as const,
    label: "Verified owner",
    d: "Company documents and contact details checked.",
  },
  {
    kind: "verified" as const,
    label: "Verified location",
    d: "The pin matches the site on the street, checked by our team or from a photo's own GPS position.",
  },
  {
    kind: "permit" as const,
    label: "Permit on file",
    d: "Permit or licence number, issuing authority and expiry date recorded.",
  },
  {
    kind: "fresh" as const,
    label: "Updated 3 days ago",
    d: "Availability or photos updated within the last 30 days.",
  },
  {
    kind: "responsive" as const,
    label: "Replies in under a day",
    d: "Your median reply time to enquiries is under 24 hours.",
  },
];

export default function ForOwnersPage() {
  return (
    <Shell active="owners">
      <JsonLd data={ownerFaqJsonLd()} />
      <section className="border-hairline border-b">
        <Container className="py-12 lg:py-16">
          <p className="t-label text-ink-muted">For media owners</p>
          <h1 className="t-display-xl mt-3 max-w-[18ch]">
            Your sites, found by every buyer, at no cost.
          </h1>
          <p className="t-body-lg text-ink-muted mt-5 max-w-[56ch]">
            List every face free. Set your own price, or none. Enquiries come straight to you by
            email, and you keep the client. We never sell media or take a media margin.
          </p>
          <section
            aria-label="Short answer"
            className="oh-box mt-8 max-w-[68ch]"
            data-section="short-answer"
          >
            <h2 className="t-label text-ink-muted">How to list your sites, in short</h2>
            <p className="t-body-lg text-ink mt-2">{OWNER_SHORT_ANSWER}</p>
          </section>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/list-your-sites/" variant="primary">
              List your sites
            </Button>
            <Button href="/charter/" variant="ghost">
              Read the charter
            </Button>
          </div>
          <p className="t-body text-ink-muted mt-4 max-w-[60ch]">
            Using an AI assistant to help? Point it at the{" "}
            <a href="/for-owners.md" className="oh-link">
              plain-text guide
            </a>
            , which includes every column of the spreadsheet template.
          </p>
        </Container>
      </section>

      <section className="border-hairline border-b" id="assisted">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <h2 className="t-display-md">How listing works, in five steps</h2>
          </Reveal>
          <Reveal stagger>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {OWNER_STEPS.map((s, i) => (
                <li key={s.t} data-stagger-item style={at(i)}>
                  <Numeral n={i + 1} />
                  <h3 className="t-body-strong mt-2">{s.t}</h3>
                  <p className="t-body text-ink-muted mt-1">{s.d}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </section>

      <section className="border-hairline border-b" id="badges">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <h2 className="t-display-md">Badges you earn, and what we check</h2>
          </Reveal>
          <Reveal stagger>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BADGES.map((b, i) => (
                <li key={b.label} className="oh-box oh-panel" data-stagger-item style={at(i)}>
                  <Badge kind={b.kind}>{b.label}</Badge>
                  <p className="t-body text-ink-muted mt-3">{b.d}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="border-hairline border-b" id="questions">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <h2 className="t-display-md">Questions owners ask</h2>
          </Reveal>
          <div className="divide-hairline border-hairline max-w-column mt-8 divide-y border-y">
            {OWNER_FAQ.map((f) => (
              <div key={f.q} className="py-5" data-section="faq-item">
                <h3 className="t-body-strong">{f.q}</h3>
                <p className="t-body text-ink-muted mt-2">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy text-on-navy">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[56ch]">
                <p className="t-label opacity-80">Free, with no commission</p>
                <h2 className="t-display-md mt-3">Start with one site, or all of them</h2>
                <p className="t-body mt-3 opacity-90">
                  Start with your work email. Add one site, upload a spreadsheet, or send the media
                  kit you already have.
                </p>
              </div>
              <Button href="/list-your-sites/" variant="on-navy">
                List your sites
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </Shell>
  );
}
