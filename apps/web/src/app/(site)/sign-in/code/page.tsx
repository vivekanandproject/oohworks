import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
import { CENTER, PageHead } from "@/components/owners/Frame";
import { ownerByEmail, ownerEmail } from "@/lib/owners/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in with a code",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, { t: string; d: string }> = {
  email: { t: "That email did not look right.", d: "Check it and try again." },
  busy: { t: "Too many tries in a short time.", d: "Wait a minute, then try again." },
  send: { t: "We could not send the code just now.", d: "Try again in a minute." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** The way in for an owner who has forgotten their password, or never set one: a code by email. */
export default async function SignInCodePage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const signedIn = await ownerEmail();
  if (signedIn) redirect((await ownerByEmail(signedIn)) ? "/owner/" : "/owner/company/");
  const error = ERRORS[one(q.error)];

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <div className={CENTER}>
          <PageHead center eyebrow="Sign in" title="Sign in with a code">
            Forgotten your password, or never set one? We send a six-digit code to your work email,
            and you can choose a new password once you are in.
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
            className="border-hairline bg-paper-raised mt-6 flex flex-col gap-5 rounded-md border p-5 sm:p-6"
            data-section="signin-code-form"
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
            <button type="submit" className="oh-btn primary lg w-full" data-action="signin-code">
              Send a code
            </button>
          </form>
          <p className="t-body text-ink-muted mt-5 text-center">
            Remembered it?{" "}
            <a href="/sign-in/" className="oh-link">
              Sign in with your password
            </a>
            .
          </p>
        </div>
      </Container>
    </Shell>
  );
}
