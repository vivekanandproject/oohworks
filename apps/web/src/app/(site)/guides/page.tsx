import type { Metadata } from "next";
import { Container, EmptyState } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { alternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Cost guides by city and format, explainers for first-time advertisers, and the owner academy on permits, pricing and listing well.",
  alternates: alternates("/guides/"),
};

const PILLARS = [
  {
    t: "Buyer guides",
    d: "What a hoarding costs in each city and format, how to measure a first campaign, and how to compare sites.",
  },
  {
    t: "Owner academy",
    d: "Permits by city, site leases, pricing a board, converting to digital, and joining programmatic exchanges.",
  },
  {
    t: "ohworks data",
    d: "A quarterly price index by city and format, built from live listings and published with its method.",
  },
];

export default function GuidesPage() {
  return (
    <Shell>
      <Container className="py-10 lg:py-14">
        <h1 className="t-display-lg">Guides</h1>
        <p className="text-ink-muted t-body-lg mt-3 max-w-[60ch]">
          Every guide carries dated, sourced figures and embeds the live sites it talks about. Cost
          guides publish for a city once it holds at least 20 real listings.
        </p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <li key={p.t} className="border-hairline bg-paper-raised rounded-md border p-5">
              <h2 className="t-display-sm">{p.t}</h2>
              <p className="text-ink-muted t-body mt-2">{p.d}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 max-w-[760px]">
          <EmptyState icon="hoarding" title="The first guides land with the first cities">
            Bengaluru is first. Each city guide is written by a person and refreshed every quarter
            from live listing data.
          </EmptyState>
        </div>
      </Container>
    </Shell>
  );
}
