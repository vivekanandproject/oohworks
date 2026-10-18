import type { CollectionConfig } from "payload";
import { isAdmin, isSuperAdmin } from "../access";

/** Emails that would have been sent. Filled only when no email service is configured, so the team can see them locally. */
export const Outbox: CollectionConfig = {
  slug: "outbox",
  admin: {
    useAsTitle: "subject",
    group: "Operations",
    defaultColumns: ["to", "subject", "kind", "createdAt"],
    description:
      "Emails that would have been sent. Filled only when no email service is configured.",
  },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isSuperAdmin },
  fields: [
    { name: "to", type: "email", required: true, index: true },
    { name: "subject", type: "text", required: true },
    { name: "text", type: "textarea", required: true },
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Verification code", value: "code" },
        { label: "Enquiry to an owner", value: "owner_enquiry" },
        { label: "Confirmation to a buyer", value: "buyer_confirmation" },
        { label: "An owner's reply, to the buyer", value: "owner_reply" },
        { label: "A buyer's follow-up, to the owner", value: "buyer_message" },
        { label: "A sign-in code for an owner", value: "owner_code" },
        { label: "A notice to an owner about their sites", value: "owner_notice" },
        { label: "A notice to the ohworks team", value: "team_notice" },
      ],
    },
  ],
};
