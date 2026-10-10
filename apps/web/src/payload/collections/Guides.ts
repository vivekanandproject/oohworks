import type { CollectionConfig } from "payload";
import { isAdmin, isWriter, ownDraftOrEditor, publishedOrStaff } from "../access";
import { editorialBeforeChange, refreshAfterChange, refreshAfterDelete } from "../hooks";
import {
  createdByField,
  editorialEditor,
  readingTimeField,
  seoFields,
  slugField,
  sponsorField,
  workflowField,
} from "./shared";

export const Guides: CollectionConfig = {
  slug: "guides",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "workflow", "_status", "lastRefreshedAt"],
    group: "Editorial",
    description: "Evergreen. Refreshed quarterly from live data.",
  },
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 },
  access: { read: publishedOrStaff, create: isWriter, update: ownDraftOrEditor, delete: isAdmin },
  hooks: {
    beforeChange: [editorialBeforeChange],
    afterChange: [refreshAfterChange],
    afterDelete: [refreshAfterDelete],
  },
  fields: [
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "cost",
      options: [
        { label: "Cost guide (city or format)", value: "cost" },
        { label: "Explainer", value: "explainer" },
        { label: "Comparison", value: "comparison" },
        { label: "How to measure", value: "measurement" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "title", type: "text", required: true, maxLength: 120 },
    slugField,
    { name: "standfirst", type: "textarea", required: true, maxLength: 300 },
    { name: "hero", type: "upload", relationTo: "media" },
    { name: "body", type: "richText", required: true, editor: editorialEditor },
    {
      name: "authors",
      type: "relationship",
      relationTo: "people",
      hasMany: true,
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "city",
      type: "relationship",
      relationTo: "tags",
      filterOptions: { kind: { equals: "place" } },
      admin: { position: "sidebar" },
    },
    {
      name: "format",
      type: "relationship",
      relationTo: "tags",
      filterOptions: { kind: { equals: "format" } },
      admin: { position: "sidebar" },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    { name: "sources", type: "relationship", relationTo: "sources", hasMany: true },
    {
      name: "listingQuery",
      type: "group",
      admin: { description: "“Sites in this area” strip. Renders nothing until real sites match." },
      fields: [
        { name: "area", type: "text", admin: { description: "City or locality slug" } },
        { name: "format", type: "text" },
      ],
    },
    { name: "tocEnabled", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
    {
      name: "lastRefreshedAt",
      type: "date",
      admin: { position: "sidebar", description: "Shown to readers as “figures refreshed”" },
    },
    workflowField,
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
    readingTimeField,
    createdByField,
    sponsorField,
    seoFields,
  ],
};
