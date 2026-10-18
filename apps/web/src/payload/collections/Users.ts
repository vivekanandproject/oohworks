import type { CollectionConfig } from "payload";
import { fieldSuperAdminOnly, isSuperAdmin, ROLES, staffOrSelf, superAdminOrSelf } from "../access";
import { guardTeamChange, guardTeamDelete, recordSignIn, refuseSuspended } from "../hooks/team";

/**
 * The OOHWORKS team. Nobody signs up: accounts come from the release seed (src/payload/seed-team.ts)
 * or from a super admin here. Owners and buyers are not users; they sign in on the site itself.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
  },
  admin: {
    useAsTitle: "email",
    group: "Operations",
    defaultColumns: ["name", "email", "role", "active", "lastSignInAt"],
    description:
      "The team. Only a super admin can add people, change roles, suspend or delete. Suspend instead of deleting, so the record of who did what stays.",
  },
  access: {
    read: staffOrSelf,
    create: isSuperAdmin,
    update: superAdminOrSelf,
    delete: isSuperAdmin,
    unlock: isSuperAdmin,
  },
  hooks: {
    beforeChange: [guardTeamChange],
    beforeDelete: [guardTeamDelete],
    beforeLogin: [refuseSuspended],
    afterLogin: [recordSignIn],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "writer",
      access: { create: fieldSuperAdminOnly, update: fieldSuperAdminOnly },
      options: ROLES,
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      index: true,
      access: { create: fieldSuperAdminOnly, update: fieldSuperAdminOnly },
      admin: {
        position: "sidebar",
        description: "Untick to suspend: they are signed out at once and cannot sign in again.",
      },
    },
    {
      name: "mustChangePassword",
      type: "checkbox",
      defaultValue: false,
      access: { create: fieldSuperAdminOnly, update: fieldSuperAdminOnly },
      admin: {
        position: "sidebar",
        description:
          "On until they replace the password they were given. Until then the admin shows them only their account page.",
      },
    },
    {
      name: "lastSignInAt",
      type: "date",
      access: { create: () => false, update: () => false },
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
      },
    },
  ],
};
