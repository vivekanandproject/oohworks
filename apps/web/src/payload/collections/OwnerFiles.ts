import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";
import { isOps, isStaff, isSuperAdmin } from "../access";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Files an owner hands to OOHWORKS: a company document to verify them, a spreadsheet of sites, or a media
 * kit for the team to enter. They are private. Only staff can open them, and they are never shown on the site.
 */
export const OwnerFiles: CollectionConfig = {
  slug: "owner-files",
  admin: {
    useAsTitle: "filename",
    group: "Marketplace",
    defaultColumns: ["filename", "owner", "kind", "handled", "createdAt"],
    description: "Company documents, spreadsheets and media kits from owners. Private: staff only.",
  },
  access: { read: isStaff, create: () => false, update: isOps, delete: isSuperAdmin },
  upload: {
    // Under UPLOADS_DIR when it is set, as a test run does, so its files never mix with these.
    staticDir: path.resolve(
      process.env.UPLOADS_DIR || path.resolve(dirname, "../../.."),
      "owner-files",
    ),
    mimeTypes: [
      "application/pdf",
      "image/*",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  fields: [
    { name: "owner", type: "relationship", relationTo: "owners", required: true, index: true },
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Company document, for verification", value: "document" },
        { label: "Media kit, for the team to enter", value: "media_kit" },
        { label: "Spreadsheet of sites", value: "sheet" },
      ],
    },
    {
      name: "note",
      type: "textarea",
      admin: { description: "What the owner wrote with the file" },
    },
    {
      name: "handled",
      type: "checkbox",
      defaultValue: false,
      label: "Done: checked, or the sites have been entered",
    },
    {
      name: "reading",
      type: "select",
      options: [
        { label: "Waiting for Claude to read it", value: "waiting" },
        { label: "Claude is reading it", value: "reading" },
        { label: "Read: its sites are drafts", value: "read" },
        { label: "Could not be read: enter it by hand", value: "failed" },
      ],
      admin: {
        position: "sidebar",
        condition: (data) => data?.kind === "media_kit",
        description:
          "A PDF kit is read by Claude into draft sites within the hour. Set it to Waiting to read it again; sites without the kit's own reference are then added a second time.",
      },
    },
    {
      name: "readingAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.kind === "media_kit",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "readingNote",
      type: "textarea",
      admin: {
        readOnly: true,
        condition: (data) => data?.kind === "media_kit",
        description: "What Claude made of the kit, and what it could not read",
      },
    },
    { name: "report", type: "json", admin: { hidden: true } },
  ],
};
