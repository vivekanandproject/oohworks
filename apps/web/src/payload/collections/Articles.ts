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

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "pillar", "workflow", "_status", "updatedAt"],
    group: "Editorial",
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
      name: "pillar",
      type: "select",
      required: true,
      defaultValue: "news",
      options: [
        { label: "News", value: "news" },
        { label: "Analysis", value: "analysis" },
        { label: "Owner academy", value: "academy" },
        { label: "Showcase", value: "showcase" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "lead",
      type: "checkbox",
      defaultValue: false,
      label: "Lead story on the Newsroom front page",
      admin: {
        position: "sidebar",
        description: "The newest piece with this ticked leads the front page.",
      },
    },
    {
      name: "layout",
      type: "select",
      required: true,
      defaultValue: "standard",
      options: [
        { label: "Standard", value: "standard" },
        { label: "Immersive: full-width photo, for showcase pieces", value: "immersive" },
      ],
      admin: { position: "sidebar", description: "Immersive needs a strong, real hero photo." },
    },
    { name: "title", type: "text", required: true, maxLength: 120 },
    slugField,
    {
      name: "standfirst",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: {
        description:
          "One or two sentences under the title. The key fact, with its date, goes here or in the first paragraph.",
      },
    },
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
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "places",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      filterOptions: { kind: { equals: "place" } },
      admin: { position: "sidebar" },
    },
    {
      name: "sources",
      type: "relationship",
      relationTo: "sources",
      hasMany: true,
      admin: { description: "Sources beyond the Fact blocks; all appear in the Sources section" },
    },
    workflowField,
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
    readingTimeField,
    createdByField,
    sponsorField,
    { name: "series", type: "text", admin: { position: "sidebar" } },
    {
      name: "relatedFaces",
      type: "array",
      admin: { description: "Permanent unit IDs of sites this piece is about, e.g. ow8k3x2" },
      fields: [{ name: "permanentId", type: "text", required: true }],
    },
    seoFields,
  ],
};
