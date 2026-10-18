/**
 * Writes the team's accounts into the database: on every release (through seed.ts, after the
 * migrations) and on every local seed. Staff never sign up, so nobody can sign in to /admin unless
 * they are named here or a super admin added them. The settings are explained in team-accounts.ts.
 *
 * Safe to run any number of times. A password that already exists is never touched, except by
 * SUPER_ADMIN_RESET. Nobody is deleted: someone dropped from the lists is named in the summary, to
 * be suspended in the admin, where the change is recorded.
 */
import { randomBytes } from "node:crypto";
import { APIError, type Payload } from "payload";
import type { User } from "../payload-types";
import { LOCAL_PASSWORD, readTeamPlan, type TeamAccount, TeamSetupError } from "./team-accounts";

async function findUser(payload: Payload, email: string): Promise<User | undefined> {
  const found = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return found.docs[0];
}

export async function seedTeam(payload: Payload, env = process.env): Promise<void> {
  const plan = readTeamPlan(env);
  const summary: string[] = [];
  const say = (what: string, a: TeamAccount, more = "") =>
    summary.push(`  ${what.padEnd(9)} ${a.email.padEnd(32)} ${a.role}${more ? `  (${more})` : ""}`);

  for (const a of plan.superAdmins) {
    const found = await findUser(payload, a.email);
    if (!found) {
      if (!plan.password)
        throw new TeamSetupError(
          `SUPER_ADMIN_PASSWORD is not set, so ${a.email} cannot be given a first password. Set it and release again.`,
        );
      await payload.create({
        collection: "users",
        data: {
          email: a.email,
          name: a.name,
          role: "superadmin",
          active: true,
          mustChangePassword: true,
          password: plan.password,
        },
        overrideAccess: true,
      });
      say("created", a, "changes the password at first sign-in");
      continue;
    }
    const data: Partial<User> & { password?: string } = {};
    if (found.role !== "superadmin") data.role = "superadmin";
    if (found.active === false) data.active = true;
    if (plan.reset) Object.assign(data, { password: plan.password, mustChangePassword: true });
    if (Object.keys(data).length)
      await payload.update({ collection: "users", id: found.id, data, overrideAccess: true });
    if (plan.reset) {
      // Unlocking reads only the email; the generated type asks for a password it never uses.
      await payload.unlock({
        collection: "users",
        data: { email: a.email } as { email: string; password: string },
        overrideAccess: true,
      });
      say("reset", a, "password put back from SUPER_ADMIN_PASSWORD; must be changed at sign-in");
    } else say(Object.keys(data).length ? "restored" : "unchanged", a);
  }

  for (const a of plan.team) {
    const found = await findUser(payload, a.email);
    if (!found) {
      // A password nobody knows. A super admin sets a first one for them in the admin, which they
      // must replace when they sign in. (Emailed set-password links come with the email service.)
      await payload.create({
        collection: "users",
        data: {
          email: a.email,
          name: a.name,
          role: a.role,
          active: true,
          mustChangePassword: true,
          password: randomBytes(24).toString("base64url"),
        },
        overrideAccess: true,
      });
      say("created", a, "a super admin sets their first password");
    } else if (found.role !== a.role) {
      try {
        await payload.update({
          collection: "users",
          id: found.id,
          data: { role: a.role },
          overrideAccess: true,
        });
        say("updated", a, `was ${found.role}`);
      } catch (e) {
        if (!(e instanceof APIError)) throw e;
        say("kept", { ...a, role: found.role }, e.message);
      }
    } else say("unchanged", a);
  }

  for (const a of plan.demo) {
    const found = await findUser(payload, a.email);
    if (!found) {
      await payload.create({
        collection: "users",
        data: { ...a, active: true, mustChangePassword: false, password: LOCAL_PASSWORD },
        overrideAccess: true,
      });
      say("created", a, "local");
    } else if (found.role !== a.role || found.name !== a.name || found.active === false) {
      // Demo accounts are fixtures, so their name follows the role they now have.
      await payload.update({
        collection: "users",
        id: found.id,
        data: { role: a.role, name: a.name, active: true },
        overrideAccess: true,
      });
      say("updated", a, "local");
    }
  }

  // Never leave the admin without a way in, nor empty: with no users at all, the CMS offers
  // "create the first user" to whoever opens /admin first.
  const supers = await payload.count({
    collection: "users",
    where: { and: [{ role: { equals: "superadmin" } }, { active: { equals: true } }] },
    overrideAccess: true,
  });
  if (supers.totalDocs === 0)
    throw new TeamSetupError(
      "There is no active super admin, so nobody could run ohworks. Set SUPER_ADMIN_EMAILS and SUPER_ADMIN_PASSWORD and release again.",
    );

  if (plan.production) {
    const named = new Set([...plan.superAdmins, ...plan.team].map((a) => a.email));
    const others = await payload.find({
      collection: "users",
      where: { active: { equals: true } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    });
    const extra = others.docs
      .filter((u) => !named.has(u.email))
      .map((u) => `${u.email} (${u.role})`);
    if (extra.length)
      plan.notes.push(
        `Also able to sign in, though not in SUPER_ADMIN_EMAILS or TEAM_ACCOUNTS: ${extra.join(", ")}. Suspend anyone who should not be there.`,
      );
  }

  console.log("Team accounts:");
  if (summary.length) console.log(summary.join("\n"));
  for (const note of plan.notes) console.log(`  Note: ${note}`);
  if (!plan.production)
    console.log(
      `  Local sign-in at /admin: admin@ohworks.local (super admin), manager@, editor@, writer@, contributor@ and ops@ohworks.local, password ${LOCAL_PASSWORD}.${
        plan.superAdmins.length && !env.SUPER_ADMIN_PASSWORD
          ? ` New named super admins start with the same password and must change it.`
          : ""
      }`,
    );
}
