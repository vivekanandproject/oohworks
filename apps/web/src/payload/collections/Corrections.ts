import type { CollectionConfig } from "payload";
import { isEditor, isSuperAdmin } from "../access";

export const Corrections: CollectionConfig = {
  slug: "corrections",
  admin: {
    group: "Editorial",
    description: "Public. Shown on the piece and on the corrections page.",
    defaultColumns: ["article", "correctedAt"],
  },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isSuperAdmin },
  fields: [
    {
      name: "article",
      type: "relationship",
      relationTo: ["articles", "guides", "reports"],
      required: true,
    },
    {
      name: "note",
      type: "textarea",
      required: true,
      admin: { description: "What was wrong and what it now says" },
    },
    { name: "correctedAt", type: "date", required: true },
  ],
};
