import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { ConsentChoice } from "@/components/ConsentChoice";
import { alternates } from "@/lib/seo";
import { gaMeasurementId } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "The cookies OOHWORKS sets to keep you signed in and remember your shortlist, and Google Analytics, which runs only if you allow it.",
  alternates: alternates("/cookies/"),
};

/** Every cookie the site sets (src/lib/sites/enquiry.ts, src/lib/sites/lists.ts, src/lib/analytics.ts). */
const OWN = [
  {
    name: "oh_buyer",
    what: "Keeps you signed in after you confirm your email for an enquiry.",
    kept: "30 days",
  },
  { name: "oh_owner", what: "Keeps an owner signed in to their sites.", kept: "30 days" },
  {
    name: "oh_bar",
    what: "Shows “Your sites” in the top bar to a signed-in owner.",
    kept: "30 days",
  },
  { name: "oh_saved", what: "Remembers the sites on your shortlist.", kept: "180 days" },
  { name: "oh_compare", what: "Remembers the sites you are comparing.", kept: "180 days" },
  { name: "oh_consent", what: "Remembers whether you allowed Google Analytics.", kept: "180 days" },
  {
    name: "payload-token",
    what: "Keeps the OOHWORKS team signed in to the editor.",
    kept: "8 hours",
  },
];

export default function CookiesPage() {
  const ga = gaMeasurementId();
  return (
    <Shell>
      <Container className="py-12 lg:py-16">
        <div className="max-w-article mx-auto">
          <p className="t-label text-ink-muted">Company</p>
          <h1 className="t-display-lg mt-3">Cookies</h1>
          <p className="t-body-lg text-ink-muted mt-5">
            OOHWORKS sets a few cookies of its own so the site works: they keep you signed in and
            remember your shortlist. They are never shared and never used for advertising. Google
            Analytics, which counts visits, runs only if you allow it.
          </p>

          <h2 className="t-display-sm mt-10">Cookies that make the site work</h2>
          <p className="t-body text-ink-muted mt-2">
            These are always on, because signing in and the shortlist cannot work without them.
          </p>
          <table className="border-hairline mt-4 w-full border-y text-left">
            <thead className="bg-paper-sunken">
              <tr>
                <th className="t-label text-ink-muted px-3 py-2">Name</th>
                <th className="t-label text-ink-muted px-3 py-2">What it does</th>
                <th className="t-label text-ink-muted px-3 py-2">Kept for</th>
              </tr>
            </thead>
            <tbody className="divide-hairline divide-y">
              {OWN.map((c) => (
                <tr key={c.name}>
                  <td className="t-data px-3 py-3 align-top">{c.name}</td>
                  <td className="t-body px-3 py-3 align-top">{c.what}</td>
                  <td className="t-data px-3 py-3 align-top whitespace-nowrap">{c.kept}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="t-display-sm mt-10">Google Analytics</h2>
          <p className="t-body text-ink-muted mt-2">
            If you allow it, Google Analytics stores cookies whose names start with{" "}
            <span className="t-data">_ga</span>, kept for up to two years, and tells us which pages
            are read, how people arrive and what device they use. We see counts, not people: no
            name, email, phone number or message is ever sent to Google. If you decline, no
            analytics cookie is stored, and Google receives at most an anonymous signal that a page
            was viewed. Advertising features are switched off either way.
          </p>
          {ga ? (
            <ConsentChoice />
          ) : (
            <p className="t-body text-ink mt-6">Google Analytics is not running on this address.</p>
          )}

          <h2 className="t-display-sm mt-10">Questions</h2>
          <p className="t-body text-ink-muted mt-2">
            Write to{" "}
            <a
              href="mailto:hello@oohworks.co"
              className="text-navy-700 underline underline-offset-2"
            >
              hello@oohworks.co
            </a>
            .
          </p>
        </div>
      </Container>
    </Shell>
  );
}
