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
import { databaseUrl, payloadSecret } from "./lib/hosting";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Media goes to Cloudflare R2 when its credentials exist; locally it stays on disk. */
const r2 =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET
    ? s3Storage({
        collections: { media: { prefix: "media" } },
        bucket: process.env.R2_BUCKET,
        config: {
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          region: "auto",
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
          forcePathStyle: true,
        },
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
  serverURL: siteUrl,
  cors: [siteUrl],
  csrf: [siteUrl],
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
  plugins: r2 ? [r2] : [],
});
