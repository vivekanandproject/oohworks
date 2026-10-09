/**
 * Permanent unit IDs: 7 lowercase base-32 characters (Crockford alphabet, no i/l/o/u)
 * prefixed with "ow", e.g. "ow8k3x2". They never change once assigned and always sit at
 * the end of a unit URL so the slug can change and old URLs can 301 to the new one.
 */
export const PERMANENT_ID_PATTERN = /^ow[0-9a-hjkmnp-tv-z]{5}$/;

export function isPermanentId(value: string): boolean {
  return PERMANENT_ID_PATTERN.test(value);
}

/** Extracts the permanent id from a unit slug such as "hoarding-80-feet-road-ow8k3x2". */
export function permanentIdFromSlug(slug: string): string | null {
  const idx = slug.lastIndexOf("-");
  const candidate = idx === -1 ? slug : slug.slice(idx + 1);
  return isPermanentId(candidate) ? candidate : null;
}
