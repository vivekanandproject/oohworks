import { Button, Container } from "@ohworks/ui";

/**
 * What the buyer has saved so far, kept in view while they browse. It is always in the page so that
 * saving a site can fill it in at once; it stays hidden while there is nothing to show.
 */
export function PlanBar({
  text,
  saved,
  compare,
}: {
  text: string;
  saved: number;
  compare: number;
}) {
  return (
    <div
      className="border-hairline bg-paper-raised border-t"
      hidden={saved === 0 && compare === 0}
      data-plan=""
      data-section="planbar"
    >
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
        <p className="t-body text-ink min-w-0 flex-1 truncate" data-plan-text="">
          {text}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            href="/compare/"

            hidden={compare === 0}
            data-plan-compare=""
            rel="nofollow"
          >
            Compare{" "}
            <span className="font-mono" data-plan-compare-n="">
              {compare}
            </span>
          </Button>
          <Button variant="primary" size="sm" href="/shortlist/" rel="nofollow">
            View shortlist
          </Button>
        </div>
        <p role="status" className="t-small text-ink w-full empty:hidden" data-list-status="" />
      </Container>
    </div>
  );
}
