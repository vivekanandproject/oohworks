// Schema lands in M1 (geography, identity, inventory, offers, photos, page_status, redirects).
// Keep every table in its module file and re-export here so drizzle-kit sees one entry point.
export * from "./geography";
