import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."sites" ADD COLUMN "photo_note" varchar;
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_photo_note" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN "fingerprint" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."sites" DROP COLUMN "photo_note";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_photo_note";
  ALTER TABLE "payload"."media" DROP COLUMN "fingerprint";`)
}
