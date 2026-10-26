import type { CollectionConfig } from "payload";
import { isStaff, isSuperAdmin } from "../access";

/** A buyer's request about one site. Created only by the site's own API, and passed straight to the owner once verified. */
export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  admin: {
    useAsTitle: "reference",
    group: "Marketplace",
    defaultColumns: ["reference", "site", "owner", "status", "createdAt"],
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isSuperAdmin },
  fields: [
    { name: "reference", type: "text", required: true, unique: true, index: true },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
      admin: { description: "The first site asked about" },
    },
    {
      name: "sites",
      type: "relationship",
      relationTo: "sites",
      hasMany: true,
      admin: { description: "Every site in this request. All belong to the one owner it went to." },
    },
    {
      name: "plan",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Set when a buyer asked several owners at once. Each owner sees only their own request.",
      },
    },
    { name: "lead", type: "checkbox", defaultValue: true, admin: { hidden: true } },
    { name: "owner", type: "relationship", relationTo: "owners", required: true },
    { name: "email", type: "email", required: true, index: true },
    { name: "dateFrom", type: "date", required: true },
    { name: "dateTo", type: "date", required: true },
    { name: "brand", type: "text", required: true, label: "Brand and category" },
    { name: "budget", type: "number", min: 0, label: "Budget a month, in the currency below" },
    {
      name: "budgetCurrency",
      type: "text",
      defaultValue: "INR",
      admin: { description: "ISO code" },
    },
    {
      name: "artwork",
      type: "select",
      required: true,
      defaultValue: "not_started",
      options: [
        { label: "Ready", value: "ready" },
        { label: "In progress", value: "in_progress" },
        { label: "Not started", value: "not_started" },
      ],
    },
    { name: "message", type: "textarea" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Waiting for the buyer's code", value: "pending" },
        { label: "Sent to the owner", value: "sent" },
        { label: "Owner replied", value: "replied" },
        { label: "Closed", value: "closed" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "codeHash", type: "text", admin: { hidden: true } },
    { name: "codeExpiresAt", type: "date", admin: { hidden: true } },
    { name: "attempts", type: "number", defaultValue: 0, admin: { hidden: true } },
    { name: "verifiedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    { name: "sentAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    {
      name: "repliedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "The owner's first reply through OOHWORKS",
      },
    },
  ],
};
