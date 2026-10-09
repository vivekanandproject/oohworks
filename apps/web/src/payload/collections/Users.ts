import type { CollectionConfig } from "payload";
import { fieldAdminOnly, isAdmin, isStaff } from "../access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", group: "Operations" },
  access: { read: isStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "writer",
      access: { update: fieldAdminOnly },
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor (can publish)", value: "editor" },
        { label: "Writer", value: "writer" },
        { label: "Contributor", value: "contributor" },
        { label: "Ops (media and tags)", value: "ops" },
      ],
    },
  ],
};
