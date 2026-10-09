import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
import {
  Articles,
  Companies,
  Corrections,
  Guides,
  Issues,
  Media,
  People,
  Reports,
  Sources,
  Tags,
  Users,
} from "./payload/collections";
import { editorialEditor } from "./payload/collections/shared";

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
  },
  collections: [
    Articles,
    Guides,
    Reports,
    Sources,
    People,
    Companies,
    Tags,
    Media,
    Issues,
    Corrections,
    Users,
  ],
  editor: editorialEditor,
  secret: process.env.PAYLOAD_SECRET ?? "",
  serverURL: siteUrl,
  cors: [siteUrl],
  csrf: [siteUrl],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // Payload keeps its tables in their own schema so the marketplace schema in packages/db stays separate.
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
    schemaName: "payload",
  }),
  sharp,
  plugins: r2 ? [r2] : [],
});
