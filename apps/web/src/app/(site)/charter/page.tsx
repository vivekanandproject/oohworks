import type { Metadata } from "next";
import { Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { CHARTER } from "@/lib/site";
import { alternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The charter",
  description:
    "Five things OOHWORKS will never do: sell media, set prices, take the client, contact a buyer's clients, or show a number without its source.",
  alternates: alternates("/charter/"),
};

export default function CharterPage() {
  return (
    <Shell>
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[680px]">
          <p className="t-label text-ink-muted">The charter</p>
          <h1 className="t-display-lg mt-3">Five things we will never do</h1>
          <p className="text-ink-muted t-body-lg mt-5">
            The best-known listings marketplaces drifted into agency work and started selling
            against the owners who listed with them. These rules keep OOHWORKS neutral. They are
            published, and they do not change.
          </p>
          <ol className="divide-hairline border-hairline mt-10 divide-y border-y">
            {CHARTER.map((rule, i) => (
              <li key={rule.title} className="flex gap-5 py-6">
                <span className="t-data-lg text-ink-faint w-8 shrink-0">{i + 1}</span>
                <div>
                  <h2 className="t-display-sm">{rule.title}</h2>
                  <p className="text-ink-muted t-body-lg mt-2">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <blockquote className="border-navy text-ink t-body-lg mt-10 border-l-2 pl-5">
            {NEUTRALITY_LINE}
          </blockquote>
          <p className="text-ink-muted t-body mt-6">
            Buyers use OOHWORKS free. Contract, invoice and payment stay between buyer and owner;
            OOHWORKS verifies the buyer and routes the request.
          </p>
        </div>
      </Container>
    </Shell>
  );
}
