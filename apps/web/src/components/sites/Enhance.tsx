"use client";

import { useEffect } from "react";

/**
 * Small conveniences on top of pages that already work without script: filter menus close when you
 * click away or press Escape, only one is open at a time, and Escape closes the all-filters panel.
 */
export function FilterEnhance() {
  useEffect(() => {
    const menus = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("details.oh-dd"));
    const onToggle = (e: Event) => {
      const opened = e.target as HTMLDetailsElement;
      if (opened.open) for (const d of menus()) if (d !== opened) d.open = false;
    };
    const onClick = (e: MouseEvent) => {
      for (const d of menus()) if (d.open && !d.contains(e.target as Node)) d.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const open = menus().filter((d) => d.open);
      if (open.length) {
        for (const d of open) d.open = false;
        return;
      }
      const close = document.querySelector<HTMLAnchorElement>("[data-drawer-close]");
      if (close) window.location.assign(close.href);
    };
    document.addEventListener("toggle", onToggle, true);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("toggle", onToggle, true);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}

/** On the enquiry form: the end date can never be before the start date. The server checks this too. */
export function DateOrder() {
  useEffect(() => {
    const from = document.querySelector<HTMLInputElement>("#enq-from");
    const to = document.querySelector<HTMLInputElement>("#enq-to");
    if (!from || !to) return;
    const sync = () => {
      if (!from.value) return;
      to.min = from.value;
      if (to.value && to.value < from.value) to.value = from.value;
    };
    from.addEventListener("change", sync);
    sync();
    return () => from.removeEventListener("change", sync);
  }, []);
  return null;
}
