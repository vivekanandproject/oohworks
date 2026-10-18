import type { CollectionConfig } from "payload";
import { isStaff, isSuperAdmin } from "../access";

/** People who asked for the briefing. Created only by the site's own API; double opt-in arrives with the newsletter build. */
export const Subscribers: CollectionConfig = {
  slug: "subscribers",
  admin: {
    useAsTitle: "email",
    group: "Newsletter",
    defaultColumns: ["email", "lists", "confirmed", "createdAt"],
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isSuperAdmin },
  fields: [
    { name: "email", type: "email", required: true, unique: true, index: true },
    {
      name: "lists",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["daily"],
      options: [
        { label: "Daily trade briefing", value: "daily" },
        { label: "Weekly buyer digest", value: "weekly" },
      ],
    },
    { name: "source", type: "text", admin: { description: "The page they signed up on" } },
    { name: "confirmed", type: "checkbox", defaultValue: false },
    { name: "unsubscribedAt", type: "date" },
  ],
};
