import type { CollectionConfig } from "payload";
import { fieldEditorOnly, isAdmin, isEditor } from "../access";
import { slugify } from "../hooks";

export const People: CollectionConfig = {
  slug: "people",
  admin: {
    useAsTitle: "name",
    group: "People and places",
    description: "Authors and verified contributors. Each gets a public page.",
  },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && data.name) data.slug = slugify(data.name);
        return data;
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", unique: true, index: true, admin: { position: "sidebar" } },
    {
      name: "role",
      type: "text",
      required: true,
      admin: { description: "e.g. Editor, India; Contributor; Media owner, Bengaluru" },
    },
    { name: "bio", type: "textarea", required: true },
    {
      name: "credentials",
      type: "array",
      fields: [{ name: "item", type: "text", required: true }],
      admin: { description: "Shown on the author card: years, titles, memberships" },
    },
    { name: "photo", type: "upload", relationTo: "media" },
    {
      name: "links",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
      ],
    },
    { name: "email", type: "email" },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      access: { update: fieldEditorOnly },
      admin: { position: "sidebar", description: "Identity and credentials checked by an editor" },
    },
    { name: "verifiedAt", type: "date", admin: { position: "sidebar" } },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", description: "The login this person writes with, if any" },
    },
  ],
};
