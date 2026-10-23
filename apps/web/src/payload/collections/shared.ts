import type { Field } from "payload";
import {
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { Callout, Fact, Figure, Quote } from "../blocks";

/** The editorial editor: headings h2 and h3 only, the four OOHWORKS blocks, Fact inline. */
export const editorialEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    SubscriptFeature(),
    SuperscriptFeature(),
    InlineCodeFeature(),
    LinkFeature({ enabledCollections: ["articles", "guides", "reports", "people", "companies"] }),
    OrderedListFeature(),
    UnorderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    BlocksFeature({ blocks: [Figure, Quote, Callout], inlineBlocks: [Fact] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

export const WORKFLOW_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "In review", value: "in_review" },
  { label: "Fact-checked", value: "fact_checked" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
];

export const slugField: Field = {
  name: "slug",
  type: "text",
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    description: "Set once from the title. Changing it after publish needs a redirect.",
  },
};

export const workflowField: Field = {
  name: "workflow",
  type: "select",
  required: true,
  defaultValue: "draft",
  options: WORKFLOW_OPTIONS,
  admin: {
    position: "sidebar",
    description: "Publishing needs Fact-checked and every Fact ticked.",
  },
};

/**
 * The answer an answer engine lifts: 40 to 60 words that answer the question the headline raises,
 * with the key figure and its date. Shown first on the page, used as the abstract in structured data,
 * the summary in feeds and the opening of the Markdown copy for AI agents.
 */
export const shortAnswerField: Field = {
  name: "shortAnswer",
  type: "textarea",
  maxLength: 500,
  admin: {
    description:
      "40 to 60 words, plain text, no links. Answer the question the headline raises, with the key figure and its date. Shown first on the page and read by search and AI answer engines.",
  },
};

/** Who marked the piece fact-checked, and when. Set by the editorial hook, never typed. */
export const factCheckField: Field = {
  name: "factCheck",
  type: "group",
  admin: {
    position: "sidebar",
    description: "Recorded when an editor marks the piece Fact-checked. Shown on the page.",
  },
  fields: [
    { name: "by", type: "text", admin: { readOnly: true } },
    { name: "at", type: "date", admin: { readOnly: true } },
    { name: "user", type: "relationship", relationTo: "users", admin: { readOnly: true } },
  ],
};

/** An entity's Wikidata item, such as Q1355 for Bengaluru, so search engines and AI tie it to the same thing. */
export const wikidataField: Field = {
  name: "wikidata",
  type: "text",
  admin: {
    description:
      "Optional. The Wikidata item, such as Q1355 for Bengaluru. Links this to the same entity everywhere.",
  },
  validate: (value: unknown) =>
    !value || /^Q\d+$/.test(String(value)) || "A Wikidata item looks like Q1355.",
};

export const createdByField: Field = {
  name: "createdBy",
  type: "relationship",
  relationTo: "users",
  admin: { position: "sidebar", readOnly: true },
};

export const readingTimeField: Field = {
  name: "readingTime",
  type: "number",
  admin: { position: "sidebar", readOnly: true, description: "Minutes, computed from the body" },
};

export const sponsorField: Field = {
  name: "sponsor",
  type: "group",
  admin: { description: "Sponsored pieces carry the label and never sit in News." },
  fields: [
    { name: "enabled", type: "checkbox", defaultValue: false, label: "Sponsored" },
    { name: "company", type: "relationship", relationTo: "companies" },
    { name: "label", type: "text", admin: { description: "Shown as “Sponsored by …”" } },
  ],
};

export const seoFields: Field = {
  name: "seo",
  type: "group",
  admin: { position: "sidebar" },
  fields: [
    {
      name: "title",
      type: "text",
      maxLength: 70,
      admin: { description: "Overrides the page title (under 70 characters)" },
    },
    { name: "description", type: "textarea", maxLength: 160 },
    { name: "noIndex", type: "checkbox", defaultValue: false },
  ],
};
