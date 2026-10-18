import type { CollectionConfig, FieldAccess } from "payload";
import { isOps, isSuperAdmin } from "../access";
import { slugify } from "../hooks";
import { CITY_SELECT } from "../../lib/sites/taxonomy";

const staffOnly: FieldAccess = ({ req }) => Boolean(req.user);

export const Owners: CollectionConfig = {
  slug: "owners",
  admin: {
    useAsTitle: "name",
    group: "Marketplace",
    defaultColumns: ["name", "city", "verified", "source", "submittedAt"],
    description: "Media owners. The owner is always the seller.",
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
    {
      name: "city",
      type: "select",
      options: CITY_SELECT,
      admin: {
        description:
          "The ohworks city the company is in, when it is in one. Set from the place below.",
      },
    },
    {
      name: "location",
      type: "group",
      admin: {
        description: "Where the company says it is based. It can be anywhere in the world.",
      },
      fields: [
        { name: "label", type: "text", admin: { description: "As the owner chose or typed it" } },
        {
          name: "placeId",
          type: "text",
          admin: { description: "The Google place, when it was picked from the search" },
        },
        { name: "country", type: "text", admin: { description: "ISO country code" } },
      ],
    },
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
      admin: {
        description:
          "In the international form, such as +91 98450 00000. Shown on the site only when a buyer asks to see it",
      },
    },
    {
      name: "phoneCountry",
      type: "text",
      admin: { description: "ISO country code of the number" },
    },
    {
      name: "contactName",
      type: "text",
      access: { read: staffOnly },
      admin: { description: "The person who listed. Never shown on the site." },
    },
    {
      name: "gstin",
      type: "text",
      access: { read: staffOnly },
      admin: {
        description:
          "Check it against the document before ticking “Verified owner”. Never shown on the site.",
      },
    },
    {
      name: "loginEmail",
      type: "email",
      unique: true,
      index: true,
      access: { read: staffOnly },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "The address this owner confirms, by code, to manage their own sites",
      },
    },
    {
      // Never a password: its one-way hash. Hidden from every API and from the admin.
      name: "passwordHash",
      type: "text",
      hidden: true,
      access: { read: () => false, create: () => false, update: () => false },
    },
    {
      name: "passwordSetAt",
      type: "date",
      access: { read: staffOnly },
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "When the owner last set a password. Empty means they sign in by emailed code.",
      },
    },
    { name: "failedSignIns", type: "number", defaultValue: 0, admin: { hidden: true } },
    {
      name: "lockedUntil",
      type: "date",
      access: { read: staffOnly },
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Set for 15 minutes after five wrong passwords in a row",
      },
    },
    {
      name: "source",
      type: "select",
      defaultValue: "team",
      options: [
        { label: "Entered by the team", value: "team" },
        { label: "Listed by the owner", value: "self" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "submittedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "When the owner first sent sites for review",
      },
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
