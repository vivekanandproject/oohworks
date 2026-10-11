import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@ohworks/ui";
import { PasswordField } from "@/components/PasswordField";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
import { CENTER, PageHead } from "@/components/owners/Frame";
import { ownerByEmail, ownerEmail } from "@/lib/owners/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Media owners sign in to ohworks with their work email and password. Buyers need no account.",
  robots: { index: false, follow: true },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** Where an owner comes back in: their user name, which is their work email, and their password. */
export default async function SignInPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const signedIn = await ownerEmail();
  if (signedIn) redirect((await ownerByEmail(signedIn)) ? "/owner/" : "/owner/company/");
  const error = one(q.error);
  const typed = one(q.email).slice(0, 254);

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <div className={CENTER}>
          <PageHead center eyebrow="For media owners" title="Sign in">
            Use your work email and your password.
          </PageHead>

          {error === "match" ? (
            <div className="mt-5">
              <Notice
                tone="error"
                title="That user name and password do not match."
                section="signin-error"
              >
                Check both and try again. If you have forgotten the password,{" "}
                <a href="/sign-in/code/" className="oh-link">
                  sign in with a code
                </a>
                .
              </Notice>
            </div>
          ) : null}
          {error === "locked" ? (
            <div className="mt-5">
              <Notice tone="error" title="Too many wrong tries." section="signin-error">
                The password is not accepted for the next 15 minutes. You can still{" "}
                <a href="/sign-in/code/" className="oh-link">
                  sign in with a code
                </a>{" "}
                sent to your email.
              </Notice>
            </div>
          ) : null}
          {error === "busy" ? (
            <div className="mt-5">
              <Notice tone="error" title="Too many tries in a short time." section="signin-error">
                Wait a minute, then try again.
              </Notice>
            </div>
          ) : null}

          <form
            method="post"
            action="/api/owner/signin/"
            className="border-hairline bg-paper-raised mt-6 flex flex-col gap-5 rounded-md border p-5 sm:p-6"
            data-section="signin-form"
          >
            <div>
              <label htmlFor="signin-user" className="oh-label block">
                User name
              </label>
              <input
                id="signin-user"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={typed}
                placeholder="you@yourcompany.com"
                aria-describedby="signin-user-help"
                autoFocus={!typed}
                className="oh-input mt-1"
              />
              <p id="signin-user-help" className="t-small text-ink-muted mt-1">
                Your work email.
              </p>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="signin-password" className="oh-label">
                  Password
                </label>
                <a href="/sign-in/code/" className="oh-link t-small" data-action="forgot">
                  Forgot it?
                </a>
              </div>
              <PasswordField id="signin-password" required focus={Boolean(typed)} />
            </div>
            <button type="submit" className="oh-btn primary lg w-full" data-action="signin">
              Sign in
            </button>
          </form>

          <p className="t-body text-ink-muted mt-5 text-center" data-section="signin-new">
            Not listed yet?{" "}
            <a href="/list-your-sites/" className="oh-link">
              List your sites free
            </a>
            .
          </p>
          <p
            className="border-hairline t-small text-ink-muted mt-6 border-t pt-5 text-center"
            data-section="signin-buyers"
          >
            Looking for sites, not listing them? You need no account.{" "}
            <a href="/search/" className="oh-link">
              Find sites
            </a>
            .
          </p>
        </div>
      </Container>
    </Shell>
  );
}
