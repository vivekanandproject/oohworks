"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

const ACCOUNT = "/admin/account";
const OPEN = ["/admin/login", "/admin/logout", "/admin/forgot", "/admin/reset", ACCOUNT];

/**
 * Someone holding a password they were given sees only their account page until they replace it.
 * The access rules already refuse them everything else; this keeps the admin from showing a page of
 * refusals. The account is read afresh on each page, so it opens up as soon as the new one is saved.
 */
export function PasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [must, setMust] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/users/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { user?: { mustChangePassword?: boolean | null } | null } | null) => {
        if (!live) return;
        const pending = Boolean(body?.user?.mustChangePassword);
        setMust(pending);
        if (pending && !OPEN.some((p) => pathname.startsWith(p))) router.replace(ACCOUNT);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [pathname, router]);

  return (
    <>
      {must && pathname.startsWith(ACCOUNT) ? (
        <div className="oh-password-gate" role="alert">
          Choose your own password before you continue. Press <strong>Change Password</strong>,
          enter one of at least 12 characters, and save. The rest of the admin opens once it is
          saved.
        </div>
      ) : null}
      {children}
    </>
  );
}
