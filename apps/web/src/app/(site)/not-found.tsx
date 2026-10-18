import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[560px] text-center">
          <h1 className="t-display-md">This page does not exist</h1>
          <p className="text-ink-muted t-body mt-3">
            Either the address is wrong, or this area does not yet hold enough listed sites to have
            a page. Try a search, or start from the map.
          </p>
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
