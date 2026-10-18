import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
} from "payload";
import { isStaff, isSuperAdmin } from "../access";

/** Returning changes needs words the owner can act on; deciding records who and when. */
const decide: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const note = String(data.reviewNote ?? originalDoc?.reviewNote ?? "").trim();
  if (data.status === "changes" && !note)
    throw new APIError(
      "Write what needs changing before returning these changes. The owner reads your words.",
      400,
    );
  const decided = data.status === "approved" || data.status === "changes";
  if (decided && data.status !== originalDoc?.status) {
    data.decidedAt = new Date().toISOString();
    if (req.user) data.decidedBy = req.user.id;
  }
  return data;
};

/**
 * Approving puts the changes on the live site and tells the owner; returning tells them why. The work
 * is loaded only when a decision is made (src/lib/owners/site-changes.ts), so the CMS's own commands,
 * which read this file, never load the site's form rules.
 */
const settle: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || doc.status === previousDoc?.status) return doc;
  if (doc.status !== "approved" && doc.status !== "changes") return doc;
  const { settleChange } = await import("../../lib/owners/site-changes");
  await settleChange(req, doc);
  return doc;
};

/**
 * An owner's changes to a site that is already live. Buyers keep seeing the live version until the
 * team approves; price and availability are never here, because the owner changes those at once.
 * Made only by the owner's edit form (/api/owner/site/); the team decides here.
 */
export const SiteChanges: CollectionConfig = {
  slug: "site-changes",
  labels: { singular: "Change to a live site", plural: "Changes to live sites" },
  admin: {
    useAsTitle: "unitId",
    group: "Marketplace",
    defaultColumns: ["unitId", "status", "summary", "submittedAt"],
    description:
      "Owners' changes to live sites. Buyers see the live version until you approve. Read the summary, check the pin if the location moved, then set Approved, or Returned with a note.",
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isSuperAdmin },
  hooks: { beforeChange: [decide], afterChange: [settle] },
  fields: [
    { name: "site", type: "relationship", relationTo: "sites", required: true, index: true },
    { name: "owner", type: "relationship", relationTo: "owners", index: true },
    { name: "unitId", type: "text", required: true, index: true },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "submitted",
      index: true,
      options: [
        { label: "Waiting for the team", value: "submitted" },
        { label: "Returned to the owner", value: "changes" },
        { label: "Approved: on the live site", value: "approved" },
        { label: "Withdrawn by the owner", value: "withdrawn" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "summary",
      type: "textarea",
      admin: { readOnly: true, description: "What the owner changed, from what to what" },
    },
    {
      name: "reviewNote",
      type: "textarea",
      admin: { description: "Needed to return the changes. The owner reads these words." },
    },
    {
      name: "moved",
      type: "checkbox",
      admin: {
        readOnly: true,
        description:
          "The pin moved more than 25 m. Approving clears Verified location until you check it again.",
      },
    },
    {
      name: "proposed",
      type: "json",
      admin: { readOnly: true, description: "The owner's form as sent" },
    },
    { name: "submittedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    {
      name: "decidedBy",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "decidedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
  ],
};
