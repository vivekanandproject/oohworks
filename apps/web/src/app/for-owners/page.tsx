import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Badge, Button, Container, Icon, Reveal } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { alternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "For media owners",
  description:
    "List every billboard, hoarding and screen free. Set your own price, get enquiries straight to you, keep your client. ohworks never takes a media margin.",
  alternates: alternates("/for-owners/"),
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

const STEPS = [
  {
    t: "Verify your company",
    d: "Registration documents (GSTIN in India) and a phone or WhatsApp code. This earns the Verified owner badge.",
  },
  {
    t: "Send your inventory",
    d: "A spreadsheet, bulk photos, or just your PDF media kit. We turn it into listings and send you the links.",
  },
  {
    t: "Pin each face",
    d: "Drop the pin, check it against Street View, add day, night and approach photos. Photos taken in our app carry GPS and time.",
  },
  {
    t: "Set your terms",
    d: "Exact rate, a “from” price or price on request. Minimum period, printing and mounting, categories you accept.",
  },
  {
    t: "Go live",
    d: "Pages that clear the content bar go to Google. Below the bar they stay visible to signed-in buyers until enriched.",
  },
];

const BADGES = [
  {
    kind: "verified" as const,
    label: "Verified owner",
    d: "Company documents and contact details checked.",
  },
  {
    kind: "verified" as const,
    label: "Verified location",
    d: "Coordinates match Street View or a GPS-stamped site photo.",
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
      <section className="border-hairline border-b">
        <Container className="py-12 lg:py-16">
          <p className="t-label text-ink-muted">For media owners</p>
          <h1 className="t-display-xl mt-3 max-w-[18ch]">
            Your sites, found by every buyer, at no cost.
          </h1>
          <p className="t-body-lg text-ink-muted mt-5 max-w-[56ch]">
            List every face free. Set your own price, or none. Enquiries come straight to you by
            email and WhatsApp, and you keep the client. We never sell media or take a media margin.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              href="mailto:owners@ohworks.com?subject=List%20my%20sites%20on%20ohworks"
              variant="primary"
            >
              Send us your media kit
            </Button>
            <Button href="/charter/" variant="ghost">
              Read the charter
            </Button>
          </div>
          <p className="t-small text-ink-muted mt-4 max-w-[60ch]">
            Online sign-up opens with the Bengaluru launch. Until then, email owners@ohworks.com and
            we list your sites for you.
          </p>
        </Container>
      </section>

      <section className="border-hairline border-b" id="assisted">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <h2 className="t-display-md">Assisted onboarding, in five steps</h2>
          </Reveal>
          <Reveal stagger>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s, i) => (
                <li key={s.t} data-stagger-item style={at(i)}>
                  <span className="t-data-lg text-ink-faint">0{i + 1}</span>
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
                <li
                  key={b.label}
                  className="oh-panel border-hairline bg-paper-raised rounded-md border p-4"
                  data-stagger-item
                  style={at(i)}
                >
                  <Badge kind={b.kind}>{b.label}</Badge>
                  <p className="t-body text-ink-muted mt-3">{b.d}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="bg-navy text-on-navy">
        <Container className="py-12 lg:py-16">
          <Reveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[56ch]">
                <p className="t-label opacity-80">Founding owners</p>
                <h2 className="t-display-md mt-3">
                  The first 100 verified owners get Pro free for a year
                </h2>
                <p className="t-body mt-3 opacity-90">
                  And a permanent founding badge on your storefront. Pro adds full analytics, a
                  WhatsApp leads inbox, availability sync and priority support.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="pin" size={24} />
                <Button href="mailto:owners@ohworks.com?subject=Founding%20owner" variant="on-navy">
                  Claim a founding place
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </Shell>
  );
}
