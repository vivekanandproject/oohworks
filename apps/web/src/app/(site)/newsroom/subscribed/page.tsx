import type { Metadata } from "next";
import { Button, Container, Notice } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { BriefingBand } from "@/components/editorial/PieceBits";
import { PageHead } from "@/components/owners/Frame";

export const metadata: Metadata = {
  title: "The daily briefing",
  robots: { index: false, follow: true },
};

/** Where the sign-up form lands. One page for both outcomes keeps every other page free of form state. */
export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <Shell active="news">
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[620px]">
          {error ? (
            <>
              <Notice tone="error" title="That email did not look right.">
                Check it and try again; nothing was saved.
              </Notice>
              <div className="mt-6">
                <BriefingBand from="/newsroom/" id="brief-retry" />
              </div>
            </>
          ) : (
            <div className="text-center">
              <PageHead center eyebrow="The daily briefing" title="Check your email">
                <span role="status">
                  We sent a link to confirm your address. Once you open it, the first issue of the
                  daily briefing reaches you when it starts, and every issue carries a one-click way
                  out.
                </span>
              </PageHead>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button href="/newsroom/" variant="primary">
                  Back to the newsroom
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Shell>
  );
}
