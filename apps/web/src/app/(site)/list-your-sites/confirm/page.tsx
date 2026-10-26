import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Container, Note } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
import { Aside, CENTER, Card, FORM_GRID, PageHead, StepsCard } from "@/components/owners/Frame";
import { devOwnerCode, findCode } from "@/lib/owners/server";
import { MAX_ATTEMPTS, maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Confirm it's you",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function OwnerConfirmPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const token = one(q.t);
  const row = await findCode(token);
  if (!row || row.usedAt) redirect("/list-your-sites/?error=again");
  const left = Math.max(0, MAX_ATTEMPTS - (row.attempts ?? 0));
  const ERRORS: Record<string, { t: string; d: string }> = {
    wrong: {
      t: "That code did not match.",
      d: `Check the email and try again. ${left} ${left === 1 ? "try" : "tries"} left.`,
    },
    expired: { t: "That code has run out.", d: "Send a new one below." },
    locked: { t: "Too many wrong tries.", d: "Send a new code below." },
    busy: { t: "Too many tries in a short time.", d: "Wait a minute, then try again." },
    wait: {
      t: "A code was sent a moment ago.",
      d: "Give it half a minute before asking for another.",
    },
    send: { t: "We could not send it just now.", d: "Try again in a minute." },
  };
  const error = ERRORS[one(q.error)];
  const shown = await devOwnerCode(row.email);
  const signIn = one(q.via) === "signin";

  const head = (
    <PageHead
      center={signIn}
      eyebrow={signIn ? "Sign in" : "List your sites · step 2 of 4"}
      title={<>Confirm it&rsquo;s you</>}
    >
      <span data-section="code-sent-to">
        A code is on its way to <span className="text-ink font-mono">{maskEmail(row.email)}</span>.
        It works for ten minutes.
      </span>
    </PageHead>
  );
  const notes = (
    <>
      {error ? (
        <div className="mt-5">
          <Notice tone="error" title={error.t} section="confirm-error">
            {error.d}
          </Notice>
        </div>
      ) : one(q.resent) === "1" ? (
        <div className="mt-5">
          <Notice tone="success" title="A new code is on its way." section="confirm-resent">
            The earlier one no longer works.
          </Notice>
        </div>
      ) : null}
      {shown ? (
        <Note section="dev-code" className="mt-5">
          Development only: no email service is set up on this machine, so the code is shown here.
          It is <span className="font-mono font-medium">{shown}</span>. The email itself is in the
          admin, under Operations, Outbox.
        </Note>
      ) : null}
    </>
  );
  // Signing in, the code sits in a box in the middle of the page like the rest of that flow.
  const fields = (
    <>
      <input type="hidden" name="t" value={token} />
      {signIn ? <input type="hidden" name="via" value="signin" /> : null}
      <div>
        <label htmlFor="owner-code" className="oh-label block">
          Six-digit code
        </label>
        <input
          id="owner-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          className={`oh-input lg data mt-1 tracking-[0.3em] ${signIn ? "text-center" : "max-w-[220px]"}`}
        />
      </div>
      <div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className={`w-full ${signIn ? "" : "sm:w-auto"}`}
          data-action="confirm"
        >
          {signIn ? "Confirm and sign in" : "Confirm and continue"}
        </Button>
      </div>
    </>
  );
  const again = (
    <form
      method="post"
      action="/api/owner/resend/"
      className={signIn ? "mt-4 text-center" : "mt-4"}
    >
      <input type="hidden" name="t" value={token} />
      {signIn ? <input type="hidden" name="via" value="signin" /> : null}
      <Button variant="ghost" size="sm" type="submit">
        Send the code again
      </Button>
    </form>
  );

  if (signIn)
    return (
      <Shell active="owners">
        <Container className="py-8 lg:py-12">
          <div className={CENTER}>
            {head}
            {notes}
            <form
              method="post"
              action="/api/owner/confirm/"
              className="oh-box mt-6 flex flex-col gap-5"
              data-section="confirm-form"
            >
              {fields}
            </form>
            {again}
            <p className="t-small text-ink-muted mt-4 text-center">
              After this, this browser is remembered for 30 days.{" "}
              <a href="/sign-in/" className="oh-link">
                Use your password instead
              </a>
              .
            </p>
          </div>
        </Container>
      </Shell>
    );

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <div className={FORM_GRID}>
          <div className="min-w-0">
            {head}
            {notes}
            <form
              method="post"
              action="/api/owner/confirm/"
              className="mt-6 flex flex-col gap-4"
              data-section="confirm-form"
            >
              {fields}
            </form>
            {again}
            <p className="t-small text-ink-muted mt-4">
              After this, this browser is remembered for 30 days. Wrong address?{" "}
              <a href="/list-your-sites/" className="oh-link">
                Start again
              </a>
              .
            </p>
          </div>

          <Aside label="About the code">
            <StepsCard at={2} />
            <Card title="No code yet?" section="code-help">
              <ul className="t-body text-ink list-disc space-y-1 pl-5">
                <li>It can take a minute to arrive.</li>
                <li>Look in your spam or promotions folder.</li>
                <li>You can send it again, once every half minute.</li>
              </ul>
            </Card>
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
