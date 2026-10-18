import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
import {
  AccessCodes,
  Articles,
  Companies,
  Corrections,
  Enquiries,
  Follows,
  Guides,
  Issues,
  Media,
  Messages,
  Outbox,
  OwnerFiles,
  Owners,
  People,
  Reports,
  Sites,
  Sources,
  Subscribers,
  Tags,
  Users,
} from "./payload/collections";
import { editorialEditor } from "./payload/collections/shared";
import { databaseUrl, payloadSecret, siteUrl } from "./lib/hosting";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const site = siteUrl();

/** Cloudflare R2, when its credentials exist. Without them, uploads stay on this machine's disk. */
const r2 =
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    ? {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: "auto",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      }
    : null;

/** Photographs, in the bucket the site's pictures are served from. */
const mediaStorage =
  r2 && process.env.R2_BUCKET
    ? s3Storage({
        collections: { media: { prefix: "media" } },
        bucket: process.env.R2_BUCKET,
        config: r2,
      })
    : null;

/**
 * Owners' company documents, spreadsheets and media kits, in a second bucket that is never public.
 * Every download goes through the CMS, whose access rules let only staff open them.
 */
const ownerFileStorage =
  r2 && process.env.R2_PRIVATE_BUCKET
    ? s3Storage({
        collections: { "owner-files": { prefix: "owner-files" } },
        bucket: process.env.R2_PRIVATE_BUCKET,
        config: r2,
      })
    : null;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " · ohworks" },
    components: { providers: ["/payload/admin/PasswordGate#PasswordGate"] },
    // ohworks has one theme, Day (docs/ohworks-design-system.md). Without this the admin follows the
    // computer's dark mode, and the brand colours in custom.css are made for paper, not for dark.
    theme: "light",
    // Browser extensions (Scribe, password managers) add attributes to <html> before the page starts,
    // which React reports as a mismatch. The site's own layout ignores them the same way.
    suppressHydrationWarning: true,
  },
  collections: [
    Sites,
    Owners,
    Enquiries,
    Messages,
    Articles,
    Guides,
    Reports,
    Sources,
    People,
    Companies,
    Tags,
    Media,
    Issues,
    Follows,
    Subscribers,
    Corrections,
    Outbox,
    OwnerFiles,
    AccessCodes,
    Users,
  ],
  editor: editorialEditor,
  secret: payloadSecret(),
  serverURL: site,
  cors: [site],
  csrf: [site],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // Payload keeps its tables in their own schema so the marketplace schema in packages/db stays separate.
  // On a development machine the tables follow the code as it changes. A hosted build creates them
  // from the files in `migrations`, which is the only way a production database is ever changed.
  db: postgresAdapter({
    pool: { connectionString: databaseUrl() },
    schemaName: "payload",
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  sharp,
  plugins: [mediaStorage, ownerFileStorage].filter((p) => p !== null),
});
