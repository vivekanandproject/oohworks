import { cleanEmail } from "@/lib/forms";
import { indiaDate } from "./calendar";
import { ARTWORK, type Artwork } from "./enquiry";

const DAY = 24 * 3600 * 1000;
export const isDay = (v: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

export interface EnquiryFields {
  from: string;
  to: string;
  brand: string;
  budgetRaw: string;
  budget: number | null;
  artwork: Artwork;
  message: string;
  email: string | null;
  /** A hidden field no person fills in. */
  trap: boolean;
}

/** What a buyer typed into an enquiry form, trimmed and capped. */
export function readFields(form: FormData): EnquiryFields {
  const text = (name: string, max: number): string =>
    String(form.get(name) ?? "")
      .trim()
      .slice(0, max);
  const budgetRaw = text("budget", 20)
    .replace(/^[A-Za-z]{3}\b/, "")
    .replace(/[\s,₹$£€¥]/g, "");
  const artworkRaw = text("artwork", 20);
  return {
    from: text("from", 10),
    to: text("to", 10),
    brand: text("brand", 120),
    budgetRaw,
    budget: /^\d+$/.test(budgetRaw) ? Number(budgetRaw) : null,
    artwork: artworkRaw in ARTWORK ? (artworkRaw as Artwork) : "not_started",
    message: text("message", 2000),
    email: cleanEmail(form.get("email")),
    trap: text("website", 10) !== "",
  };
}

export type FieldError = "dates" | "brand" | "budget" | "email";

/** The first thing an owner could not act on, or null when the enquiry is complete. */
export function fieldError(f: EnquiryFields, now: number): FieldError | null {
  if (
    !isDay(f.from) ||
    !isDay(f.to) ||
    f.from < indiaDate(now) ||
    f.to < f.from ||
    new Date(f.to).getTime() - new Date(f.from).getTime() > 730 * DAY
  )
    return "dates";
  if (f.brand.length < 2) return "brand";
  if (f.budgetRaw !== "" && (f.budget === null || f.budget <= 0 || f.budget > 1e9)) return "budget";
  if (!f.email) return "email";
  return null;
}

/** What goes back to the form after a mistake. The email and the message stay out of the address bar. */
export function echo(f: EnquiryFields, error: string): URLSearchParams {
  const q = new URLSearchParams({ error });
  if (isDay(f.from)) q.set("from", f.from);
  if (isDay(f.to)) q.set("to", f.to);
  if (f.brand) q.set("brand", f.brand);
  if (f.budget !== null) q.set("budget", String(f.budget));
  q.set("artwork", f.artwork);
  return q;
}
