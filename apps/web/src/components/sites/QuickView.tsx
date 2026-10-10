"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Open {
  id: string;
  href: string;
  html: string | null;
}

/**
 * Quick view: a side panel with the main facts of a site, opened from a card or a map pin without
 * leaving the list. The panel's content is the server's own page for that site, fetched and shown.
 * Without script, the same link simply opens the full site page.
 */
export function QuickView() {
  const [open, setOpen] = useState<Open | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus?.();
    opener.current = null;
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-quick]");
      const id = link?.getAttribute("data-quick");
      if (!link || !id) return;
      e.preventDefault();
      if (!panel.current?.contains(link)) opener.current = link;
      setOpen({ id, href: link.href, html: null });
      fetch(`/quick/${id}/`, { headers: { accept: "text/html" } })
        .then((res) => (res.ok ? res.text() : Promise.reject(new Error("missing"))))
        .then((text) => {
          const body = new DOMParser()
            .parseFromString(text, "text/html")
            .querySelector("[data-quick-body]");
          if (!body) throw new Error("empty");
          setOpen((now) => (now?.id === id ? { ...now, html: body.innerHTML } : now));
        })
        .catch(() => window.location.assign(link.href));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      // Keep the keyboard inside the panel while it is open.
      const items = Array.from(
        panel.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), summary, input:not([type='hidden']), [tabindex='0']",
        ),
      ).filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
    // Only the open state matters here; the content arriving later must not move the focus again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id, close]);

  if (!open) return null;
  return (
    <>
      <div className="oh-drawer-backdrop" onClick={close} aria-hidden="true" />
      <aside
        ref={panel}
        className="oh-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Quick view"
        data-section="quickview"
        data-site-open={open.id}
      >
        <div className="border-hairline flex items-center justify-between gap-4 border-b px-5 py-3">
          <h2 className="t-display-sm">Quick view</h2>
          <button
            ref={closeButton}
            type="button"
            className="oh-link t-body-strong inline-flex min-h-11 items-center"
            onClick={close}
          >
            Close
          </button>
        </div>
        {open.html === null ? (
          <p className="t-body text-ink-muted p-5" role="status">
            Loading this site…
          </p>
        ) : (
          // The server's own markup for this site, from the same origin.
          <div
            className="scroll"
            data-quick-loaded=""
            dangerouslySetInnerHTML={{ __html: open.html }}
          />
        )}
      </aside>
    </>
  );
}
