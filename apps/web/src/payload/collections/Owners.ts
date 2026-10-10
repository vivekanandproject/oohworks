import type { CollectionConfig, FieldAccess } from "payload";
import { isAdmin, isOps } from "../access";
import { slugify } from "../hooks";
import { CITY_SELECT } from "../../lib/sites/taxonomy";

const staffOnly: FieldAccess = ({ req }) => Boolean(req.user);

export const Owners: CollectionConfig = {
  slug: "owners",
  admin: {
    useAsTitle: "name",
    group: "Marketplace",
    defaultColumns: ["name", "city", "verified", "medianReplyHours"],
    description: "Media owners. The owner is always the seller.",
  },
  access: { read: () => true, create: isOps, update: isOps, delete: isAdmin },
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
    { name: "city", type: "select", options: CITY_SELECT },
    { name: "about", type: "textarea" },
    {
      name: "contactEmail",
      type: "email",
      required: true,
      access: { read: staffOnly },
      admin: { description: "Enquiries go here. Never shown on the site." },
    },
    {
      name: "phone",
      type: "text",
      admin: { description: "Shown on the site only when a buyer asks to see it" },
    },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      label: "Verified owner: company documents and contact details checked",
      admin: { position: "sidebar" },
    },
    { name: "verifiedOn", type: "date", admin: { position: "sidebar" } },
    {
      name: "medianReplyHours",
      type: "number",
      min: 0,
      admin: { position: "sidebar", description: "Under 24 earns “Replies in under a day”" },
    },
    {
      name: "sample",
      type: "checkbox",
      defaultValue: false,
      label: "Sample owner, for development",
      admin: { position: "sidebar" },
    },
  ],
};
