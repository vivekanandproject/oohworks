import type { CollectionConfig } from "payload";
import { isAdmin, isWriter } from "../access";

export const Sources: CollectionConfig = {
  slug: "sources",
  admin: {
    useAsTitle: "title",
    group: "Editorial",
    description: "The citation registry. Every Fact points at one of these.",
  },
  access: { read: () => true, create: isWriter, update: isWriter, delete: isAdmin },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "publisher", type: "text", required: true },
    {
      name: "url",
      type: "text",
      admin: { description: "Leave empty for interviews and ohworks data" },
    },
    { name: "publishedOn", type: "date" },
    { name: "retrievedOn", type: "date", required: true },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Report", value: "report" },
        { label: "Filing or official notice", value: "filing" },
        { label: "Press release", value: "press" },
        { label: "Interview", value: "interview" },
        { label: "ohworks data", value: "ohworks" },
        { label: "Article", value: "article" },
      ],
    },
    { name: "notes", type: "textarea" },
  ],
};
