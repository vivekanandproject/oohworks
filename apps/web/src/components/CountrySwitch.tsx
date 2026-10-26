"use client";

import { Icon } from "@ohworks/ui";
import countryToCurrency from "country-to-currency";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRY_COOKIE } from "@/lib/world/geo";

const CURRENCY = countryToCurrency as Record<string, string>;

function readCookie(): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${COUNTRY_COOKIE}=`));
  const code = hit?.slice(COUNTRY_COOKIE.length + 1).toUpperCase() ?? "";
  return code in CURRENCY ? code : null;
}

/**
 * The visitor's country: where search starts, and the currency of approximate prices. It is chosen
 * here, remembered in a cookie, and read in the browser, so cached pages stay the same for everyone.
 * Every country is offered, those with sites listed first.
 */
export function CountrySwitch({ listed, menu = false }: { listed: string[]; menu?: boolean }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // The list is drawn only while the dialog is open, so a closed switcher adds nothing to the page.
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const names = useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }), []);
  const nameOf = (code: string) => names.of(code) ?? code;

  useEffect(() => setCurrent(readCookie()), []);

  const all = useMemo(
    () =>
      Object.keys(CURRENCY)
        .map((code) => ({ code, name: names.of(code) ?? code }))
        .filter((c) => c.name !== c.code)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [names],
  );
  const q = query.trim().toLowerCase();
  const fits = (c: { code: string; name: string }) =>
    !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q;
  const withSites = all.filter((c) => listed.includes(c.code) && fits(c));
  const others = all.filter((c) => !listed.includes(c.code) && fits(c));

  const choose = (code: string) => {
    document.cookie = `${COUNTRY_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    setCurrent(code);
    dialog.current?.close();
    // Search and the shortlist are drawn for the visitor, so the page is fetched again in the new country.
    location.reload();
  };

  const label = current ? `${nameOf(current)} · ${CURRENCY[current]}` : "Country";
  const row = (c: { code: string; name: string }) => (
    <li key={c.code}>
      <button
        type="button"
        onClick={() => choose(c.code)}
        aria-current={c.code === current ? "true" : undefined}
        className={`hover:bg-navy-200 flex min-h-11 w-full items-center justify-between gap-3 rounded-sm px-3 text-left ${c.code === current ? "bg-navy-200" : ""}`}
      >
        <span>{c.name}</span>
        <span className="t-data-sm text-ink-muted">{CURRENCY[c.code]}</span>
      </button>
    </li>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen(true);
          dialog.current?.showModal();
        }}
        className={
          menu
            ? "text-ink hover:bg-navy-200 flex min-h-11 w-full items-center gap-2 rounded-sm px-3 font-medium"
            : "oh-btn ghost sm hidden lg:inline-flex"
        }
        aria-haspopup="dialog"
        data-action="country"
      >
        <Icon name="globe" size={20} />
        <span>{label}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        className="bg-paper-raised shadow-modal m-auto w-[min(440px,calc(100vw-32px))] rounded-md p-0 backdrop:bg-[rgba(16,28,48,0.4)]"
        data-section="country-switch"
      >
        <div className="flex max-h-[min(640px,85svh)] flex-col">
          <div className="border-hairline border-b p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="t-display-sm">
                Your country
              </h2>
              <button
                type="button"
                className="oh-btn ghost sm"
                onClick={() => dialog.current?.close()}
              >
                Close
              </button>
            </div>
            <p className="t-small text-ink-muted mt-1">
              Search starts there, and prices show an approximate figure in its currency.
            </p>
            <label htmlFor={`${titleId}-q`} className="sr-only">
              Find a country
            </label>
            <input
              id={`${titleId}-q`}
              type="search"
              className="oh-input mt-3"
              placeholder="Find a country"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="overflow-y-auto p-2">
            {!open ? null : withSites.length ? (
              <>
                <p className="t-label text-ink-muted px-3 pt-2 pb-1">With sites listed</p>
                <ul>{withSites.map(row)}</ul>
              </>
            ) : null}
            {open ? (
              <>
                <p className="t-label text-ink-muted px-3 pt-3 pb-1">Every country</p>
                <ul>{others.map(row)}</ul>
              </>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
