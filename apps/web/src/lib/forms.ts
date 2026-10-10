/** Shared hardening for the small public forms (follow, subscribe). */
const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

/** In-memory limiter per instance. Replaced by the shared Redis limiter when that lands. */
export function rateLimited(req: Request, bucket: string, limit = 30): boolean {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length > limit;
}

export function cleanEmail(value: FormDataEntryValue | null): string | null {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

/** Only same-site paths are followed after a form post. */
export function safePath(value: FormDataEntryValue | string | null, fallback: string): string {
  const v = String(value ?? "");
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  return v.split("#")[0] ?? fallback;
}

export function seeOther(req: Request, path: string): Response {
  return Response.redirect(new URL(path, req.url), 303);
}
