import type { Access, FieldAccess } from "payload";

export type Role = "admin" | "editor" | "writer" | "contributor" | "ops";

type UserLike = { role?: Role } | null | undefined;

const roleOf = (user: UserLike): Role | undefined => user?.role;

export const isAdmin: Access = ({ req }) => roleOf(req.user as UserLike) === "admin";
export const isEditor: Access = ({ req }) =>
  ["admin", "editor"].includes(roleOf(req.user as UserLike) ?? "");
export const isStaff: Access = ({ req }) => Boolean(req.user);
export const isWriter: Access = ({ req }) =>
  ["admin", "editor", "writer", "contributor"].includes(roleOf(req.user as UserLike) ?? "");
export const isOps: Access = ({ req }) =>
  ["admin", "editor", "ops"].includes(roleOf(req.user as UserLike) ?? "");

/** Anyone may read published documents; staff may read everything, including drafts. */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

/** Writers and contributors may edit their own drafts; editors and admins may edit anything. */
export const ownDraftOrEditor: Access = ({ req }) => {
  const role = roleOf(req.user as UserLike);
  if (!req.user) return false;
  if (role === "admin" || role === "editor") return true;
  return {
    and: [{ createdBy: { equals: req.user.id } }, { _status: { not_equals: "published" } }],
  };
};

export const fieldEditorOnly: FieldAccess = ({ req }) =>
  ["admin", "editor"].includes(roleOf(req.user as UserLike) ?? "");
export const fieldAdminOnly: FieldAccess = ({ req }) => roleOf(req.user as UserLike) === "admin";
