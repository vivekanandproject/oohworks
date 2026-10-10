import type { Metadata } from "next";
import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { BriefingBand } from "@/components/editorial/PieceBits";

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
        <div className="max-w-[620px]">
          {error ? (
            <>
              <div className="oh-toast error" role="alert">
                <span className="dot" />
                <div>
                  <div className="t">That email did not look right.</div>
                  <div className="d">Check it and try again; nothing was saved.</div>
                </div>
              </div>
              <div className="mt-6">
                <BriefingBand from="/newsroom/" id="brief-retry" />
              </div>
            </>
          ) : (
            <>
              <h1 className="t-display-lg">You are on the list</h1>
              <p className="t-body-lg text-ink-muted mt-4" role="status">
                The first issue of the daily briefing reaches you when it starts. One email, and
                every issue carries a one-click way out.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/newsroom/" variant="primary">
                  Back to the newsroom
                </Button>
              </div>
            </>
          )}
        </div>
      </Container>
    </Shell>
  );
}
