import { Badge, type BadgeKind } from "@ohworks/ui";
import { STATE_LABEL, type SiteState } from "@/lib/owners/progress";

/** Each state in the badge kind that means it: waiting is pending, held back is critical, live is verified. */
const TONE: Record<SiteState, BadgeKind> = {
  draft: "neutral",
  review: "pending",
  changes: "critical",
  live: "verified",
};

/** Where a site stands, in a word. */
export function StateTag({ state }: { state: SiteState }) {
  return (
    <Badge kind={TONE[state]} icon={false} data-state={state}>
      {STATE_LABEL[state]}
    </Badge>
  );
}

// The owner pages import Notice from here; it is the shared one, so every notice looks the same.
export { Notice } from "@ohworks/ui";

/** A completeness score out of 100, as a bar and a number. */
export function Score({ value }: { value: number }) {
  return (
    <div className="min-w-[120px]">
      <div className="bg-paper-sunken rounded-pill h-1.5 overflow-hidden" aria-hidden="true">
        <div
          className="bg-navy-700 h-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="t-data-sm text-ink-muted mt-1">{value} of 100</p>
    </div>
  );
}

/** The links every owner page carries: back to the list, the company, and signing out. */
export function OwnerBar({
  name,
  email,
  here,
}: {
  name: string;
  email: string;
  here: "sites" | "company" | "import" | "kit" | "site";
}) {
  return (
    <div
      className="border-hairline flex flex-wrap items-center gap-x-6 border-b pb-3"
      data-section="owner-bar"
    >
      <nav aria-label="Your account" className="t-body flex flex-wrap gap-x-5">
        <a
          href="/owner/"
          className="oh-link inline-flex min-h-11 items-center"
          aria-current={here === "sites" ? "page" : undefined}
        >
          Your sites
        </a>
        <a
          href="/owner/company/"
          className="oh-link inline-flex min-h-11 items-center"
          aria-current={here === "company" ? "page" : undefined}
        >
          Company details
        </a>
      </nav>
      {/* On a phone the controls share one row and who is signed in sits under them on a line of its
          own; from 640px everything is one row. */}
      <p
        className="t-small text-ink-muted order-last w-full truncate sm:order-none sm:ml-auto sm:w-auto"
        title={`${name} · ${email}`}
      >
        {name} · <span className="font-mono">{email}</span>
      </p>
      <form method="post" action="/api/owner/signout/" className="t-small ml-auto sm:ml-0">
        <button type="submit" className="oh-link inline-flex min-h-11 cursor-pointer items-center">
          Sign out
        </button>
      </form>
    </div>
  );
}
