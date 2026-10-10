import type { CollectionConfig } from "payload";

/**
 * A code emailed to an owner so they can manage their own sites. Only its hash is kept, it works for
 * ten minutes and five tries, and nobody can read or write these but the site itself.
 */
export const AccessCodes: CollectionConfig = {
  slug: "access-codes",
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: "email", type: "email", required: true, index: true },
    { name: "token", type: "text", required: true, unique: true, index: true },
    { name: "codeHash", type: "text", required: true },
    { name: "expiresAt", type: "date", required: true },
    { name: "attempts", type: "number", defaultValue: 0 },
    { name: "usedAt", type: "date" },
  ],
};
