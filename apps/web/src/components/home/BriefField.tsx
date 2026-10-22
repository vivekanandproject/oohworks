"use client";

import { useState } from "react";
import { Icon } from "@ohworks/ui";
import { briefChips } from "@/lib/sites/brief";

export interface BriefExample {
  label: string;
  q: string;
}

/**
 * The home page's search box. A plain GET form to /search/ that works with no JavaScript; with it, the
 * box shows as you type what the search will read from the brief, as the chips the results page shows.
 * The line under the box keeps its height either way, so the page never moves when chips appear.
 */
export function BriefField({ examples }: { examples: BriefExample[] }) {
  const [text, setText] = useState("");
  const chips = briefChips(text);
  return (
    <div className="w-full">
      <form
        action="/search/"
        method="get"
        role="search"
        className="flex w-full flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="q" className="sr-only">
          Describe the sites you need: place, road, format, size or budget
        </label>
        <div className="relative flex-1">
          <span className="text-ink-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
            <Icon name="pin" size={20} />
          </span>
          <input
            id="q"
            name="q"
            type="search"
            className="oh-input lg pl-12!"
            placeholder="Try: hoardings on Outer Ring Road, Bengaluru"
            autoComplete="off"
            enterKeyHint="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby="brief-reading"
          />
        </div>
        <button type="submit" className="oh-btn accent lg">
          Find sites
        </button>
      </form>
      <div
        id="brief-reading"
        aria-live="polite"
        className="mt-4 flex min-h-9 flex-wrap items-center justify-center gap-2"
        data-section="brief-reading"
      >
        {chips.length ? (
          <>
            <span className="t-small text-ink-muted">Understood as</span>
            {chips.map((c) => (
              <span key={c.key} className="oh-chip on cursor-default">
                {c.label}
              </span>
            ))}
          </>
        ) : (
          <p className="t-small text-ink-muted">
            Try{" "}
            {examples.map((e, i) => (
              <span key={e.q}>
                <a
                  href={`/search/?q=${encodeURIComponent(e.q).replace(/%20/g, "+")}`}
                  className="oh-link"
                >
                  {e.label}
                </a>
                {i < examples.length - 2 ? ", " : i === examples.length - 2 ? " or " : "."}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
