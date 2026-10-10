import type { Metadata } from "next";
import { Button, Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
import { ownerByEmail, ownerEmail } from "@/lib/owners/server";
import { alternates } from "@/lib/seo";
import { maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "List your billboards, hoardings and screens free",
  description:
    "Put your outdoor advertising sites on ohworks at no cost. You set the price and how it shows, and every enquiry comes straight to you. Add sites one at a time, from a spreadsheet, or send us your media kit.",
  alternates: alternates("/list-your-sites/"),
};

const ERRORS: Record<string, { t: string; d: string }> = {
  email: { t: "That email did not look right.", d: "Check it and try again." },
  busy: { t: "Too many tries in a short time.", d: "Wait a minute, then try again." },
  send: { t: "We could not send the code just now.", d: "Try again in a minute." },
  again: { t: "That code can no longer be used.", d: "Enter your email for a new one." },
};

const WAYS = [
  {
    tag: "A few sites",
    title: "One at a time",
    text: "A short form and a pin on the map. About three minutes a site.",
  },
  {
    tag: "Many sites",
    title: "A spreadsheet",
    text: "Fill our template, one row a site, and upload it. Any problem is named by its row and column.",
  },
  {
    tag: "We do it",
    title: "Send us your media kit",
    text: "A PDF or your own sheet. Our team enters the sites, and you approve each one.",
  },
];

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function ListYourSitesPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const email = await ownerEmail();
  const owner = email ? await ownerByEmail(email) : null;
  const error = ERRORS[one(q.error)];

  return (
    <Shell active="owners" listHref={email ? undefined : "#owner-email"}>
      <Container className="py-10 lg:py-16">
        <div className="max-w-[720px]">
          <p className="t-label text-ink-muted">For media owners</p>
          <h1 className="t-display-xl mt-3">List your sites. It is free.</h1>
          <p className="t-body-lg text-ink-muted mt-5">
            Every enquiry comes straight to you. You set the price and how it shows. ohworks never
            sells media or takes a margin.
          </p>
        </div>

        <section
          className="border-hairline bg-paper-raised mt-8 max-w-[720px] rounded-md border p-5 sm:p-6"
          data-section="start"
        >
          {one(q.out) === "1" ? (
            <div className="mb-4">
              <Notice tone="success" title="You are signed out." section="signed-out">
                Your sites are untouched. Enter your email to come back.
              </Notice>
            </div>
          ) : null}
          {error ? (
            <div className="mb-4">
              <Notice tone="error" title={error.t} section="start-error">
                {error.d}
              </Notice>
            </div>
          ) : null}
          {email ? (
            <div data-section="start-known">
              <h2 className="t-display-sm">
                {owner ? `Welcome back, ${owner.name}` : "Carry on where you left off"}
              </h2>
              <p className="t-body text-ink-muted mt-2">
                This browser has confirmed{" "}
                <span className="text-ink font-mono">{maskEmail(email)}</span>.
              </p>
              <div className="mt-4">
                <Button href={owner ? "/owner/" : "/owner/company/"} variant="primary" size="lg">
                  {owner ? "Go to your sites" : "Add your company"}
                </Button>
              </div>
            </div>
          ) : (
            <form method="post" action="/api/owner/start/" data-section="start-form">
              <h2 className="t-display-sm">Start with your work email</h2>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="sr-only"
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="owner-email" className="sr-only">
                  Your work email
                </label>
                <input
                  id="owner-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@yourcompany.com"
                  aria-describedby="owner-email-help"
                  // The bar's "List your sites" points here. The margin keeps the headline in view
                  // when it does, so the page answers by focusing the box, not by jumping past it.
                  className="oh-input lg flex-1 scroll-mt-[60vh]"
                />
                <button type="submit" className="oh-btn primary lg" data-action="start">
                  Send me a code
                </button>
              </div>
              <p id="owner-email-help" className="t-small text-ink-muted mt-2">
                This is where enquiries will reach you, so we confirm it first. No password to
                remember. Already listed? The same step brings you back to your sites.
              </p>
            </form>
          )}
        </section>

        <section className="mt-12">
          <h2 className="t-display-md">Three ways to add your sites</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3" data-section="ways">
            {WAYS.map((w) => (
              <div key={w.title} className="border-hairline bg-paper-raised rounded-md border p-5">
                <span className="oh-badge neutral">{w.tag}</span>
                <h3 className="mt-3 text-[18px] leading-6 font-semibold">{w.title}</h3>
                <p className="t-body text-ink-muted mt-2">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <section className="border-hairline bg-paper-raised rounded-md border p-5">
            <h2 className="t-display-sm">What you will need</h2>
            <ul className="t-body text-ink mt-3 list-disc space-y-1 pl-5">
              <li>Where each site is, and which way it faces</li>
              <li>Its size and how it is lit</li>
              <li>Your rate, or a choice to show &ldquo;price on request&rdquo;</li>
              <li>Real photographs of the site, if you have them</li>
              <li>Your GSTIN and a document, for the Verified owner badge</li>
            </ul>
          </section>
          <section className="border-hairline bg-paper-raised rounded-md border p-5">
            <h2 className="t-display-sm">What happens next</h2>
            <ol className="t-body text-ink mt-3 list-decimal space-y-1 pl-5">
              <li>You add your sites. Only you can see them.</li>
              <li>You send them for review.</li>
              <li>We check the owner, the location and the photographs.</li>
              <li>Each site goes live, or comes back with the reason.</li>
            </ol>
          </section>
        </div>

        <p className="t-body text-ink mt-10 max-w-[68ch]">
          Listing costs nothing and there is no commission. {NEUTRALITY_LINE}{" "}
          <a href="/charter/" className="oh-link">
            Read what we never do
          </a>
          .
        </p>
      </Container>
    </Shell>
  );
}
