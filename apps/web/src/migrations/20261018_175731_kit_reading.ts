import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_owner_files_reading" AS ENUM('waiting', 'reading', 'read', 'failed');
  ALTER TYPE "payload"."enum_sites_source" ADD VALUE 'kit';
  ALTER TYPE "payload"."enum__sites_v_version_source" ADD VALUE 'kit';
  ALTER TABLE "payload"."sites" ADD COLUMN "kit_note" varchar;
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_kit_note" varchar;
  ALTER TABLE "payload"."owner_files" ADD COLUMN "reading" "payload"."enum_owner_files_reading";
  ALTER TABLE "payload"."owner_files" ADD COLUMN "reading_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."owner_files" ADD COLUMN "reading_note" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."sites" ALTER COLUMN "source" SET DATA TYPE text;
  ALTER TABLE "payload"."sites" ALTER COLUMN "source" SET DEFAULT 'team'::text;
  DROP TYPE "payload"."enum_sites_source";
  CREATE TYPE "payload"."enum_sites_source" AS ENUM('team', 'form', 'sheet');
  ALTER TABLE "payload"."sites" ALTER COLUMN "source" SET DEFAULT 'team'::"payload"."enum_sites_source";
  ALTER TABLE "payload"."sites" ALTER COLUMN "source" SET DATA TYPE "payload"."enum_sites_source" USING "source"::"payload"."enum_sites_source";
  ALTER TABLE "payload"."_sites_v" ALTER COLUMN "version_source" SET DATA TYPE text;
  ALTER TABLE "payload"."_sites_v" ALTER COLUMN "version_source" SET DEFAULT 'team'::text;
  DROP TYPE "payload"."enum__sites_v_version_source";
  CREATE TYPE "payload"."enum__sites_v_version_source" AS ENUM('team', 'form', 'sheet');
  ALTER TABLE "payload"."_sites_v" ALTER COLUMN "version_source" SET DEFAULT 'team'::"payload"."enum__sites_v_version_source";
  ALTER TABLE "payload"."_sites_v" ALTER COLUMN "version_source" SET DATA TYPE "payload"."enum__sites_v_version_source" USING "version_source"::"payload"."enum__sites_v_version_source";
  ALTER TABLE "payload"."sites" DROP COLUMN "kit_note";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_kit_note";
  ALTER TABLE "payload"."owner_files" DROP COLUMN "reading";
  ALTER TABLE "payload"."owner_files" DROP COLUMN "reading_at";
  ALTER TABLE "payload"."owner_files" DROP COLUMN "reading_note";
  DROP TYPE "payload"."enum_owner_files_reading";`)
}
