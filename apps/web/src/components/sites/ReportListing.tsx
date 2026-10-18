import { Button } from "@ohworks/ui";
import { REPORT_REASONS } from "@/payload/collections/ListingReports";

const PROBLEMS: Record<string, string> = {
  reason: "Choose what is wrong.",
  email: "That email address does not look right. Leave it empty if you do not need a reply.",
  site: "This listing could not be found. It may have been taken down already.",
};

/**
 * "Report this listing", at the foot of a site page: a plain form that works without script and
 * reaches the team's queue in the admin (/api/report/). Open when it has something to say.
 */
export function ReportListing({
  unitId,
  path,
  sent,
  problem,
}: {
  unitId: string;
  /** The site page's own address, to come back to. */
  path: string;
  sent: boolean;
  problem: string | null;
}) {
  if (sent)
    return (
      <p
        id="report"
        className="t-small text-ink-muted mt-10 scroll-mt-28"
        role="status"
        data-section="report"
      >
        Thank you. The team checks every report within two days.
      </p>
    );
  const error = problem ? (PROBLEMS[problem] ?? null) : null;
  return (
    <details
      id="report"
      className="mt-10 max-w-[560px] scroll-mt-28"
      data-section="report"
      {...(error ? { open: true } : {})}
    >
      <summary className="t-small text-ink-muted flex min-h-11 cursor-pointer items-center">
        Something wrong with this listing? <span className="oh-link">Report it</span>
      </summary>
      <form method="post" action="/api/report/" className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={unitId} />
        <input type="hidden" name="return" value={path} />
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />
        {error ? (
          <p className="text-critical font-medium" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor="report-reason" className="oh-label block">
            What is wrong?
          </label>
          <select
            id="report-reason"
            name="reason"
            required
            className="oh-input w-full"
            defaultValue=""
          >
            <option value="" disabled>
              Choose one
            </option>
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="report-message" className="oh-label block">
            What did you see? <span className="text-ink-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="report-message"
            name="message"
            rows={3}
            maxLength={2000}
            className="oh-input w-full"
          />
        </div>
        <div>
          <label htmlFor="report-email" className="oh-label block">
            Your email, if you would like to hear back{" "}
            <span className="text-ink-muted font-normal">(optional)</span>
          </label>
          <input
            id="report-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="oh-input w-full"
          />
        </div>
        <div>
          <Button variant="secondary" type="submit">
            Send the report
          </Button>
        </div>
      </form>
    </details>
  );
}
