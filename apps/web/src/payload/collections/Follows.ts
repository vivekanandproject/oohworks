import type { CollectionConfig } from "payload";
import { isAdmin, isStaff } from "../access";

/** A buyer who wants to hear when the first sites in a city or format are listed. Created only by the site's own API. */
export const Follows: CollectionConfig = {
  slug: "follows",
  admin: {
    useAsTitle: "email",
    group: "Newsletter",
    defaultColumns: ["email", "city", "format", "source", "createdAt"],
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isAdmin },
  fields: [
    { name: "email", type: "email", required: true, index: true },
    {
      name: "city",
      type: "text",
      index: true,
      admin: { description: "City slug, e.g. bengaluru" },
    },
    { name: "format", type: "text", admin: { description: "Format slug, e.g. hoarding" } },
    { name: "query", type: "text", admin: { description: "What they searched for" } },
    {
      name: "search",
      type: "text",
      admin: { description: "The search they asked to be told about, as its address on the site" },
    },
    {
      name: "source",
      type: "select",
      required: true,
      defaultValue: "search",
      options: [
        { label: "Search page", value: "search" },
        { label: "Saved search", value: "saved_search" },
        { label: "Hub page", value: "hub" },
        { label: "Guide", value: "guide" },
      ],
    },
    {
      name: "confirmed",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Double opt-in lands with the newsletter build" },
    },
    { name: "unsubscribedAt", type: "date" },
  ],
};
