import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_listing_reports_reason" AS ENUM('details', 'location', 'photos', 'gone', 'permit', 'seller', 'other');
  CREATE TYPE "payload"."enum_listing_reports_status" AS ENUM('new', 'reviewing', 'resolved', 'dismissed');
  CREATE TABLE "payload"."listing_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer,
  	"unit_id" varchar NOT NULL,
  	"reason" "payload"."enum_listing_reports_reason" NOT NULL,
  	"message" varchar,
  	"email" varchar,
  	"status" "payload"."enum_listing_reports_status" DEFAULT 'new' NOT NULL,
  	"respond_by" timestamp(3) with time zone,
  	"resolution" varchar,
  	"handled_by_id" integer,
  	"handled_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "listing_reports_id" integer;
  ALTER TABLE "payload"."listing_reports" ADD CONSTRAINT "listing_reports_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "payload"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."listing_reports" ADD CONSTRAINT "listing_reports_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "listing_reports_site_idx" ON "payload"."listing_reports" USING btree ("site_id");
  CREATE INDEX "listing_reports_unit_id_idx" ON "payload"."listing_reports" USING btree ("unit_id");
  CREATE INDEX "listing_reports_status_idx" ON "payload"."listing_reports" USING btree ("status");
  CREATE INDEX "listing_reports_respond_by_idx" ON "payload"."listing_reports" USING btree ("respond_by");
  CREATE INDEX "listing_reports_handled_by_idx" ON "payload"."listing_reports" USING btree ("handled_by_id");
  CREATE INDEX "listing_reports_updated_at_idx" ON "payload"."listing_reports" USING btree ("updated_at");
  CREATE INDEX "listing_reports_created_at_idx" ON "payload"."listing_reports" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_listing_reports_fk" FOREIGN KEY ("listing_reports_id") REFERENCES "payload"."listing_reports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_listing_reports_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("listing_reports_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."listing_reports" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."listing_reports" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_listing_reports_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_listing_reports_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "listing_reports_id";
  DROP TYPE "payload"."enum_listing_reports_reason";
  DROP TYPE "payload"."enum_listing_reports_status";`)
}
