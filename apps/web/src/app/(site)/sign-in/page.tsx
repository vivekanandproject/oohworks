import type { Metadata } from "next";
import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <Shell>
      <Container className="py-12 lg:py-16">
        <div className="border-hairline bg-paper-raised max-w-[520px] rounded-md border p-6">
          <h1 className="t-display-md">Sign in</h1>
          <p className="text-ink-muted t-body mt-3">
            Owner and agency accounts open with the Bengaluru launch. Until then, we list sites for
            owners by email and send you the links.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/for-owners/" variant="primary">
              List your sites
            </Button>
            <Button href="/" variant="ghost">
              Back to the map
            </Button>
          </div>
        </div>
      </Container>
    </Shell>
  );
}
