import type { CollectionConfig } from "payload";
import { isAdmin, isStaff } from "../access";

/** A buyer's request about one site. Created only by the site's own API, and passed straight to the owner once verified. */
export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  admin: {
    useAsTitle: "reference",
    group: "Marketplace",
    defaultColumns: ["reference", "site", "owner", "status", "createdAt"],
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isAdmin },
  fields: [
    { name: "reference", type: "text", required: true, unique: true, index: true },
    { name: "site", type: "relationship", relationTo: "sites", required: true },
    { name: "owner", type: "relationship", relationTo: "owners", required: true },
    { name: "email", type: "email", required: true, index: true },
    { name: "dateFrom", type: "date", required: true },
    { name: "dateTo", type: "date", required: true },
    { name: "brand", type: "text", required: true, label: "Brand and category" },
    { name: "budget", type: "number", min: 0, label: "Budget a month, in rupees" },
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
  ],
};
