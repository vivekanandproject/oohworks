import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * An owner's password. Only a one-way hash is ever kept: scrypt, with a salt of its own for every
 * password, so two owners with the same password do not share a hash and a stolen table cannot be
 * read back into passwords.
 *
 * Kept as `scrypt$N$r$p$salt$hash`, so the cost can be raised later without locking anyone out.
 */
const COST = { N: 16384, r: 8, p: 1 };
const KEY_BYTES = 64;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

function derive(
  password: string,
  salt: Buffer,
  cost: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_BYTES, cost, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);
  return `scrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export const isPasswordHash = (value: unknown): value is string =>
  typeof value === "string" && /^scrypt\$\d+\$\d+\$\d+\$[\w-]{16,}\$[\w-]{40,}$/.test(value);

// Checked when there is no real hash to check against, so a wrong user name takes as long to
// refuse as a wrong password and the two cannot be told apart by the clock.
const NOBODY = randomBytes(16);

export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!isPasswordHash(stored)) {
    await derive(password, NOBODY, COST);
    return false;
  }
  const [, n, r, p, salt, hash] = stored.split("$") as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const want = Buffer.from(hash, "base64url");
  const got = await derive(password, Buffer.from(salt, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return got.length === want.length && timingSafeEqual(got, want);
}

export type PasswordProblem = "short" | "long" | "same";

/**
 * Whether a new password will do. Length is what counts, so there are no rules about symbols or
 * capitals. It may not be the owner's own email, which is the first thing anyone would try.
 */
export function checkNewPassword(password: string, email: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN) return "short";
  if (password.length > PASSWORD_MAX) return "long";
  const lower = password.trim().toLowerCase();
  if (lower === email.toLowerCase() || lower === email.toLowerCase().split("@")[0]) return "same";
  return null;
}
