import type { Access, FieldAccess } from "payload";

export type Role = "superadmin" | "admin" | "editor" | "writer" | "contributor" | "ops";

export const ROLES: { label: string; value: Role }[] = [
  { label: "Super admin (controls the platform)", value: "superadmin" },
  { label: "Admin", value: "admin" },
  { label: "Editor (can publish)", value: "editor" },
  { label: "Writer", value: "writer" },
  { label: "Contributor", value: "contributor" },
  { label: "Ops (media and tags)", value: "ops" },
];

type UserLike =
  | {
      id?: number | string;
      role?: Role | null;
      active?: boolean | null;
      mustChangePassword?: boolean | null;
    }
  | null
  | undefined;

/** Signed in and not suspended. Payload reads the user afresh on every request, so a suspension holds at once. */
export const isActiveUser = (user: UserLike): boolean => Boolean(user) && user?.active !== false;

/**
 * The role someone may act with: none while suspended, and none while they still hold a password
 * they were given, which they must replace before doing anything else.
 */
const roleOf = (user: UserLike): Role | undefined =>
  isActiveUser(user) && !user?.mustChangePassword ? (user?.role ?? undefined) : undefined;

const oneOf =
  (...roles: Role[]): Access =>
  ({ req }) =>
    roles.includes(roleOf(req.user as UserLike) as Role);

export const isSuperAdmin: Access = oneOf("superadmin");
export const isAdmin: Access = oneOf("superadmin", "admin");
export const isEditor: Access = oneOf("superadmin", "admin", "editor");
export const isWriter: Access = oneOf("superadmin", "admin", "editor", "writer", "contributor");
export const isOps: Access = oneOf("superadmin", "admin", "editor", "ops");
export const isStaff: Access = ({ req }) => Boolean(roleOf(req.user as UserLike));

/** Who may put a piece on the website. The fact-check gate in the editorial hook still applies to them. */
export const canPublish = (user: unknown): boolean =>
  ["superadmin", "admin", "editor"].includes(roleOf(user as UserLike) ?? "");

/** Anyone may read published documents; staff may read everything, including drafts. */
export const publishedOrStaff: Access = ({ req }) => {
  if (roleOf(req.user as UserLike)) return true;
  return { _status: { equals: "published" } };
};

/** Writers and contributors may edit their own drafts; editors and everyone above may edit anything. */
export const ownDraftOrEditor: Access = ({ req }) => {
  const role = roleOf(req.user as UserLike);
  if (!role || !req.user) return false;
  if (canPublish(req.user)) return true;
  return {
    and: [{ createdBy: { equals: req.user.id } }, { _status: { not_equals: "published" } }],
  };
};

/**
 * Team accounts: a super admin sees and changes every one. Anyone else who is active sees and changes
 * only their own, which is how someone still holding a given password reaches the page to replace it.
 */
export const superAdminOrSelf: Access = ({ req }) => {
  const user = req.user as UserLike;
  if (roleOf(user) === "superadmin") return true;
  if (!isActiveUser(user) || user?.id === undefined) return false;
  return { id: { equals: user.id } };
};

/** Team accounts are listed to the whole team, and to someone who must change their password, only their own. */
export const staffOrSelf: Access = ({ req }) => {
  const user = req.user as UserLike;
  if (roleOf(user)) return true;
  if (!isActiveUser(user) || user?.id === undefined) return false;
  return { id: { equals: user.id } };
};

export const fieldEditorOnly: FieldAccess = ({ req }) =>
  ["superadmin", "admin", "editor"].includes(roleOf(req.user as UserLike) ?? "");
export const fieldSuperAdminOnly: FieldAccess = ({ req }) =>
  roleOf(req.user as UserLike) === "superadmin";
