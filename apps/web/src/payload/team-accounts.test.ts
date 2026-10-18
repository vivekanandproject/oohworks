import { describe, expect, it } from "vitest";
import {
  canPublish,
  isAdmin,
  isEditor,
  isStaff,
  isSuperAdmin,
  publishedOrStaff,
  staffOrSelf,
  superAdminOrSelf,
} from "./access";
import {
  DEMO_ACCOUNTS,
  LOCAL_PASSWORD,
  nameFromEmail,
  readTeamPlan,
  TeamSetupError,
} from "./team-accounts";

type Rule = (args: never) => unknown;
const as = (user: Record<string, unknown> | null) => ({ req: { user } }) as never;
const run = (rule: Rule, user: Record<string, unknown> | null) => rule(as(user));

describe("who may do what", () => {
  const superAdmin = { id: 1, role: "superadmin", active: true };
  const admin = { id: 2, role: "admin", active: true };
  const writer = { id: 3, role: "writer", active: true };

  it("ranks the super admin above every other role", () => {
    expect(run(isSuperAdmin, superAdmin)).toBe(true);
    expect(run(isSuperAdmin, admin)).toBe(false);
    expect(run(isAdmin, superAdmin)).toBe(true);
    expect(run(isEditor, superAdmin)).toBe(true);
  });

  it("lets a super admin publish articles and blogs, and not a writer", () => {
    expect(canPublish(superAdmin)).toBe(true);
    expect(canPublish(admin)).toBe(true);
    expect(canPublish({ id: 4, role: "editor" })).toBe(true);
    expect(canPublish(writer)).toBe(false);
  });

  it("gives a suspended person nothing, whatever their role", () => {
    const suspended = { ...superAdmin, active: false };
    expect(run(isSuperAdmin, suspended)).toBe(false);
    expect(run(isStaff, suspended)).toBe(false);
    expect(canPublish(suspended)).toBe(false);
    expect(run(publishedOrStaff, suspended)).toEqual({ _status: { equals: "published" } });
    expect(run(superAdminOrSelf, suspended)).toBe(false);
  });

  it("leaves someone holding a given password only their own account", () => {
    const pending = { ...superAdmin, mustChangePassword: true };
    expect(run(isSuperAdmin, pending)).toBe(false);
    expect(run(isStaff, pending)).toBe(false);
    expect(run(staffOrSelf, pending)).toEqual({ id: { equals: 1 } });
    expect(run(superAdminOrSelf, pending)).toEqual({ id: { equals: 1 } });
  });

  it("lets a super admin change any account and anyone else only their own", () => {
    expect(run(superAdminOrSelf, superAdmin)).toBe(true);
    expect(run(superAdminOrSelf, admin)).toEqual({ id: { equals: 2 } });
    expect(run(superAdminOrSelf, null)).toBe(false);
  });
});

describe("the team accounts a database must have", () => {
  it("makes each listed address a super admin, with the local password on a development machine", () => {
    const plan = readTeamPlan({
      SUPER_ADMIN_EMAILS: " VC@example.com, sp@example.com ,r@example.com",
    });
    expect(plan.superAdmins.map((a) => [a.email, a.name, a.role])).toEqual([
      ["vc@example.com", "VC", "superadmin"],
      ["sp@example.com", "SP", "superadmin"],
      ["r@example.com", "R", "superadmin"],
    ]);
    expect(plan.password).toBe(LOCAL_PASSWORD);
    expect(plan.demo).toEqual(DEMO_ACCOUNTS);
  });

  it("never uses the local password or the demo accounts in production", () => {
    const plan = readTeamPlan({ NODE_ENV: "production", SUPER_ADMIN_EMAILS: "vc@example.com" });
    expect(plan.password).toBeUndefined();
    expect(plan.demo).toEqual([]);
  });

  it("keeps one super admin among the demo accounts", () => {
    expect(DEMO_ACCOUNTS.filter((a) => a.role === "superadmin").map((a) => a.email)).toEqual([
      "admin@ohworks.local",
    ]);
  });

  it("reads the rest of the team and refuses a super admin there", () => {
    const plan = readTeamPlan({
      SUPER_ADMIN_EMAILS: "vc@example.com",
      TEAM_ACCOUNTS: JSON.stringify([
        { email: "desk@example.com", name: "News desk", role: "editor" },
        { email: "vc@example.com", role: "admin" },
        { email: "ops.lead@example.com", role: "ops" },
      ]),
    });
    expect(plan.team).toEqual([
      { email: "desk@example.com", name: "News desk", role: "editor" },
      { email: "ops.lead@example.com", name: "Ops Lead", role: "ops" },
    ]);
    expect(plan.notes[0]).toMatch(/vc@example.com is in both/);
    expect(() =>
      readTeamPlan({ TEAM_ACCOUNTS: '[{"email":"x@example.com","role":"superadmin"}]' }),
    ).toThrow(/SUPER_ADMIN_EMAILS/);
  });

  it("explains every bad setting in plain words", () => {
    const bad = (env: Record<string, string>) => () => readTeamPlan(env);
    expect(bad({ SUPER_ADMIN_EMAILS: "vc-at-oohworks" })).toThrow(TeamSetupError);
    expect(bad({ TEAM_ACCOUNTS: "{not json" })).toThrow(/not valid JSON/);
    expect(bad({ TEAM_ACCOUNTS: '[{"email":"a@b.co","role":"boss"}]' })).toThrow(/Use one of/);
    expect(bad({ SUPER_ADMIN_PASSWORD: "short" })).toThrow(/12 characters/);
    expect(bad({ SUPER_ADMIN_RESET: "1", SUPER_ADMIN_EMAILS: "vc@example.com" })).toThrow(
      /needs a new SUPER_ADMIN_PASSWORD/,
    );
    expect(bad({ SUPER_ADMIN_RESET: "1", SUPER_ADMIN_PASSWORD: "a-long-enough-one" })).toThrow(
      /needs SUPER_ADMIN_EMAILS/,
    );
  });

  it("turns an address into a name a super admin can change later", () => {
    expect(nameFromEmail("priya.shah@example.com")).toBe("Priya Shah");
    expect(nameFromEmail("vc@example.com")).toBe("VC");
  });
});
