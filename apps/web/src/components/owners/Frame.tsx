import type { ReactNode } from "react";

/**
 * The owner's area uses the two page frames the rest of the site already has, and nothing else.
 *
 * A form page and a page of content share one frame, the public site page's: the form or content
 * in seven parts on the left, help or a panel in four on the right, 32px apart. A fixed 560 and
 * 380 left a 180px gutter between them on a wide screen (design audit, 19 Oct 2026).
 *
 * Within them: fields sit straight on the page, as they do on the enquiry form. A long form is
 * split by a rule and a heading, never by boxes. Boxes are for the panels beside a form and for a
 * tool that sits among other content. A box's title is inside it.
 */
export const CONTENT_GRID = "grid items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]";
export const FORM_GRID = CONTENT_GRID;

/**
 * A third frame, for the pages that only ask who you are: signing in, the code, a new password.
 * One narrow column in the middle of the page, with the fields in a box.
 */
export const CENTER = "mx-auto w-full max-w-[440px]";

/** The top of every page here: a small label, the title, and a line or two beneath. */
export function PageHead({
  eyebrow,
  title,
  children,
  status,
  center,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Shown to the right of the title on a wide screen, such as a state or a badge. */
  status?: ReactNode;
  /** For the centred frame. */
  center?: boolean;
}) {
  if (center)
    return (
      <div className="text-center">
        <p className="t-label text-ink-muted">{eyebrow}</p>
        <h1 className="t-display-md mt-2">{title}</h1>
        {children ? <div className="t-body text-ink-muted mt-2">{children}</div> : null}
      </div>
    );
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <p className="t-label text-ink-muted">{eyebrow}</p>
        <h1 className="t-display-md mt-2">{title}</h1>
        {children ? (
          <div className="t-body text-ink-muted mt-2 max-w-[60ch]">{children}</div>
        ) : null}
      </div>
      {status}
    </div>
  );
}

/** The panels beside a form or a page of content. They stay in view on a wide screen. */
export function Aside({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-5 self-start lg:sticky lg:top-24" aria-label={label}>
      {children}
    </aside>
  );
}

/** A box with its title inside. */
export function Card({
  title,
  children,
  section,
}: {
  title: string;
  children: ReactNode;
  section?: string;
}) {
  return (
    <section
      className="border-hairline bg-paper-raised rounded-md border p-5"
      data-section={section}
    >
      <h2 className="t-display-sm">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** One part of a long form: a rule, a heading, and the fields beneath. */
export function FormSection({
  title,
  n,
  note,
  children,
  part,
}: {
  title: string;
  /** A number shown before the title, for a form whose parts are worked through in order. */
  n?: number;
  note?: ReactNode;
  children: ReactNode;
  part?: string | number;
}) {
  return (
    <section className="border-hairline border-t pt-6" data-part={part ?? n}>
      <h2 className="t-display-sm">
        {n ? <span className="text-ink-muted font-mono text-[15px]">{n} </span> : null}
        {title}
      </h2>
      {note ? <p className="t-small text-ink-muted mt-1">{note}</p> : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

const STEPS = [
  { t: "Your details", d: "Who is listing, and where enquiries should go." },
  { t: "Confirm your email", d: "We send a six-digit code to it, once, to check it is yours." },
  {
    t: "Add your sites",
    d: "One at a time, from our spreadsheet, or send your media kit and we enter them.",
  },
  {
    t: "We check, then live",
    d: "We check the owner, the location and the photographs. Each site goes live, or comes back with the reason.",
  },
];

/** The way to a first live site, with where the owner now stands. The words carry it, not the colour. */
export function StepsCard({ at }: { at: 1 | 2 | 3 | 4 }) {
  return (
    <Card title="The four steps" section="steps">
      <ol className="flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const n = i + 1;
          const now = n === at;
          const done = n < at;
          return (
            <li key={step.t} className="flex gap-3" aria-current={now ? "step" : undefined}>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[12px] leading-none ${now ? "bg-navy text-on-navy" : done ? "bg-navy-200 text-ink" : "border-hairline-strong text-ink-muted border"}`}
                aria-hidden="true"
              >
                {n}
              </span>
              <div>
                <p className="t-body-strong">
                  {step.t}
                  {now ? (
                    <span className="oh-badge neutral ml-2 align-middle">You are here</span>
                  ) : null}
                  {done ? (
                    <span className="t-small text-ink-muted ml-2 font-normal">Done</span>
                  ) : null}
                </p>
                <p className="t-small text-ink-muted mt-0.5">{step.d}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** What moves a listing up, said once and shown wherever an owner is filling a site in. */
export function BetterPlace() {
  return (
    <Card title="What earns a better place in results" section="better-place">
      <p className="t-body text-ink-muted">
        Real photographs, a price or a clear &ldquo;price on request&rdquo;, an audience figure with
        its source, a permit number and a landmark. Each adds to the score out of 100. Paying
        OOHWORKS never does.
      </p>
      <p className="mt-2">
        <a href="/how-results-are-ordered/" className="oh-link t-body">
          How results are ordered
        </a>
      </p>
    </Card>
  );
}

/** The two quicker ways, for an owner with more sites than a form is good for. */
export function ManySites() {
  return (
    <Card title="Many sites?" section="many-sites">
      <p className="t-body text-ink-muted">
        A spreadsheet takes up to 500 at a time. Or send your media kit and our team enters them for
        you.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="/owner/import/" className="oh-btn secondary">
          Upload a spreadsheet
        </a>
        <a href="/owner/kit/" className="oh-btn ghost">
          Send a media kit
        </a>
      </div>
    </Card>
  );
}
