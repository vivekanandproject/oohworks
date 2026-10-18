import { Button, Container } from "@ohworks/ui";
import { PageHead } from "@/components/owners/Frame";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[560px] text-center">
          <PageHead center eyebrow="Page not found" title="This page does not exist">
            Either the address is wrong, or this area does not yet hold enough listed sites to have
            a page. Try a search, or start from the map.
          </PageHead>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/search/" variant="primary">
              Find sites
            </Button>
            <Button href="/" variant="ghost">
              Go to the homepage
            </Button>
          </div>
        </div>
      </Container>
    </Shell>
  );
}
