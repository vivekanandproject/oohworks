import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
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
      <Container className="py-10 lg:py-16">
        <div className="max-w-[560px]">
          <p className="t-label text-ink-muted">For media owners</p>
          <h1 className="t-display-md mt-2">Sign in</h1>
          <p className="t-body text-ink-muted mt-2">
            Enter the work email you listed with. We send a six-digit code to it. There is no
            password.
          </p>
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
            className="mt-6"
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
            <label htmlFor="signin-email" className="oh-label block">
              Your work email
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@yourcompany.com"
                autoFocus
                className="oh-input lg flex-1"
              />
              <button type="submit" className="oh-btn primary lg" data-action="signin">
                Send me a code
              </button>
            </div>
          </form>
          <p className="t-body text-ink-muted mt-6" data-section="signin-new">
            Not listed yet?{" "}
            <a href="/list-your-sites/" className="oh-link">
              List your sites free
            </a>
            . It starts the same way.
          </p>
        </div>

        <section
          className="border-hairline bg-paper-raised mt-10 max-w-[560px] rounded-md border p-5"
          data-section="signin-buyers"
        >
          <h2 className="t-display-sm">Looking for sites, not listing them?</h2>
          <p className="t-body text-ink-muted mt-2">
            You need no account. Your shortlist is kept in this browser. When you send an enquiry we
            confirm your email with a code, and the owner&rsquo;s reply comes to you by email with a
            link back to the conversation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/search/" variant="secondary" size="sm">
              Find sites
            </Button>
            <Button href="/shortlist/" variant="ghost" size="sm">
              Your shortlist
            </Button>
          </div>
        </section>
      </Container>
    </Shell>
  );
}
