import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."media" ADD COLUMN "sizes_hero_md_url" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_hero_md_width" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_hero_md_height" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_hero_md_mime_type" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_hero_md_filesize" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_hero_md_filename" varchar;
  CREATE INDEX "media_sizes_hero_md_sizes_hero_md_filename_idx" ON "payload"."media" USING btree ("sizes_hero_md_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."media_sizes_hero_md_sizes_hero_md_filename_idx";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_hero_md_url";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_hero_md_width";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_hero_md_height";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_hero_md_mime_type";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_hero_md_filesize";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_hero_md_filename";`)
}
