import type { ReactNode } from "react";
import { STATE_LABEL, type SiteState } from "@/lib/owners/progress";

const TONE: Record<SiteState, string> = {
  draft: "neutral",
  review: "booked",
  changes: "fresh",
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

const STEPS = ["Your details", "Confirm your email", "Add your sites", "We check, then live"];

/** Where someone is on the way to their first live site. The number and the words carry it, not the colour. */
export function Steps({ at }: { at: 1 | 2 | 3 | 4 }) {
  return (
    <div data-section="steps">
      <p className="t-label text-ink-muted sm:hidden">
        Step {at} of {STEPS.length} · {STEPS[at - 1]}
      </p>
      <ol
        className="t-small hidden flex-wrap items-center gap-x-6 gap-y-2 sm:flex"
        aria-label="Steps to list your sites"
      >
        {STEPS.map((label, i) => {
          const n = i + 1;
          const now = n === at;
          const done = n < at;
          return (
            <li
              key={label}
              aria-current={now ? "step" : undefined}
              className={`flex items-center gap-2 ${now || done ? "text-ink" : "text-ink-muted"}`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[12px] leading-none ${now ? "bg-navy text-on-navy" : done ? "bg-navy-200 text-ink" : "border-hairline-strong border"}`}
              >
                {n}
              </span>
              <span className={now ? "font-semibold" : ""}>
                {label}
                {done ? <span className="sr-only">, done</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
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
      className="border-hairline flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-4"
      data-section="owner-bar"
    >
      <nav aria-label="Your account" className="t-body flex flex-wrap gap-x-5 gap-y-1">
        <a href="/owner/" className="oh-link" aria-current={here === "sites" ? "page" : undefined}>
          Your sites
        </a>
        <a
          href="/owner/company/"
          className="oh-link"
          aria-current={here === "company" ? "page" : undefined}
        >
          Company details
        </a>
      </nav>
      <form
        method="post"
        action="/api/owner/signout/"
        className="t-small text-ink-muted flex flex-wrap items-center gap-3"
      >
        <span>
          {name} · <span className="font-mono">{email}</span>
        </span>
        <button type="submit" className="oh-link cursor-pointer">
          Sign out
        </button>
      </form>
    </div>
  );
}
