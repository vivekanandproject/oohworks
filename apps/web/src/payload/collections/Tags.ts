import type { CollectionConfig } from "payload";
import { isOps, isSuperAdmin } from "../access";
import { slugify } from "../hooks";
import { wikidataField } from "./shared";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    group: "People and places",
    description: "One taxonomy for articles, listings and profiles.",
  },
  access: { read: () => true, create: isOps, update: isOps, delete: isSuperAdmin },
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
    wikidataField,
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Place", value: "place" },
        { label: "Format", value: "format" },
        { label: "Company", value: "company" },
        { label: "Theme", value: "theme" },
      ],
    },
    {
      name: "description",
      type: "textarea",
      admin: { description: "Opens the topic page. State a dated fact where one exists." },
    },
  ],
};
