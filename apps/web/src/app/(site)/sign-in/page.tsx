import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
import { Aside, Card, FORM_GRID, PageHead } from "@/components/owners/Frame";
import { ownerByEmail, ownerEmail } from "@/lib/owners/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Media owners sign in to ohworks with their work email and a six-digit code. Buyers need no account.",
  robots: { index: false, follow: true },
};

const ERRORS: Record<string, { t: string; d: string }> = {
  email: { t: "That email did not look right.", d: "Check it and try again." },
  busy: { t: "Too many tries in a short time.", d: "Wait a minute, then try again." },
  send: { t: "We could not send the code just now.", d: "Try again in a minute." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** Where a returning owner comes back in. It is the same emailed code as the first time, with no password. */
export default async function SignInPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const email = await ownerEmail();
  if (email) redirect((await ownerByEmail(email)) ? "/owner/" : "/owner/company/");
  const error = ERRORS[one(q.error)];

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <div className={FORM_GRID}>
          <div className="min-w-0">
            <PageHead eyebrow="For media owners" title="Sign in">
              Enter the work email you listed with. We send a six-digit code to it. There is no
              password.
            </PageHead>
            {error ? (
              <div className="mt-5">
                <Notice tone="error" title={error.t} section="signin-error">
                  {error.d}
                </Notice>
              </div>
            ) : null}
            <form
              method="post"
              action="/api/owner/start/"
              className="mt-6 flex flex-col gap-5"
              data-section="signin-form"
            >
              <input type="hidden" name="via" value="signin" />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="sr-only"
              />
              <div>
                <label htmlFor="signin-email" className="oh-label block">
                  Your work email
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@yourcompany.com"
                  autoFocus
                  className="oh-input mt-1"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="oh-btn primary lg w-full sm:w-auto"
                  data-action="signin"
                >
                  Send me a code
                </button>
              </div>
            </form>
            <p className="t-small text-ink-muted mt-4" data-section="signin-new">
              Not listed yet?{" "}
              <a href="/list-your-sites/" className="oh-link">
                List your sites free
              </a>
              .
            </p>
          </div>

          <Aside label="For buyers">
            <Card title="Looking for sites, not listing them?" section="signin-buyers">
              <p className="t-body text-ink-muted">
                You need no account. Your shortlist is kept in this browser. When you send an
                enquiry we confirm your email with a code, and the owner&rsquo;s reply comes to you
                by email with a link back to the conversation.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/search/" variant="secondary">
                  Find sites
                </Button>
                <Button href="/shortlist/" variant="ghost">
                  Your shortlist
                </Button>
              </div>
            </Card>
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
