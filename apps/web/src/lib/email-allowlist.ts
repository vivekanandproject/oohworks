import { siteEnv } from "./api/env";

/**
 * Whether an address may get a real email. Production sends to anyone. Anywhere else only addresses on
 * EMAIL_ALLOWLIST do (whole addresses or @domains, separated by commas), and the rest are kept in the
 * outbox, so a preview or staging copy never writes to a real owner or buyer. A development machine
 * with no allowlist sends to anyone, as it always has.
 */
export function mayEmail(to: string): boolean {
  const env = siteEnv();
  if (env === "production") return true;
  const list = (process.env.EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return env === "local";
  const address = to.trim().toLowerCase();
  return list.some((entry) =>
    entry.startsWith("@") ? address.endsWith(entry) : address === entry,
  );
}
