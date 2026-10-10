"use client";

import { useEffect } from "react";

const WORDS = { saved: ["Save", "Saved"], compare: ["Compare", "Comparing"] } as const;

interface ListState {
  full: boolean;
  list: "saved" | "compare";
  saved: string[];
  compare: string[];
  text: string;
}

function apply(data: ListState) {
  for (const name of ["saved", "compare"] as const) {
    const ids = new Set(data[name]);
    for (const form of Array.from(
      document.querySelectorAll<HTMLFormElement>(`form[data-list-form="${name}"]`),
    )) {
      const on = ids.has(form.dataset.id ?? "");
      const button = form.querySelector("button");
      button?.setAttribute("aria-pressed", String(on));
      const label = button?.querySelector("[data-label]");
      if (label) label.textContent = WORDS[name][on ? 1 : 0];
    }
  }
  const bar = document.querySelector<HTMLElement>("[data-plan]");
  if (!bar) return;
  bar.hidden = data.saved.length === 0 && data.compare.length === 0;
  const text = bar.querySelector("[data-plan-text]");
  if (text) text.textContent = data.text;
  const link = bar.querySelector<HTMLElement>("[data-plan-compare]");
  if (link) link.hidden = data.compare.length === 0;
  const n = bar.querySelector("[data-plan-compare-n]");
  if (n) n.textContent = String(data.compare.length);
  const status = bar.querySelector("[data-list-status]");
  if (status)
    status.textContent =
      data.full && data.list === "compare"
        ? "You can compare four sites at a time. Remove one first."
        : data.full
          ? "Your shortlist is full. Remove a site first."
          : "";
}

/**
 * Small conveniences for the shortlist: saving a site or ticking it for comparing updates the page in
 * place, and "Copy link" copies. Every one of these also works without script, as a plain form or link.
 */
export function BasketEnhance() {
  useEffect(() => {
    // One change at a time. The lists live in a cookie, so two saves sent together would each start
    // from the same list and the second would undo the first.
    let queue: Promise<void> = Promise.resolve();
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form?.matches?.("form[data-list-form]") || form.hasAttribute("data-plain")) return;
      e.preventDefault();
      const button = form.querySelector("button");
      button?.setAttribute("aria-busy", "true");
      const body = new FormData(form);
      queue = queue.then(() =>
        fetch(form.action, { method: "POST", body, headers: { accept: "application/json" } })
          .then((res) =>
            res.ok ? (res.json() as Promise<ListState>) : Promise.reject(new Error("refused")),
          )
          .then(apply)
          .catch(() => {
            // Anything unexpected: hand over to the plain form, which the server answers with a page.
            form.setAttribute("data-plain", "");
            form.submit();
          })
          .finally(() => button?.removeAttribute("aria-busy")),
      );
    };
    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element | null)?.closest?.<HTMLButtonElement>(
        "button[data-copy]",
      );
      if (!button) return;
      const value = new URL(button.dataset.copy ?? "", window.location.origin).href;
      const done = () => {
        const label = button.textContent;
        button.textContent = "Link copied";
        window.setTimeout(() => (button.textContent = label), 2500);
      };
      if (navigator.clipboard?.writeText)
        navigator.clipboard.writeText(value).then(done, () => undefined);
    };
    document.addEventListener("submit", onSubmit);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("submit", onSubmit);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}

const emit = (name: string, id: string | null) =>
  window.dispatchEvent(new CustomEvent(name, { detail: id }));

/** Lets the list and the live map light each other up: point at a card and its pin shows, and the reverse. */
export function ListSync() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-section='results']");
    if (!root) return;
    let last: string | null = null;
    const over = (e: Event) => {
      const id =
        (e.target as Element | null)?.closest?.("[data-site]")?.getAttribute("data-site") ?? null;
      if (id === last) return;
      last = id;
      emit("oh:card-hover", id);
    };
    const leave = () => {
      if (last === null) return;
      last = null;
      emit("oh:card-hover", null);
    };
    // Pointing at a pin lights its card for as long as the pointer stays; choosing a pin keeps its
    // card marked until another is chosen. The two are kept apart so that one does not clear the other.
    const mark = (attr: "data-lit" | "data-picked", id: string | null) => {
      for (const el of Array.from(root.querySelectorAll(`[${attr}]`))) el.removeAttribute(attr);
      const card = id ? root.querySelector<HTMLElement>(`[data-site="${CSS.escape(id)}"]`) : null;
      card?.setAttribute(attr, "");
      return card;
    };
    const onPinHover = (e: Event) => mark("data-lit", (e as CustomEvent<string | null>).detail);
    const onPinSelect = (e: Event) =>
      mark("data-picked", (e as CustomEvent<string | null>).detail)?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    root.addEventListener("mouseover", over);
    root.addEventListener("focusin", over);
    root.addEventListener("mouseleave", leave);
    window.addEventListener("oh:pin-hover", onPinHover);
    window.addEventListener("oh:pin-select", onPinSelect);
    return () => {
      root.removeEventListener("mouseover", over);
      root.removeEventListener("focusin", over);
      root.removeEventListener("mouseleave", leave);
      window.removeEventListener("oh:pin-hover", onPinHover);
      window.removeEventListener("oh:pin-select", onPinSelect);
    };
  }, []);
  return null;
}
