"use client";

import { useEffect, useState } from "react";
import { Button } from "@ohworks/ui";
import { readConsent, saveConsent } from "@/lib/analytics";

/**
 * Asks once whether Google Analytics may store its cookies. Shown only where analytics runs (the root
 * layout renders it when a measurement id is set) and only until the visitor answers. Decline is as
 * easy as allow, and nothing is stored before an answer. Sits at the foot of the screen, well under a
 * quarter of a phone's height, and never covers a form's own button for long: it goes on the first
 * answer.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(readConsent() === null);
    sync();
    window.addEventListener("oh:consent", sync);
    return () => window.removeEventListener("oh:consent", sync);
  }, []);

  if (!open) return null;
  return (
    <div
      role="region"
      aria-label="Cookie choice"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:px-10"
    >
      <div className="oh-box shadow-float max-w-content pointer-events-auto mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-small text-ink max-w-[70ch]">
          May we count visits with Google Analytics? It helps us see which pages are useful. It
          stores cookies only if you allow it. The cookies that keep you signed in and remember your
          shortlist are always on.{" "}
          <a href="/cookies/" className="text-navy-700 underline underline-offset-2">
            About cookies
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => saveConsent("denied")}>
            Decline
          </Button>
          <Button variant="primary" size="sm" onClick={() => saveConsent("granted")}>
            Allow analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
