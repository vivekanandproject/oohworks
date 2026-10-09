import type { Metadata } from "next";
import { Container, EmptyState } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { alternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "News",
  description:
    "Independent news, analysis and data on out-of-home advertising in India and beyond, with every figure sourced and dated.",
  alternates: alternates("/news/"),
};

export default function NewsPage() {
  return (
    <Shell active="news">
      <Container className="py-10 lg:py-14">
        <h1 className="t-display-lg">News</h1>
        <p className="text-ink-muted t-body-lg mt-3 max-w-[60ch]">
          Independent news and analysis for owners and agencies: contracts, people, regulation and
          the numbers behind them. Sponsored pieces are always labelled and never sit in news.
        </p>
        <div className="mt-10 max-w-[760px]">
          <EmptyState icon="enquiry" title="The newsroom opens with the India launch">
            A daily trade briefing and a weekly buyer digest follow. Write to press@ohworks.com with
            a story or a correction.
          </EmptyState>
        </div>
      </Container>
    </Shell>
  );
}
