"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Counts one named moment when its page is shown, such as an enquiry sent (src/lib/analytics.ts).
 * `once` names the moment for this browser tab, so reloading the page does not count it again.
 */
export function TrackOnView({
  event,
  params = {},
  once,
}: {
  event: string;
  params?: Record<string, string | number>;
  once?: string;
}) {
  useEffect(() => {
    const key = once ? `oh_tracked:${once}` : "";
    try {
      if (key && sessionStorage.getItem(key)) return;
      if (key) sessionStorage.setItem(key, "1");
    } catch {
      // Private windows may refuse storage; counting twice is better than not at all.
    }
    track(event, params);
    // Counted once per mount; the props never change for a page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
