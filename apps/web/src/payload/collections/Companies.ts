import type { CollectionConfig } from "payload";
import { isOps, isSuperAdmin } from "../access";
import { slugify } from "../hooks";

export const Companies: CollectionConfig = {
  slug: "companies",
  admin: { useAsTitle: "name", group: "People and places" },
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
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Media owner", value: "owner" },
        { label: "Agency", value: "agency" },
        { label: "Brand", value: "brand" },
        { label: "Vendor or ad-tech", value: "vendor" },
        { label: "Authority or regulator", value: "authority" },
        { label: "Association", value: "association" },
        { label: "Publisher", value: "publisher" },
      ],
    },
    { name: "logo", type: "upload", relationTo: "media" },
    {
      name: "links",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
      ],
    },
  ],
};
