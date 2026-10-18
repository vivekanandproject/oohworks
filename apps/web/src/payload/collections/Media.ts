import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";
import { isOps, isSuperAdmin, isWriter } from "../access";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Operations",
    description: "Real photography with a credit. No stock, no renders presented as photos.",
  },
  access: { read: () => true, create: isWriter, update: isOps, delete: isSuperAdmin },
  upload: {
    // Under UPLOADS_DIR when it is set, as a test run does, so its files never mix with these.
    staticDir: path.resolve(process.env.UPLOADS_DIR || path.resolve(dirname, "../../.."), "media"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumb", width: 400, height: 400, position: "centre" },
      { name: "card", width: 800, height: 533, position: "centre" },
      { name: "hero", width: 1600, height: 900, position: "centre" },
    ],
    adminThumbnail: "thumb",
    formatOptions: { format: "webp", options: { quality: 82 } },
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "What the picture shows, for readers who cannot see it" },
    },
    {
      name: "credit",
      type: "text",
      required: true,
      admin: { description: "Photographer or source, shown with the image" },
    },
    {
      name: "licence",
      type: "select",
      required: true,
      defaultValue: "owned",
      options: [
        { label: "OOHWORKS owns it", value: "owned" },
        { label: "Licensed", value: "licensed" },
        { label: "Creative Commons (attribution)", value: "cc-by" },
        { label: "Press or supplied", value: "press" },
      ],
    },
    { name: "takenAt", type: "date" },
    {
      // An owner's photograph's fingerprint (src/lib/owners/photo-checks.ts), to find it on other listings.
      name: "fingerprint",
      type: "text",
      admin: { hidden: true },
    },
    {
      name: "place",
      type: "relationship",
      relationTo: "tags",
      filterOptions: { kind: { equals: "place" } },
    },
  ],
};
