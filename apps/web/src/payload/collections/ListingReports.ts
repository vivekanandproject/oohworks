import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { isStaff, isSuperAdmin } from "../access";

/** How long the team has to answer a report: two days. */
export const REPORT_RESPOND_HOURS = 48;

export const REPORT_REASONS = [
  { label: "The details are wrong (size, price, lighting)", value: "details" },
  { label: "It is not where the pin says", value: "location" },
  { label: "The photographs are not of this site", value: "photos" },
  { label: "It does not exist, or has been taken down", value: "gone" },
  { label: "It has no permit, or breaks the rules", value: "permit" },
  { label: "Someone else sells this face", value: "seller" },
  { label: "Something else", value: "other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

/** Records who closed a report and when, the moment it is resolved or dismissed. */
const stampHandling: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const closing = data.status === "resolved" || data.status === "dismissed";
  const wasClosed = originalDoc?.status === "resolved" || originalDoc?.status === "dismissed";
  if (closing && !wasClosed) {
    data.handledAt = new Date().toISOString();
    if (req.user) data.handledBy = req.user.id;
  }
  if (!closing && wasClosed) {
    data.handledAt = null;
    data.handledBy = null;
  }
  return data;
};

/**
 * What buyers and passers-by tell us about a listing: wrong details, a pin in the wrong place, photos
 * of another face, a site that has gone, one sold twice. Made only by the report form on each site page
 * (/api/report/); the team answers within two days and, when a report is right, corrects or takes down
 * the site from the Sites list.
 */
export const ListingReports: CollectionConfig = {
  slug: "listing-reports",
  labels: { singular: "Listing report", plural: "Listing reports" },
  admin: {
    useAsTitle: "unitId",
    group: "Marketplace",
    defaultColumns: ["unitId", "reason", "status", "respondBy", "createdAt"],
    description:
      "Reports about listings from the site. Answer each within two days. When one is right, correct the site or take it down in Sites, then mark the report resolved with what was done.",
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isSuperAdmin },
  hooks: { beforeChange: [stampHandling] },
  fields: [
    { name: "site", type: "relationship", relationTo: "sites", index: true },
    {
      name: "unitId",
      type: "text",
      required: true,
      index: true,
      admin: { description: "The site's unit ID, kept even if the site is later deleted" },
    },
    {
      name: "reason",
      type: "select",
      required: true,
      options: REPORT_REASONS.map((r) => ({ label: r.label, value: r.value })),
    },
    { name: "message", type: "textarea", admin: { description: "What they saw, in their words" } },
    {
      name: "email",
      type: "email",
      admin: { description: "Only if they asked to hear back. Never shown on the site." },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      index: true,
      options: [
        { label: "New", value: "new" },
        { label: "Looking into it", value: "reviewing" },
        { label: "Resolved: the listing was changed or taken down", value: "resolved" },
        { label: "Dismissed: the listing was right", value: "dismissed" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "respondBy",
      type: "date",
      index: true,
      admin: {
        position: "sidebar",
        description: "Two days after it arrived",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "resolution",
      type: "textarea",
      admin: { description: "What was checked and what was done. Kept for the record." },
    },
    {
      name: "handledBy",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "handledAt", type: "date", admin: { position: "sidebar", readOnly: true } },
  ],
};
