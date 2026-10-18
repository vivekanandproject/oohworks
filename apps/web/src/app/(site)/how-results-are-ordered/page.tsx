import type { Metadata } from "next";
import { Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { alternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How results are ordered",
  description:
    "The order of ohworks search results is not for sale. It follows how well a site fits the search, how complete and current its listing is, and what has been checked.",
  alternates: alternates("/how-results-are-ordered/"),
};

const FACTORS = [
  {
    t: "How well it fits your search",
    d: "The place, format, size, price and dates you asked for come first. A site that misses a filter is not shown at all.",
  },
  {
    t: "How complete the listing is",
    d: "Real photographs, a price or a clear “price on request”, an audience figure with its source, artwork details and a landmark each add to a completeness score out of 100.",
  },
  {
    t: "How current it is",
    d: "Sites whose owners confirmed availability or added photographs recently rank above ones left untouched.",
  },
  {
    t: "What has been checked",
    d: "A verified owner, a verified location and a permit on file each count.",
  },
  {
    t: "How quickly the owner replies",
    d: "Owners whose median reply is under a day rank higher, because a fast answer is what buyers ask for most.",
  },
  { t: "What is free", d: "A site booked for now sits a little lower than one that is available." },
];

export default function OrderPage() {
  return (
    <Shell active="find">
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[680px]">
          <p className="t-label text-ink-muted">Find sites</p>
          <h1 className="t-display-lg mt-3">How results are ordered</h1>
          <p className="t-body-lg text-ink-muted mt-5">
            The order of search results is not for sale. &ldquo;Best match&rdquo; follows the six
            things below, in this order of weight. Owners can see exactly what earns a better place,
            and buyers can trust why a site is first.
          </p>
          <ol className="divide-hairline border-hairline mt-8 divide-y border-y">
            {FACTORS.map((f, i) => (
              <li key={f.t} className="flex gap-5 py-5">
                <span className="t-data-lg text-ink-faint w-8 shrink-0" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h2 className="t-display-sm">{f.t}</h2>
                  <p className="t-body text-ink-muted mt-1">{f.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <h2 className="t-display-sm mt-10">What never changes the order</h2>
          <p className="t-body text-ink-muted mt-2">
            Whether an owner pays ohworks, and whether they show a price. A private price is the
            owner&rsquo;s choice. When paid placement exists, it sits in slots labelled
            &ldquo;Featured · paid placement&rdquo;, limited in number, and never mixed into best
            match.
          </p>
          <h2 className="t-display-sm mt-8">Other ways to sort</h2>
          <p className="t-body text-ink-muted mt-2">
            Price from low to high, newest, most recently confirmed and largest audience. Sites that
            show no price follow the priced ones when sorting by price, and sites with no sourced
            audience figure follow the rest when sorting by audience.
          </p>
          <blockquote className="t-body-lg border-navy text-ink mt-10 border-l-2 pl-5">
            {NEUTRALITY_LINE}
          </blockquote>
        </div>
      </Container>
    </Shell>
  );
}
