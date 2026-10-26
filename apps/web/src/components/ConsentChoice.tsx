"use client";

import { useEffect, useState } from "react";
import { Button } from "@ohworks/ui";
import { clearConsent, readConsent } from "@/lib/analytics";

/** On /cookies/: what the visitor chose for Google Analytics, and a way to choose again. */
export function ConsentChoice() {
  const [choice, setChoice] = useState<"granted" | "denied" | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setChoice(readConsent());
    sync();
    window.addEventListener("oh:consent", sync);
    return () => window.removeEventListener("oh:consent", sync);
  }, []);

  if (choice === undefined) return null;
  const said =
    choice === "granted"
      ? "You allowed Google Analytics on this browser."
      : choice === "denied"
        ? "You declined Google Analytics on this browser."
        : "You have not chosen yet. The question is at the foot of the screen.";
  return (
    <div className="border-hairline bg-paper-raised mt-6 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5">
      <p className="t-body text-ink" role="status">
        {said}
      </p>
      {choice ? (
        <Button variant="secondary" onClick={clearConsent}>
          Change your choice
        </Button>
      ) : null}
    </div>
  );
}
