import type { Block } from "payload";

/**
 * Fact: a figure, its source and the date it is true for. Inline, inside a sentence.
 * It cannot be saved without a source, and a piece cannot be published until an editor
 * has ticked every Fact against its source.
 */
export const Fact: Block = {
  slug: "fact",
  interfaceName: "FactBlock",
  labels: { singular: "Fact", plural: "Facts" },
  fields: [
    {
      name: "value",
      type: "text",
      required: true,
      admin: {
        description:
          "The figure exactly as it should read, with its currency or percent sign: $54.2 bn, 15%, ₹ 78,000",
      },
    },
    {
      name: "unit",
      type: "text",
      admin: { description: "What follows it, if anything: a month, sites, of digital spend" },
    },
    { name: "source", type: "relationship", relationTo: "sources", required: true },
    {
      name: "asOf",
      type: "date",
      required: true,
      admin: { description: "The date the figure is true for" },
    },
    {
      name: "label",
      type: "text",
      admin: {
        description:
          "Optional. What it measures, in a few words. Facts with a label appear in the Key facts panel beside the piece.",
      },
    },
    {
      name: "checked",
      type: "checkbox",
      defaultValue: false,
      label: "Checked against the source by an editor",
    },
  ],
};

export const Figure: Block = {
  slug: "figure",
  interfaceName: "FigureBlock",
  fields: [
    { name: "media", type: "upload", relationTo: "media", required: true },
    { name: "caption", type: "textarea" },
    {
      name: "nightShot",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Shown with the lit-tint glow" },
    },
  ],
};

export const Quote: Block = {
  slug: "quote",
  interfaceName: "QuoteBlock",
  fields: [
    { name: "text", type: "textarea", required: true },
    {
      name: "person",
      type: "relationship",
      relationTo: "people",
      admin: { description: "Link the person if they have a page" },
    },
    { name: "name", type: "text", admin: { description: "If the person has no page" } },
    { name: "role", type: "text" },
  ],
};

export const Callout: Block = {
  slug: "callout",
  interfaceName: "CalloutBlock",
  fields: [
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "note",
      options: [
        { label: "Note", value: "note" },
        { label: "Charter line", value: "charter" },
        { label: "Warning", value: "warning" },
      ],
    },
    { name: "body", type: "textarea", required: true },
  ],
};
