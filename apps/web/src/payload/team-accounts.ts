/**
 * Which team accounts a database must have, read from the environment. Kept apart from the seed that
 * writes them, and free of the CMS, so the rules can be tested on their own.
 *
 *   SUPER_ADMIN_EMAILS     Comma-separated. Each becomes an active super admin.
 *   SUPER_ADMIN_PASSWORD   The password a new super admin starts with, replaced at first sign-in.
 *                          On a development or test machine it defaults to the known local one.
 *   TEAM_ACCOUNTS          A JSON list of { "email", "name", "role" } for the rest of the team.
 *   SUPER_ADMIN_RESET=1    For one release only: puts SUPER_ADMIN_PASSWORD back on every listed
 *                          super admin and lifts any lockout, for when nobody can get in.
 *
 * None of these is ever committed: the repository is public.
 */
import { ROLES, type Role } from "./access";

export const LOCAL_PASSWORD = "ohworks-admin-local";
export const PASSWORD_MIN = 12;

export interface TeamAccount {
  email: string;
  name: string;
  role: Role;
}

export interface TeamPlan {
  production: boolean;
  superAdmins: TeamAccount[];
  team: TeamAccount[];
  /** One account per role on a development or test machine, all with the known local password. */
  demo: TeamAccount[];
  /** The first password for a new super admin. Undefined in production when none is set. */
  password: string | undefined;
  reset: boolean;
  notes: string[];
}

/** A setting that is wrong. Its message is the whole explanation, so it is shown without a stack. */
export class TeamSetupError extends Error {}

export const DEMO_ACCOUNTS: TeamAccount[] = [
  { email: "admin@ohworks.local", name: "Local super admin", role: "superadmin" },
  { email: "manager@ohworks.local", name: "Local admin", role: "admin" },
  { email: "editor@ohworks.local", name: "Local editor", role: "editor" },
  { email: "writer@ohworks.local", name: "Local writer", role: "writer" },
  { email: "contributor@ohworks.local", name: "Local contributor", role: "contributor" },
  { email: "ops@ohworks.local", name: "Local ops", role: "ops" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_VALUES = new Set<string>(ROLES.map((r) => r.value));

function cleanEmail(raw: unknown, where: string): string {
  const email = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL.test(email))
    throw new TeamSetupError(`"${String(raw)}" in ${where} is not an email address.`);
  return email;
}

/** "vc@example.com" becomes "VC" and "priya.shah@" becomes "Priya Shah". A super admin can change it later. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0]!;
  // A short address on its own is someone's initials.
  if (/^[a-z]{1,3}$/i.test(local)) return local.toUpperCase();
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function readSuperAdmins(raw: string | undefined): TeamAccount[] {
  const emails = (raw ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((e) => cleanEmail(e, "SUPER_ADMIN_EMAILS"));
  return [...new Set(emails)].map((email) => ({
    email,
    name: nameFromEmail(email),
    role: "superadmin",
  }));
}

function readTeam(raw: string | undefined): TeamAccount[] {
  if (!raw?.trim()) return [];
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    throw new TeamSetupError(
      'TEAM_ACCOUNTS is not valid JSON. It should look like [{"email":"desk@example.com","name":"News desk","role":"editor"}].',
    );
  }
  if (!Array.isArray(list)) throw new TeamSetupError("TEAM_ACCOUNTS must be a JSON list.");
  return list.map((item: unknown, i) => {
    const entry = (item ?? {}) as Record<string, unknown>;
    const email = cleanEmail(entry.email, `TEAM_ACCOUNTS entry ${i + 1}`);
    const role = String(entry.role ?? "");
    if (role === "superadmin")
      throw new TeamSetupError(
        `${email} is listed as a super admin in TEAM_ACCOUNTS. Put super admins in SUPER_ADMIN_EMAILS instead.`,
      );
    if (!ROLE_VALUES.has(role))
      throw new TeamSetupError(
        `${email} in TEAM_ACCOUNTS has the role "${role}". Use one of: ${[...ROLE_VALUES].filter((r) => r !== "superadmin").join(", ")}.`,
      );
    const name =
      typeof entry.name === "string" && entry.name.trim()
        ? entry.name.trim()
        : nameFromEmail(email);
    return { email, name, role: role as Role };
  });
}

export function readTeamPlan(env: Record<string, string | undefined>): TeamPlan {
  const production = env.NODE_ENV === "production";
  const notes: string[] = [];
  const superAdmins = readSuperAdmins(env.SUPER_ADMIN_EMAILS);
  const supers = new Set(superAdmins.map((a) => a.email));

  const team = readTeam(env.TEAM_ACCOUNTS).filter((a) => {
    if (!supers.has(a.email)) return true;
    notes.push(
      `${a.email} is in both SUPER_ADMIN_EMAILS and TEAM_ACCOUNTS, so stays a super admin.`,
    );
    return false;
  });

  const given = env.SUPER_ADMIN_PASSWORD || undefined;
  if (given !== undefined && given.length < PASSWORD_MIN)
    throw new TeamSetupError(`SUPER_ADMIN_PASSWORD needs at least ${PASSWORD_MIN} characters.`);

  const reset = env.SUPER_ADMIN_RESET === "1";
  if (reset && !given)
    throw new TeamSetupError("SUPER_ADMIN_RESET=1 needs a new SUPER_ADMIN_PASSWORD to put back.");
  if (reset && superAdmins.length === 0)
    throw new TeamSetupError(
      "SUPER_ADMIN_RESET=1 needs SUPER_ADMIN_EMAILS, to know whose password to reset.",
    );

  return {
    production,
    superAdmins,
    team,
    demo: production ? [] : DEMO_ACCOUNTS,
    password: given ?? (production ? undefined : LOCAL_PASSWORD),
    reset,
    notes,
  };
}
