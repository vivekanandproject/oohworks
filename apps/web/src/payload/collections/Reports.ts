import type { CollectionConfig } from "payload";
import { isAdmin, isEditor, publishedOrStaff } from "../access";
import { editorialBeforeChange } from "../hooks";
import {
  createdByField,
  editorialEditor,
  readingTimeField,
  seoFields,
  slugField,
  workflowField,
} from "./shared";

export const Reports: CollectionConfig = {
  slug: "reports",
  admin: {
    useAsTitle: "title",
    group: "Editorial",
    description: "The data pillar: price index and market reports with method notes.",
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: { beforeChange: [editorialBeforeChange] },
  fields: [
    { name: "title", type: "text", required: true },
    slugField,
    { name: "period", type: "text", required: true, admin: { description: "e.g. Q1 2027" } },
    { name: "standfirst", type: "textarea", required: true, maxLength: 300 },
    { name: "body", type: "richText", required: true, editor: editorialEditor },
    {
      name: "methodNotes",
      type: "richText",
      editor: editorialEditor,
      admin: { description: "How the figures were computed, sample sizes, caveats" },
    },
    {
      name: "dataset",
      type: "upload",
      relationTo: "media",
      admin: { description: "Downloadable data behind the report" },
    },
    {
      name: "charts",
      type: "array",
      fields: [
        { name: "title", type: "text", required: true },
        {
          name: "series",
          type: "json",
          required: true,
          admin: { description: '[{ "label": "Bengaluru", "points": [["2026-Q3", 78000]] }]' },
        },
      ],
    },
    {
      name: "authors",
      type: "relationship",
      relationTo: "people",
      hasMany: true,
      required: true,
      admin: { position: "sidebar" },
    },
    { name: "sources", type: "relationship", relationTo: "sources", hasMany: true },
    workflowField,
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
    readingTimeField,
    createdByField,
    seoFields,
  ],
};
