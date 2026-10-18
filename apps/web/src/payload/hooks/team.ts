import {
  APIError,
  type CollectionAfterLoginHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeLoginHook,
  type PayloadRequest,
} from "payload";
import { PASSWORD_MIN } from "../team-accounts";

/**
 * The rules about team accounts that no screen, script or API call can get round. They live here, on
 * the collection, rather than in the admin's forms.
 */

type TeamUser = {
  id: number | string;
  role?: string | null;
  active?: boolean | null;
};

const same = (a: TeamUser | null | undefined, b: TeamUser | null | undefined): boolean =>
  Boolean(a && b && String(a.id) === String(b.id));

/** Active super admins other than the one given. */
async function otherSuperAdmins(req: PayloadRequest, id: number | string): Promise<number> {
  const { totalDocs } = await req.payload.count({
    collection: "users",
    where: {
      and: [
        { role: { equals: "superadmin" } },
        { active: { equals: true } },
        { id: { not_equals: id } },
      ],
    },
    overrideAccess: true,
    req,
  });
  return totalDocs;
}

const LAST_SUPER_ADMIN =
  "ohworks must always have an active super admin. Make someone else a super admin first.";

export const guardTeamChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const actor = req.user as TeamUser | null;
  const before = originalDoc as TeamUser | undefined;
  const self = same(actor, before);
  const role = data.role ?? before?.role;
  const active = data.active ?? before?.active ?? true;

  if (self && data.role !== undefined && data.role !== before?.role)
    throw new APIError("Nobody can change their own role. Ask another super admin.", 403);
  if (self && data.active === false && before?.active !== false)
    throw new APIError("Nobody can suspend their own account.", 403);
  if (
    actor &&
    role === "superadmin" &&
    before?.role !== "superadmin" &&
    actor.role !== "superadmin"
  )
    throw new APIError("Only a super admin can make someone a super admin.", 403);

  if (
    operation === "update" &&
    before?.role === "superadmin" &&
    before.active !== false &&
    (role !== "superadmin" || active === false) &&
    (await otherSuperAdmins(req, before.id)) === 0
  )
    throw new APIError(LAST_SUPER_ADMIN, 400);

  if (typeof data.password === "string" && data.password) {
    if (data.password.length < PASSWORD_MIN)
      throw new APIError(`A password needs at least ${PASSWORD_MIN} characters.`, 400);
    // Replacing your own password is what was asked of you. A password set for someone else is one
    // they were given, so they must replace it when they first sign in with it.
    if (operation === "update" && self) data.mustChangePassword = false;
    else if (operation === "update" && actor) data.mustChangePassword = true;
  }

  // A suspension signs the person out everywhere, not only at their next sign-in.
  if (operation === "update" && data.active === false && before?.active !== false)
    data.sessions = [];
  return data;
};

export const guardTeamDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const actor = req.user as TeamUser | null;
  if (actor && String(actor.id) === String(id))
    throw new APIError("Nobody can delete their own account.", 403);
  const doomed = (await req.payload.findByID({
    collection: "users",
    id,
    depth: 0,
    overrideAccess: true,
    req,
  })) as TeamUser | null;
  if (
    doomed?.role === "superadmin" &&
    doomed.active !== false &&
    (await otherSuperAdmins(req, id)) === 0
  )
    throw new APIError(LAST_SUPER_ADMIN, 400);
};

export const refuseSuspended: CollectionBeforeLoginHook = ({ user }) => {
  if ((user as TeamUser).active === false)
    throw new APIError("This account is suspended. Ask a super admin to restore it.", 403);
  return user;
};

/** Written straight to the row, so a sign-in never runs the guards above or touches anyone's sessions. */
export const recordSignIn: CollectionAfterLoginHook = async ({ user, req }) => {
  await req.payload.db.updateOne({
    collection: "users",
    id: user.id,
    // A null updatedAt tells the database adapter to leave "Last Modified" alone: signing in is not an edit.
    data: { lastSignInAt: new Date().toISOString(), updatedAt: null },
    req,
    returning: false,
  });
  return user;
};
