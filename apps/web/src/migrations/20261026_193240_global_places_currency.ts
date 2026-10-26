import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."sites" ALTER COLUMN "city" SET DATA TYPE varchar;
  ALTER TABLE "payload"."_sites_v" ALTER COLUMN "version_city" SET DATA TYPE varchar;
  ALTER TABLE "payload"."owners" ALTER COLUMN "city" SET DATA TYPE varchar;
  ALTER TABLE "payload"."sites" ADD COLUMN "city_label" varchar;
  ALTER TABLE "payload"."sites" ADD COLUMN "region" varchar;
  ALTER TABLE "payload"."sites" ADD COLUMN "place_id" varchar;
  ALTER TABLE "payload"."sites" ADD COLUMN "time_zone" varchar;
  ALTER TABLE "payload"."sites" ADD COLUMN "currency" varchar DEFAULT 'INR';
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_city_label" varchar;
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_region" varchar;
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_place_id" varchar;
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_time_zone" varchar;
  ALTER TABLE "payload"."_sites_v" ADD COLUMN "version_currency" varchar DEFAULT 'INR';
  ALTER TABLE "payload"."enquiries" ADD COLUMN "budget_currency" varchar DEFAULT 'INR';
  ALTER TABLE "payload"."messages_answers" ADD COLUMN "quote_currency" varchar;
  CREATE INDEX "sites_country_idx" ON "payload"."sites" USING btree ("country");
  CREATE INDEX "sites_city_idx" ON "payload"."sites" USING btree ("city");
  CREATE INDEX "_sites_v_version_version_country_idx" ON "payload"."_sites_v" USING btree ("version_country");
  CREATE INDEX "_sites_v_version_version_city_idx" ON "payload"."_sites_v" USING btree ("version_city");
  DROP TYPE "payload"."enum_sites_city";
  DROP TYPE "payload"."enum__sites_v_version_city";
  DROP TYPE "payload"."enum_owners_city";`)
  // The sites listed before this change are all in India: give them their city's name and India's zone.
  await db.execute(sql`
   UPDATE "payload"."sites" SET "city_label" = CASE "city"
     WHEN 'bengaluru' THEN 'Bengaluru' WHEN 'mumbai' THEN 'Mumbai' WHEN 'delhi-ncr' THEN 'Delhi NCR'
     WHEN 'hyderabad' THEN 'Hyderabad' WHEN 'pune' THEN 'Pune' WHEN 'chennai' THEN 'Chennai' END
   WHERE "city_label" IS NULL;
  UPDATE "payload"."_sites_v" SET "version_city_label" = CASE "version_city"
     WHEN 'bengaluru' THEN 'Bengaluru' WHEN 'mumbai' THEN 'Mumbai' WHEN 'delhi-ncr' THEN 'Delhi NCR'
     WHEN 'hyderabad' THEN 'Hyderabad' WHEN 'pune' THEN 'Pune' WHEN 'chennai' THEN 'Chennai' END
   WHERE "version_city_label" IS NULL;
  UPDATE "payload"."sites" SET "time_zone" = 'Asia/Kolkata' WHERE "time_zone" IS NULL AND "country" = 'in';
  UPDATE "payload"."_sites_v" SET "version_time_zone" = 'Asia/Kolkata' WHERE "version_time_zone" IS NULL AND "version_country" = 'in';
  UPDATE "payload"."messages_answers" SET "quote_currency" = 'INR' WHERE "quote_currency" IS NULL AND "quote" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_sites_city" AS ENUM('bengaluru', 'mumbai', 'delhi-ncr', 'hyderabad', 'pune', 'chennai');
  CREATE TYPE "payload"."enum__sites_v_version_city" AS ENUM('bengaluru', 'mumbai', 'delhi-ncr', 'hyderabad', 'pune', 'chennai');
  CREATE TYPE "payload"."enum_owners_city" AS ENUM('bengaluru', 'mumbai', 'delhi-ncr', 'hyderabad', 'pune', 'chennai');
  DROP INDEX "payload"."sites_country_idx";
  DROP INDEX "payload"."sites_city_idx";
  DROP INDEX "payload"."_sites_v_version_version_country_idx";
  DROP INDEX "payload"."_sites_v_version_version_city_idx";
  ALTER TABLE "payload"."sites" ALTER COLUMN "city" SET DATA TYPE "payload"."enum_sites_city" USING "city"::"payload"."enum_sites_city";
  ALTER TABLE "payload"."_sites_v" ALTER COLUMN "version_city" SET DATA TYPE "payload"."enum__sites_v_version_city" USING "version_city"::"payload"."enum__sites_v_version_city";
  ALTER TABLE "payload"."owners" ALTER COLUMN "city" SET DATA TYPE "payload"."enum_owners_city" USING "city"::"payload"."enum_owners_city";
  ALTER TABLE "payload"."sites" DROP COLUMN "city_label";
  ALTER TABLE "payload"."sites" DROP COLUMN "region";
  ALTER TABLE "payload"."sites" DROP COLUMN "place_id";
  ALTER TABLE "payload"."sites" DROP COLUMN "time_zone";
  ALTER TABLE "payload"."sites" DROP COLUMN "currency";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_city_label";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_region";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_place_id";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_time_zone";
  ALTER TABLE "payload"."_sites_v" DROP COLUMN "version_currency";
  ALTER TABLE "payload"."enquiries" DROP COLUMN "budget_currency";
  ALTER TABLE "payload"."messages_answers" DROP COLUMN "quote_currency";`)
}
