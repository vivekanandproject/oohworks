import type { FileProblem } from "./request";
import type { Unplaced } from "./photo-match";

/**
 * What became of each photograph in a batch, for the page that shows it. Kept free of server code: the
 * page's script reads the same words.
 */

/** At most this many in one sending. The page's script sends them one at a time. */
export const MAX_BATCH = 20;

export type BatchReason = Unplaced | FileProblem | "many" | "stock" | "date" | "read";

export interface BatchResult {
  name: string;
  added: boolean;
  /** The site it went to, or was meant for. */
  unit?: string;
  /** Already on another listing: added, and flagged for the team. */
  twin?: boolean;
  reason?: BatchReason;
  library?: string;
}

export const REASON: Record<BatchReason, string> = {
  "no-position": "It does not record where it was taken.",
  far: "It was not taken near any of your sites.",
  between: "It was taken between two of your sites, so we could not tell which.",
  many: "That site already has six photographs.",
  stock: "Its file says it comes from a stock library.",
  date: "It does not record when it was taken.",
  read: "We could not read it as a photograph.",
  missing: "The file was empty.",
  big: "It is over 10 MB.",
  type: "It is not a JPEG, PNG or WebP photograph.",
};

/** Reasons the owner can put right by choosing the site, and the date, themselves. */
export const PLACE_BY_HAND = new Set<BatchReason>(["no-position", "far", "between", "date"]);

export const encodeBatch = (results: BatchResult[]): string =>
  Buffer.from(JSON.stringify(results)).toString("base64url");

/** A batch read back from the address. Anything malformed is dropped rather than shown. */
export function decodeBatch(value: string): BatchResult[] {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is BatchResult =>
          typeof r === "object" &&
          r !== null &&
          typeof (r as BatchResult).name === "string" &&
          typeof (r as BatchResult).added === "boolean" &&
          ((r as BatchResult).reason === undefined || (r as BatchResult).reason! in REASON),
      )
      .slice(0, 20)
      .map((r) => ({
        name: r.name.slice(0, 80),
        added: r.added,
        ...(typeof r.unit === "string" ? { unit: r.unit.slice(0, 12) } : {}),
        ...(r.twin ? { twin: true } : {}),
        ...(r.reason ? { reason: r.reason } : {}),
        ...(typeof r.library === "string" ? { library: r.library.slice(0, 40) } : {}),
      }));
  } catch {
    return [];
  }
}
