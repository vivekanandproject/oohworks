"use client";

import { useEffect, useMemo, useState } from "react";
import { useAllFormFields, useDocumentInfo } from "@payloadcms/ui";
import { readiness, type ReadinessInput } from "../../lib/editorial/readiness";

type Fields = Record<string, { value?: unknown } | undefined>;

const str = (fields: Fields, path: string): string => {
  const v = fields[path]?.value;
  return typeof v === "string" ? v : "";
};
const count = (fields: Fields, path: string): number => {
  const v = fields[path]?.value;
  return Array.isArray(v) ? v.length : 0;
};
const idOf = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && typeof (v as { id?: unknown }).id === "number"
      ? (v as { id: number }).id
      : null;

interface HeroInfo {
  width: number;
  alt: string;
  credit: string;
}

/**
 * The readiness panel beside an article or guide: whether the piece is ready for search engines,
 * answer engines and AI agents, checked as you write (src/lib/editorial/readiness.ts). Advice only:
 * it never stops publishing. The fact-check gate does that on its own.
 */
export function Readiness() {
  const [fields] = useAllFormFields() as unknown as [Fields];
  const { collectionSlug } = useDocumentInfo();
  const heroId = idOf(fields.hero?.value);
  const [hero, setHero] = useState<HeroInfo | null>(null);

  useEffect(() => {
    if (heroId === null) {
      setHero(null);
      return;
    }
    let live = true;
    fetch(`/api/media/${heroId}/?depth=0`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m: { width?: number; alt?: string; credit?: string } | null) => {
        if (live && m) setHero({ width: m.width ?? 0, alt: m.alt ?? "", credit: m.credit ?? "" });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [heroId]);

  const checks = useMemo(() => {
    const input: ReadinessInput = {
      collection: collectionSlug ?? "articles",
      pillar: collectionSlug === "guides" ? "guides" : str(fields, "pillar") || "news",
      title: str(fields, "title"),
      slug: str(fields, "slug"),
      standfirst: str(fields, "standfirst"),
      shortAnswer: str(fields, "shortAnswer"),
      seoDescription: str(fields, "seo.description"),
      body: fields.body?.value,
      authors: count(fields, "authors"),
      places: count(fields, "places") + (fields.city?.value ? 1 : 0),
      tags: count(fields, "tags") + (fields.format?.value ? 1 : 0),
      layout: str(fields, "layout") || "standard",
      hero: heroId === null ? null : hero,
      siteHost: typeof window === "undefined" ? "" : window.location.host,
    };
    return readiness(input);
  }, [fields, collectionSlug, hero, heroId]);

  const done = checks.filter((c) => c.ok).length;
  return (
    <div className="oh-readiness" data-section="readiness">
      <p className="oh-readiness-title">
        Ready for search and AI: {done} of {checks.length}
      </p>
      <p className="oh-readiness-note">
        Advice only. Nothing here stops publishing; unchecked figures still do.
      </p>
      <ul>
        {checks.map((c) => (
          <li key={c.key} data-ok={c.ok ? "" : undefined}>
            <span className="oh-readiness-state">{c.ok ? "Ready" : "Check"}</span>
            <span>
              {c.label}
              {c.ok ? null : <span className="oh-readiness-fix">{c.fix}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
