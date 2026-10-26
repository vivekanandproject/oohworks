const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Tidies what an owner typed: no spaces, capitals. */
export function tidyGstin(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Whether a GSTIN is well formed: two digits for the state, the ten characters of a PAN, an entity
 * number, a "Z", and a last character that the first fourteen must add up to. This catches a mistyped
 * number. It does not prove the number belongs to the company; the team checks that against the document.
 */
export function isGstin(value: string): boolean {
  const g = tidyGstin(value);
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  const state = Number(g.slice(0, 2));
  if (state < 1 || state > 38) return g.startsWith("97") || g.startsWith("99");
  let factor = 2;
  let sum = 0;
  for (let i = 13; i >= 0; i -= 1) {
    const product = factor * CHARS.indexOf(g.charAt(i));
    factor = factor === 2 ? 1 : 2;
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARS.charAt((36 - (sum % 36)) % 36) === g.charAt(14);
}

/** What a company's registration number is called where it is: a GSTIN in India. */
export function registrationName(country: string | null | undefined): string {
  return (country ?? "").toUpperCase() === "IN" ? "GSTIN" : "company registration number";
}
