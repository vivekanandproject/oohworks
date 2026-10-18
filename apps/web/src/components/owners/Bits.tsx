import type { ReactNode } from "react";
import { STATE_LABEL, type SiteState } from "@/lib/owners/progress";

/** Each state in the badge kind that means it: waiting is pending, held back is critical, live is verified. */
const TONE: Record<SiteState, string> = {
  draft: "neutral",
  review: "pending",
  changes: "critical",
  live: "verified",
};

/** Where a site stands, in a word. */
export function StateTag({ state }: { state: SiteState }) {
  return (
    <span className={`oh-badge ${TONE[state]}`} data-state={state}>
      {STATE_LABEL[state]}
    </span>
  );
}

export function Notice({
  tone,
  title,
  children,
  section,
}: {
  tone: "success" | "error" | "warning";
  title: string;
  children?: ReactNode;
  section?: string;
}) {
  return (
    <div
      className={`oh-toast ${tone}`}
      role={tone === "error" ? "alert" : "status"}
      data-section={section}
    >
      <span className="dot" />
      <div>
        <div className="t">{title}</div>
        {children ? <div className="d">{children}</div> : null}
      </div>
    </div>
  );
}

/** A completeness score out of 100, as a bar and a number. */
export function Score({ value }: { value: number }) {
  return (
    <div className="min-w-[120px]">
      <div className="bg-paper-sunken h-1.5 overflow-hidden rounded-full" aria-hidden="true">
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
