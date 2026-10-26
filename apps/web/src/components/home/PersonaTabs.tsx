"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@ohworks/ui";
import type { Persona } from "./personas";

const panelId = (key: string) => `for-${key}`;

/**
 * One tab per kind of visitor. With no JavaScript every tab is a link to its panel and CSS `:target`
 * shows that panel (globals.css, `.personas`), so `/#for-agencies` opens the agencies tab either way.
 * With JavaScript the tabs follow the ARIA tabs pattern: arrow keys move between them, and the address
 * keeps the open tab so it can be shared.
 */
export function PersonaTabs({ personas }: { personas: Persona[] }) {
  const [active, setActive] = useState(personas[0]!.key);
  const [enhanced, setEnhanced] = useState(false);
  const tabs = useRef<(HTMLAnchorElement | null)[]>([]);
  const section = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEnhanced(true);
    const fromHash = () => {
      const key = window.location.hash.replace(/^#for-/, "");
      if (personas.some((p) => p.key === key)) {
        setActive(key as Persona["key"]);
        section.current?.scrollIntoView({ block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [personas]);

  const choose = (i: number, focus: boolean) => {
    const p = personas[i]!;
    setActive(p.key);
    history.replaceState(null, "", `#${panelId(p.key)}`);
    if (focus) tabs.current[i]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLAnchorElement>, i: number) => {
    const last = personas.length - 1;
    const next =
      e.key === "ArrowRight"
        ? i === last
          ? 0
          : i + 1
        : e.key === "ArrowLeft"
          ? i === 0
            ? last
            : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    choose(next, true);
  };

  return (
    <div ref={section} className="personas scroll-mt-20" data-js={enhanced ? "" : undefined}>
      <div
        role="tablist"
        aria-label="How it works for"
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1"
      >
        {personas.map((p, i) => {
          const on = p.key === active;
          return (
            <a
              key={p.key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`tab-${p.key}`}
              href={`#${panelId(p.key)}`}
              role="tab"
              aria-selected={enhanced ? on : undefined}
              aria-controls={panelId(p.key)}
              tabIndex={enhanced && !on ? -1 : 0}
              className={`oh-chip shrink-0 ${enhanced && on ? "on" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                choose(i, false);
              }}
              onKeyDown={(e) => onKey(e, i)}
            >
              {p.tab}
            </a>
          );
        })}
      </div>

      {personas.map((p, i) => (
        <div
          key={p.key}
          id={panelId(p.key)}
          role="tabpanel"
          aria-labelledby={`tab-${p.key}`}
          className="persona-panel mt-8 scroll-mt-24"
          data-on={(enhanced ? p.key === active : i === 0) ? "" : undefined}
          tabIndex={0}
        >
          <h3 className="t-display-sm max-w-[34ch]">{p.promise}</h3>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2">
            {p.steps.map((s, n) => (
              <li key={s.title} className="flex gap-4">
                <span
                  className="text-ink-muted t-data shrink-0 pt-0.5 font-mono tabular-nums"
                  aria-hidden="true"
                >
                  0{n + 1}
                </span>
                <div>
                  <p className="t-body-strong">{s.title}</p>
                  <p className="t-body text-ink-muted mt-1 max-w-[44ch]">{s.body}</p>
                  {s.we ? <p className="t-small text-navy-700 mt-2 max-w-[44ch]">{s.we}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button href={p.action.href} variant="secondary">
              {p.action.label}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
