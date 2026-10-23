"use client";

import { useEffect, useMemo, useState } from "react";
import { useAllFormFields } from "@payloadcms/ui";
import { indexChecks, type IndexCheck } from "../../lib/sites/view";

type Fields = Record<string, { value?: unknown } | undefined>;

const val = (fields: Fields, path: string): unknown => fields[path]?.value;
/** Payload keeps an array field's value as its row count while editing; elsewhere it is the rows. */
const rows = (v: unknown): number => (typeof v === "number" ? v : Array.isArray(v) ? v.length : 0);
const num = (v: unknown): number | null =>
  typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : null;
const idOf = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && typeof (v as { id?: unknown }).id === "number"
      ? (v as { id: number }).id
      : null;

/**
 * Beside every site in the admin: will its page go to Google and Bing, and if not, what is missing.
 * The checks are the page's own content bar (src/lib/sites/view.ts), so this panel, the page's robots
 * tag and the sitemap always agree. Below them, advice that makes a page rank and convert better.
 */
export function SiteReadiness() {
  const [fields] = useAllFormFields() as unknown as [Fields];
  const ownerId = idOf(val(fields, "owner"));
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (ownerId === null) {
      setVerified(null);
      return;
    }
    let live = true;
    fetch(`/api/owners/${ownerId}/?depth=0`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((o: { verified?: boolean } | null) => {
        if (live) setVerified(Boolean(o?.verified));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [ownerId]);

  const { bar, advice } = useMemo(() => {
    const photos = rows(val(fields, "photos"));
    const widthMm = num(val(fields, "widthMm")) ?? num(val(fields, "width"));
    const bar: IndexCheck[] = indexChecks(
      {
        sample: Boolean(val(fields, "sample")),
        removed: Boolean(val(fields, "removed")),
        photos: Array.from({ length: photos }, () => ({}) as never),
        lat: num(val(fields, "lat")) ?? 0,
        lng: num(val(fields, "lng")) ?? 0,
        facingDeg: num(val(fields, "facingDeg")),
        widthMm,
        lighting: (val(fields, "lighting") as never) ?? null,
        audience: {
          figure: num(val(fields, "audience.figure")),
          source: (val(fields, "audience.source") as string) ?? null,
          measuredOn: (val(fields, "audience.measuredOn") as string) ?? null,
        } as never,
      },
      { verified: Boolean(verified) },
    );
    const priceDisplay = val(fields, "priceDisplay");
    const advice: IndexCheck[] = [
      {
        key: "photos",
        label: "Three photos: approach, day and night",
        ok: photos >= 3,
        fix: "Buyers ask first about how the face looks from the road and at night.",
      },
      {
        key: "price",
        label: "A price is shown",
        ok: priceDisplay === "exact" || priceDisplay === "from",
        fix: "An exact or “from” price is marked up for search and gets more enquiries than “on request”.",
      },
      {
        key: "landmark",
        label: "A landmark nearby",
        ok: Boolean(String(val(fields, "landmark") ?? "").trim()),
        fix: "People and assistants search by landmark: “near Silk Board”, “opposite Forum Mall”.",
      },
      {
        key: "permit",
        label: "Permit on file",
        ok: Boolean(String(val(fields, "permit.number") ?? "").trim()),
        fix: "Add the permit number, authority and expiry to earn the Permit on file badge.",
      },
      {
        key: "located",
        label: "Location checked on the street",
        ok: Boolean(val(fields, "verifiedLocation")),
        fix: "Tick Verified location once the pin is checked against the street or a GPS-stamped photo.",
      },
    ];
    return { bar, advice };
  }, [fields, verified]);

  const indexed = bar.every((c) => c.ok);
  const line = (c: IndexCheck) => (
    <li key={c.key} data-ok={c.ok ? "" : undefined}>
      <span className="oh-readiness-state">{c.ok ? "Ready" : "Check"}</span>
      <span>
        {c.label}
        {c.ok ? null : <span className="oh-readiness-fix">{c.fix}</span>}
      </span>
    </li>
  );
  return (
    <div className="oh-readiness" data-section="site-readiness">
      <p className="oh-readiness-title">
        {indexed
          ? "Goes to Google and Bing when published"
          : `Not for search engines yet: ${bar.filter((c) => !c.ok).length} to fix`}
      </p>
      <p className="oh-readiness-note">
        The page&rsquo;s own content bar. Until every line is ready, the page is live for buyers but
        asks search engines not to index it.
        {verified === null && ownerId !== null ? " Checking the owner…" : ""}
      </p>
      <ul>{bar.map(line)}</ul>
      <p className="oh-readiness-title mt-4" style={{ marginTop: 16 }}>
        To rank and convert better
      </p>
      <ul style={{ marginTop: 8 }}>{advice.map(line)}</ul>
    </div>
  );
}
