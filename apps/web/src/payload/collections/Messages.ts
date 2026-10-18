import type { CollectionConfig } from "payload";
import { isStaff, isSuperAdmin } from "../access";

/**
 * What an owner and a buyer write to each other about one request. Written only by the site's own
 * reply and thread pages, each opened from a signed link in an email. ohworks routes these; it never
 * answers for either side.
 */
export const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    useAsTitle: "body",
    group: "Marketplace",
    defaultColumns: ["enquiry", "from", "body", "createdAt"],
    description: "Replies between owners and buyers. Read only: nobody at ohworks writes these.",
  },
  access: { read: isStaff, create: () => false, update: () => false, delete: isSuperAdmin },
  fields: [
    { name: "enquiry", type: "relationship", relationTo: "enquiries", required: true, index: true },
    {
      name: "from",
      type: "select",
      required: true,
      options: [
        { label: "Owner", value: "owner" },
        { label: "Buyer", value: "buyer" },
      ],
    },
    { name: "body", type: "textarea" },
    {
      name: "answers",
      type: "array",
      admin: { description: "The owner's answer for each site in the request" },
      fields: [
        { name: "site", type: "relationship", relationTo: "sites", required: true },
        {
          name: "availability",
          type: "select",
          options: [
            { label: "Available", value: "available" },
            { label: "Not available", value: "unavailable" },
            { label: "Free on other dates", value: "other_dates" },
          ],
        },
        { name: "quote", type: "number", min: 0, label: "Rate quoted a month, in rupees" },
      ],
    },
  ],
};
