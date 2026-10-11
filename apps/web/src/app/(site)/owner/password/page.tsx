import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { PasswordField } from "@/components/PasswordField";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { CENTER, PageHead } from "@/components/owners/Frame";
import { requireOwner } from "@/lib/owners/server";
import { maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your password",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, { t: string; d: string }> = {
  short: { t: "Choose a longer password.", d: "Use at least 8 characters." },
  long: { t: "That password is too long.", d: "Use 128 characters or fewer." },
  same: { t: "Choose a different password.", d: "It cannot be your own email." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** A signed-in owner sets the password they sign in with, or changes it. */
export default async function PasswordPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const error = ERRORS[one(q.error)];
  const afterCode = one(q.after) === "code";
  const has = Boolean(owner.passwordSetAt);

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="company" />
        <div className={`mt-8 ${CENTER}`}>
          <PageHead
            center
            eyebrow="Signing in"
            title={
              has
                ? afterCode
                  ? "Choose a new password"
                  : "Change your password"
                : "Create a password"
            }
          >
            {has
              ? "The new one replaces the old at once. We email you to say it changed."
              : "With a password you sign in with your work email, and need no code."}
          </PageHead>
          {error ? (
            <div className="mt-5">
              <Notice tone="error" title={error.t} section="password-error">
                {error.d}
              </Notice>
            </div>
          ) : null}
          <form
            method="post"
            action="/api/owner/password/"
            className="border-hairline bg-paper-raised mt-6 flex flex-col gap-5 rounded-md border p-5 sm:p-6"
            data-section="password-form"
          >
            {afterCode ? <input type="hidden" name="after" value="code" /> : null}
            {/* Tells a password manager which account this password belongs to. */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              defaultValue={email}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
            <div>
              <label htmlFor="new-password" className="oh-label block">
                {has ? "New password" : "Password"}
              </label>
              <PasswordField
                id="new-password"
                fresh
                required
                focus
                invalid={Boolean(error)}
                describedBy="new-password-help"
              />
              <p id="new-password-help" className="t-small text-ink-muted mt-1">
                At least 8 characters. A few words together is strong and easy to remember.
              </p>
            </div>
            <button type="submit" className="oh-btn primary lg w-full" data-action="save-password">
              Save the password
            </button>
          </form>
          <p className="t-body text-ink-muted mt-5 text-center">
            <a href="/owner/" className="oh-link" data-action="skip-password">
              {afterCode ? "Not now, go to my sites" : "Back to my sites"}
            </a>
          </p>
        </div>
      </Container>
    </Shell>
  );
}
