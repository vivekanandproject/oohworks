import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { EnquirySummary } from "@/components/sites/EnquirySummary";
import { devCode, findEnquiry } from "@/lib/sites/enquiries";
import { MAX_ATTEMPTS, isReference, maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Confirm it's you",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const ref = one(q.ref);
  if (!isReference(ref)) notFound();
  const found = await findEnquiry(ref);
  if (!found) notFound();
  const { enquiry, site, owner } = found;
  if (enquiry.status !== "pending") redirect(`/enquire/sent/?ref=${ref}`);

  const left = Math.max(0, MAX_ATTEMPTS - (enquiry.attempts ?? 0));
  const ERRORS: Record<string, { t: string; d: string }> = {
    wrong: {
      t: "That code did not match.",
      d: `Check the email and try again. ${left} ${left === 1 ? "try" : "tries"} left.`,
    },
    expired: { t: "That code has run out.", d: "Send a new one below. Your enquiry is kept." },
    locked: { t: "Too many wrong tries.", d: "Send a new code below. Your enquiry is kept." },
    busy: { t: "Too many tries in a short time.", d: "Wait a minute, then try again." },
    wait: {
      t: "A code was sent a moment ago.",
      d: "Give it half a minute before asking for another.",
    },
    send: { t: "We could not send it just now.", d: "Nothing was lost. Try again in a minute." },
  };
  const error = ERRORS[one(q.error)];
  const resent = one(q.resent) === "1";
  const shown = await devCode(enquiry.email);

  return (
    <Shell active="find">
      <Container className="py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,380px)] lg:justify-between">
          <div className="min-w-0">
            <p className="t-label text-ink-muted">Enquiry · step 2 of 2</p>
            <h1 className="t-display-md mt-2">Confirm it&rsquo;s you</h1>
            <p className="t-body text-ink-muted mt-2" data-section="code-sent-to">
              A code is on its way to{" "}
              <span className="text-ink font-mono">{maskEmail(enquiry.email)}</span>. It works for
              ten minutes.
            </p>

            {error ? (
              <div className="oh-toast error mt-5" role="alert" data-section="confirm-error">
                <span className="dot" />
                <div>
                  <div className="t">{error.t}</div>
                  <div className="d">{error.d}</div>
                </div>
              </div>
            ) : null}
            {resent && !error ? (
              <div className="oh-toast success mt-5" role="status" data-section="confirm-resent">
                <span className="dot" />
                <div>
                  <div className="t">A new code is on its way.</div>
                  <div className="d">The earlier one no longer works.</div>
                </div>
              </div>
            ) : null}
            {shown ? (
              <p
                className="t-small border-hairline bg-lit-tint text-ink mt-5 rounded-sm border px-3 py-2"
                data-section="dev-code"
              >
                Development only: no email service is set up on this machine, so the code is shown
                here. It is <span className="font-mono font-medium">{shown}</span>. The email itself
                is in the admin, under Operations, Outbox.
              </p>
            ) : null}

            <form
              method="post"
              action="/api/enquire/confirm/"
              className="mt-6 flex flex-col gap-4"
              data-section="confirm-form"
            >
              <input type="hidden" name="ref" value={ref} />
              <div>
                <label htmlFor="enq-code" className="oh-label block">
                  Six-digit code
                </label>
                <input
                  id="enq-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,7}"
                  maxLength={7}
                  required
                  autoFocus
                  className="oh-input lg data mt-1 max-w-[220px] tracking-[0.3em]"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="oh-btn accent lg w-full sm:w-auto"
                  data-action="confirm"
                >
                  Confirm and send
                </button>
              </div>
            </form>

            <form
              method="post"
              action="/api/enquire/resend/"
              className="mt-4"
              data-section="resend-form"
            >
              <input type="hidden" name="ref" value={ref} />
              <button type="submit" className="oh-btn ghost sm">
                Send the code again
              </button>
            </form>
            <p className="t-small text-ink-muted mt-4">
              Asked once. After that this browser is remembered for 30 days.
            </p>
          </div>

          <div className="order-first lg:order-none">
            <EnquirySummary site={site} owner={owner} now={Date.now()} />
          </div>
        </div>
      </Container>
    </Shell>
  );
}
