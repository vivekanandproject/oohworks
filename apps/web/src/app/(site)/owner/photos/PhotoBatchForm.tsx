"use client";

import { useState, type FormEvent } from "react";
import { MAX_BATCH, PLACE_BY_HAND, REASON, type BatchResult } from "@/lib/owners/photo-batch";

interface SiteChoice {
  unit: string;
  title: string;
}

type Row =
  { file: File; state: "waiting" | "sending" } | { file: File; state: "done"; result: BatchResult };

const VIEWS = [
  ["approach", "Approach, from the road"],
  ["day", "Day, close"],
  ["night", "Night"],
] as const;

/**
 * The form for many photographs. Without script it is a plain form, and the server answers with the
 * whole batch. With script it sends one photograph a request, shows each as it lands, and lets the
 * owner place by hand any the server could not place (through the single-photograph form's address).
 */
export function PhotoBatchForm({ sites, today }: { sites: SiteChoice[]; today: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const titleOf = (unit?: string) => sites.find((s) => s.unit === unit)?.title ?? unit ?? "";

  const update = (i: number, row: Row) => setRows((all) => all.map((r, j) => (j === i ? row : r)));

  async function send(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const input = form.elements.namedItem("photos") as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []).slice(0, MAX_BATCH);
    if (files.length === 0) return;
    e.preventDefault();
    setBusy(true);
    setRows(files.map((file) => ({ file, state: "waiting" })));
    for (const [i, file] of files.entries()) {
      update(i, { file, state: "sending" });
      const body = new FormData();
      body.append("photos", file);
      let result: BatchResult = { name: file.name, added: false, reason: "read" };
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body,
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as { results?: BatchResult[]; error?: string };
        result = data.results?.[0] ?? result;
      } catch {
        // Kept as "could not read": the owner can try that one again by hand.
      }
      update(i, { file, state: "done", result });
    }
    if (input) input.value = "";
    setBusy(false);
  }

  async function place(i: number, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const row = rows[i];
    if (!row) return;
    const chosen = new FormData(e.currentTarget);
    const body = new FormData();
    body.append("id", String(chosen.get("id") ?? ""));
    body.append("kind", String(chosen.get("kind") ?? "approach"));
    body.append("takenOn", String(chosen.get("takenOn") ?? ""));
    body.append("photo", row.file);
    update(i, { file: row.file, state: "sending" });
    let result: BatchResult = { name: row.file.name, added: false, reason: "read" };
    try {
      // The single-photograph form answers with its site page's address, which says what happened.
      const res = await fetch("/api/owner/photo/", { method: "POST", body });
      const said = new URL(res.url).searchParams;
      const unit = String(chosen.get("id") ?? "");
      result =
        said.get("photo") === "added"
          ? { name: row.file.name, added: true, unit, ...(said.get("twin") ? { twin: true } : {}) }
          : {
              name: row.file.name,
              added: false,
              unit,
              reason: (said.get("perror") as BatchResult["reason"]) ?? "read",
            };
    } catch {
      // As above.
    }
    update(i, { file: row.file, state: "done", result });
  }

  return (
    <>
      <form
        method="post"
        action="/api/owner/photos/"
        encType="multipart/form-data"
        onSubmit={send}
        className="mt-6 flex flex-col gap-5"
        data-section="photos-form"
      >
        <div>
          <label htmlFor="photos-files" className="oh-label block">
            Your photographs
          </label>
          <input
            id="photos-files"
            name="photos"
            type="file"
            multiple
            required
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="photos-files-help"
            className="oh-input mt-1"
          />
          <p id="photos-files-help" className="t-small text-ink-muted mt-1">
            JPEG, PNG or WebP, up to 10 MB each and {MAX_BATCH} at a time.
          </p>
        </div>
        <div>
          <button
            type="submit"
            className="oh-btn primary lg w-full sm:w-auto"
            data-action="send-photos"
            disabled={busy}
          >
            {busy ? "Adding your photographs…" : "Add these photographs"}
          </button>
        </div>
      </form>

      {rows.length ? (
        <ul className="mt-6 space-y-3" aria-live="polite" data-section="photos-progress">
          {rows.map((row, i) => (
            <li
              key={`${row.file.name}-${i}`}
              className="border-hairline rounded-md border px-4 py-3"
              data-photo-state={
                row.state === "done" ? (row.result.added ? "added" : "left") : row.state
              }
            >
              <p className="t-body text-ink">
                <span className="font-mono text-[13px] [overflow-wrap:anywhere]">
                  {row.file.name}
                </span>{" "}
                ·{" "}
                {row.state !== "done" ? (
                  row.state === "sending" ? (
                    "Adding…"
                  ) : (
                    "Waiting"
                  )
                ) : row.result.added ? (
                  <>
                    Added to{" "}
                    <a href={`/owner/sites/${row.result.unit}/`} className="oh-link">
                      {titleOf(row.result.unit)}
                    </a>
                    .
                    {row.result.twin
                      ? " It is also on another listing, so our team will check it."
                      : ""}
                  </>
                ) : (
                  <>Not added. {REASON[row.result.reason ?? "read"]}</>
                )}
              </p>
              {row.state === "done" &&
              !row.result.added &&
              PLACE_BY_HAND.has(row.result.reason ?? "read") ? (
                <form
                  onSubmit={(e) => place(i, e)}
                  className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
                  data-section="place-by-hand"
                >
                  <div>
                    <label htmlFor={`site-${i}`} className="oh-label block">
                      Which site
                    </label>
                    <select id={`site-${i}`} name="id" required className="oh-input mt-1">
                      <option value="">Choose a site</option>
                      {sites.map((s) => (
                        <option key={s.unit} value={s.unit}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`view-${i}`} className="oh-label block">
                      What it shows
                    </label>
                    <select id={`view-${i}`} name="kind" className="oh-input mt-1">
                      {VIEWS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`date-${i}`} className="oh-label block">
                      Date taken
                    </label>
                    <input
                      id={`date-${i}`}
                      name="takenOn"
                      type="date"
                      max={today}
                      defaultValue={today}
                      className="oh-input mt-1"
                    />
                  </div>
                  <button type="submit" className="oh-btn secondary" data-action="place-photo">
                    Add to this site
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
