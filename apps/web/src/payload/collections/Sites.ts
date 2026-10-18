import type { CollectionConfig } from "payload";
import { isOps, isSuperAdmin, publishedOrStaff } from "../access";
import { siteAfterChange, siteBeforeChange } from "../hooks/sites";
import {
  CITY_SELECT,
  ENVIRONMENT_SELECT,
  FORMAT_SELECT,
  LIGHTING_SELECT,
} from "../../lib/sites/taxonomy";

/** One record per physical face. Its public page carries everything a buyer needs before asking. */
export const Sites: CollectionConfig = {
  slug: "sites",
  admin: {
    useAsTitle: "title",
    group: "Marketplace",
    defaultColumns: ["title", "city", "owner", "review", "submittedAt", "qualityScore", "_status"],
    description: "One record per physical face. The id and address never change once published.",
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: isOps, update: isOps, delete: isSuperAdmin },
  hooks: { beforeChange: [siteBeforeChange], afterChange: [siteAfterChange] },
  fields: [
    {
      name: "title",
      type: "text",
      admin: { readOnly: true, description: "Built from the size, format and road" },
    },
    { name: "slug", type: "text", index: true, admin: { readOnly: true, position: "sidebar" } },
    {
      name: "review",
      type: "select",
      index: true,
      options: [
        { label: "Draft, still with the owner", value: "draft" },
        { label: "In review: waiting for us", value: "submitted" },
        { label: "Needs changes: returned to the owner", value: "changes" },
        { label: "Approved", value: "approved" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Filter the list by “In review” to see what is waiting. Publishing a site approves it and emails the owner.",
      },
    },
    {
      name: "reviewNote",
      type: "textarea",
      admin: {
        position: "sidebar",
        description: "Required when returning a site. The owner reads these exact words.",
      },
    },
    { name: "submittedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    {
      name: "duplicateNote",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Set when another site sits within 25 m, facing the same way",
      },
    },
    {
      name: "photoNote",
      type: "textarea",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => Boolean(data?.photoNote),
        description:
          "Photographs that look the same as one on another listing. Check they are of this face before approving.",
      },
    },
    {
      name: "ownerRef",
      type: "text",
      index: true,
      admin: { position: "sidebar", description: "The owner's own code for this site" },
    },
    {
      name: "source",
      type: "select",
      defaultValue: "team",
      options: [
        { label: "Entered by the team", value: "team" },
        { label: "The owner's form", value: "form" },
        { label: "The owner's spreadsheet", value: "sheet" },
        { label: "The owner's media kit, read by Claude", value: "kit" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "kitNote",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.source === "kit",
        description: "Where in the media kit Claude found this site, and what it was unsure of",
      },
    },
    {
      name: "permanentId",
      type: "text",
      unique: true,
      index: true,
      admin: { readOnly: true, position: "sidebar", description: "Assigned once. Never changes." },
    },
    {
      name: "qualityScore",
      type: "number",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Completeness out of 100. Higher ranks better.",
      },
    },
    {
      name: "sample",
      type: "checkbox",
      defaultValue: false,
      label: "Sample listing: labelled on the site and never indexed",
      admin: { position: "sidebar" },
    },
    {
      name: "removed",
      type: "checkbox",
      defaultValue: false,
      label: "Taken down: the page says the site is gone",
      admin: { position: "sidebar" },
    },
    { name: "owner", type: "relationship", relationTo: "owners", required: true },
    {
      type: "tabs",
      tabs: [
        {
          label: "Site",
          fields: [
            { name: "format", type: "select", required: true, options: FORMAT_SELECT },
            {
              name: "environment",
              type: "select",
              required: true,
              defaultValue: "roadside",
              options: ENVIRONMENT_SELECT,
            },
            {
              type: "row",
              fields: [
                {
                  name: "width",
                  type: "number",
                  required: true,
                  min: 0.1,
                  admin: { width: "33%" },
                },
                {
                  name: "height",
                  type: "number",
                  required: true,
                  min: 0.1,
                  admin: { width: "33%" },
                },
                {
                  name: "sizeUnit",
                  type: "select",
                  required: true,
                  defaultValue: "ft",
                  options: [
                    { label: "feet", value: "ft" },
                    { label: "metres", value: "m" },
                  ],
                  admin: { width: "34%" },
                },
              ],
            },
            { name: "widthMm", type: "number", admin: { hidden: true } },
            { name: "heightMm", type: "number", admin: { hidden: true } },
            {
              name: "lighting",
              type: "select",
              required: true,
              defaultValue: "front-lit",
              options: LIGHTING_SELECT,
            },
            { name: "litHours", type: "text", admin: { description: "e.g. 6 pm to 11 pm" } },
            {
              name: "heightAboveRoadM",
              type: "number",
              min: 0,
              label: "Height above the road, metres",
            },
            {
              name: "digital",
              type: "group",
              admin: {
                condition: (data) => data?.format === "led-screen" || data?.lighting === "digital",
              },
              fields: [
                { name: "resolution", type: "text", admin: { description: "e.g. 1920 × 1080" } },
                { name: "spotSeconds", type: "number", min: 1 },
                { name: "loopSeconds", type: "number", min: 1 },
                {
                  name: "advertisers",
                  type: "number",
                  min: 1,
                  admin: { description: "How many advertisers share the loop" },
                },
                {
                  name: "exchanges",
                  type: "text",
                  admin: { description: "Programmatic exchanges it is available through, if any" },
                },
              ],
            },
          ],
        },
        {
          label: "Location",
          fields: [
            {
              name: "country",
              type: "text",
              required: true,
              defaultValue: "in",
              admin: { hidden: true },
            },
            { name: "city", type: "select", required: true, options: CITY_SELECT },
            { name: "locality", type: "text", required: true },
            { name: "localitySlug", type: "text", index: true, admin: { hidden: true } },
            {
              name: "road",
              type: "text",
              required: true,
              admin: { description: "How a buyer would name the road" },
            },
            { name: "landmark", type: "text", admin: { description: "e.g. opposite Sony Signal" } },
            {
              type: "row",
              fields: [
                {
                  name: "lat",
                  type: "number",
                  required: true,
                  admin: { width: "33%", step: 0.00001, description: "Five decimals" },
                },
                {
                  name: "lng",
                  type: "number",
                  required: true,
                  admin: { width: "33%", step: 0.00001, description: "Five decimals" },
                },
                {
                  name: "facingDeg",
                  type: "number",
                  min: 0,
                  max: 359,
                  admin: { width: "34%", description: "Compass bearing the face points to" },
                },
              ],
            },
            { name: "trafficDirection", type: "text", admin: { description: "e.g. north-bound" } },
            {
              name: "verifiedLocation",
              type: "checkbox",
              defaultValue: false,
              label:
                "Verified location: coordinates match street-level imagery or a GPS-stamped photo",
            },
            { name: "lastVerifiedOn", type: "date" },
          ],
        },
        {
          label: "Commercial",
          fields: [
            {
              name: "priceDisplay",
              type: "select",
              required: true,
              defaultValue: "on_request",
              options: [
                { label: "Exact rate", value: "exact" },
                { label: "“From” price", value: "from" },
                { label: "Price on request", value: "on_request" },
              ],
              admin: { description: "The owner chooses. A private price is never a penalty." },
            },
            { name: "rate", type: "number", min: 0, label: "Rate a month, in rupees" },
            { name: "minPeriod", type: "text", admin: { description: "e.g. 3 months" } },
            {
              name: "productionCost",
              type: "text",
              label: "Printing and mounting",
              admin: { description: "e.g. ₹ 18,000 once, by the owner" },
            },
            { name: "taxesNote", type: "text", defaultValue: "Taxes extra" },
            { name: "notAccepted", type: "text", label: "Categories not accepted" },
            {
              name: "bookedUntil",
              type: "date",
              admin: { description: "Leave empty when the site is free now" },
            },
            {
              name: "availabilityConfirmedOn",
              type: "date",
              admin: { description: "The day the owner last confirmed availability" },
            },
            {
              name: "artworkSpec",
              type: "text",
              admin: { description: "e.g. 20 × 10 ft at 30 dpi" },
            },
            { name: "fileTypes", type: "text", admin: { description: "e.g. PDF or TIFF, CMYK" } },
            {
              name: "leadTimeDays",
              type: "number",
              min: 0,
              label: "Artwork needed this many days before the start",
            },
          ],
        },
        {
          label: "Audience and permit",
          fields: [
            {
              name: "audience",
              type: "group",
              admin: {
                description:
                  "A figure is shown only with its source and date. Otherwise leave it empty.",
              },
              fields: [
                { name: "figure", type: "number", min: 0, label: "People a week" },
                {
                  name: "metric",
                  type: "text",
                  admin: { description: "e.g. weekly impressions, adults 18+" },
                },
                { name: "source", type: "text" },
                { name: "method", type: "text" },
                { name: "measuredOn", type: "date" },
              ],
            },
            {
              name: "permit",
              type: "group",
              fields: [
                { name: "number", type: "text" },
                { name: "authority", type: "text" },
                { name: "expiresOn", type: "date" },
              ],
            },
          ],
        },
        {
          label: "Photos",
          fields: [
            {
              name: "photos",
              type: "array",
              admin: {
                description:
                  "Real photographs of the face in its street. The approach view comes first.",
              },
              fields: [
                { name: "image", type: "upload", relationTo: "media", required: true },
                {
                  name: "kind",
                  type: "select",
                  required: true,
                  defaultValue: "approach",
                  options: [
                    { label: "Approach, from the road", value: "approach" },
                    { label: "Day, close", value: "day" },
                    { label: "Night", value: "night" },
                  ],
                },
                { name: "takenOn", type: "date", required: true },
                {
                  name: "gps",
                  type: "checkbox",
                  defaultValue: false,
                  label: "GPS-stamped in the OOHWORKS app",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
