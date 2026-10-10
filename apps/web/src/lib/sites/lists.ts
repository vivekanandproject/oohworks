import { isPermanentId } from "@ohworks/core";

/** A buyer's shortlist and their compare picks. Both are kept in the buyer's own browser, in cookies. */
export type ListName = "saved" | "compare";

export const LISTS = {
  saved: { cookie: "oh_saved", max: 50 },
  compare: { cookie: "oh_compare", max: 4 },
} as const;
export const LIST_SECONDS = 180 * 24 * 3600;

export function isListName(value: string): value is ListName {
  return value === "saved" || value === "compare";
}

/** Unit ids from a cookie or an address: valid ones only, each once, in the order given, up to a limit. */
export function parseIds(value: string | null | undefined, max: number): string[] {
  const out: string[] = [];
  for (const raw of (value ?? "").split(/[.,\s]+/)) {
    const id = raw.trim().toLowerCase();
    if (isPermanentId(id) && !out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

/** Dots, because a comma is not allowed in a cookie value. */
export function writeIds(ids: string[]): string {
  return ids.join(".");
}

export interface Change {
  ids: string[];
  /** Whether the id is in the list afterwards. */
  on: boolean;
  /** True when the list was already full, so nothing was added. */
  full: boolean;
}

export function toggleId(ids: string[], id: string, max: number): Change {
  if (ids.includes(id)) return { ids: ids.filter((x) => x !== id), on: false, full: false };
  if (ids.length >= max) return { ids, on: false, full: true };
  return { ids: [...ids, id], on: true, full: false };
}

export function addIds(ids: string[], more: string[], max: number): string[] {
  const out = [...ids];
  for (const id of more) if (!out.includes(id) && out.length < max) out.push(id);
  return out;
}
