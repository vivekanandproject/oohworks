import type { CollectionConfig } from "payload";
import { isAdmin, isEditor, isStaff } from "../access";

export const Issues: CollectionConfig = {
  slug: "issues",
  admin: {
    useAsTitle: "subject",
    group: "Newsletter",
    defaultColumns: ["subject", "kind", "sentAt"],
  },
  access: { read: isStaff, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Daily trade briefing", value: "daily" },
        { label: "Weekly buyer digest", value: "weekly" },
      ],
    },
    { name: "subject", type: "text", required: true, maxLength: 80 },
    { name: "preheader", type: "text", maxLength: 120 },
    {
      name: "items",
      type: "array",
      fields: [
        { name: "heading", type: "text" },
        { name: "article", type: "relationship", relationTo: ["articles", "guides", "reports"] },
        { name: "externalUrl", type: "text", admin: { description: "For a link outside ohworks" } },
        { name: "note", type: "textarea", admin: { description: "One line. Say the thing." } },
      ],
    },
    {
      name: "sponsor",
      type: "relationship",
      relationTo: "companies",
      admin: { description: "Labelled in the issue as paid placement" },
    },
    { name: "sentAt", type: "date", admin: { position: "sidebar" } },
    {
      name: "stats",
      type: "group",
      admin: { position: "sidebar" },
      fields: [
        { name: "recipients", type: "number" },
        { name: "opens", type: "number" },
        { name: "clicks", type: "number" },
      ],
    },
  ],
};
