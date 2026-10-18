import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";
import { isAdmin, isOps, isStaff } from "../access";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Files an owner hands to ohworks: a company document to verify them, a spreadsheet of sites, or a media
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
  access: { read: isStaff, create: () => false, update: isOps, delete: isAdmin },
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
    { name: "report", type: "json", admin: { hidden: true } },
  ],
};
