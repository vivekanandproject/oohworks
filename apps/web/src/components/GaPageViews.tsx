"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pagePath, setPage, track } from "@/lib/analytics";

function Views() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const path = pagePath(pathname, search);
    // The first view's referrer is the browser's; after that it is the page the visitor came from.
    setPage(path, previous.current ? location.origin + previous.current : document.referrer);
    previous.current = path;
    // The title is the new page's once React has committed it.
    track("page_view", { page_title: document.title });
  }, [pathname, search]);
  return null;
}

/**
 * Sends one page view per page, on the first load and on every move inside the site, with the address
 * cleaned of codes and references (pagePath). Google's own automatic page views are off, so turn off
 * "Page changes based on browser history events" in the stream's enhanced measurement too, or moves
 * inside the site count twice.
 */
export function GaPageViews() {
  return (
    <Suspense fallback={null}>
      <Views />
    </Suspense>
  );
}
