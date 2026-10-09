import type { Metadata } from "next";
import { Button, Container, EmptyState, SearchField } from "@ohworks/ui";
import { Shell } from "@/components/Shell";

/** Search results are never indexed; hubs and unit pages are the pages that rank. */
export const metadata: Metadata = {
  title: "Find sites",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return (
    <Shell active="find">
      <Container className="py-10 lg:py-14">
        <h1 className="t-display-lg">Find sites</h1>
        <p className="text-ink-muted t-body mt-3 max-w-[56ch]">
          Search by place, road, format or size. Results show real photos, exact coordinates and the
          verified owner.
        </p>
        <div className="mt-6 max-w-[760px]">
          <SearchField defaultValue={query} size="md" />
        </div>
        <div className="mt-10 max-w-[760px]">
          <EmptyState
            icon="pin"
            title={query ? `No sites match “${query}” yet` : "No sites listed yet"}
            actions={
              <>
                <Button href="/for-owners/" variant="primary" size="sm">
                  List your sites
                </Button>
                <Button href="/guides/" variant="ghost" size="sm">
                  Read the cost guides
                </Button>
              </>
            }
          >
            The first verified sites go live city by city with the founding owners. Try a wider
            area, or come back when your city opens.
          </EmptyState>
        </div>
      </Container>
    </Shell>
  );
}
