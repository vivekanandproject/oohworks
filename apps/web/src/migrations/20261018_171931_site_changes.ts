import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_site_changes_status" AS ENUM('submitted', 'changes', 'approved', 'withdrawn');
  CREATE TABLE "payload"."site_changes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"owner_id" integer,
  	"unit_id" varchar NOT NULL,
  	"status" "payload"."enum_site_changes_status" DEFAULT 'submitted' NOT NULL,
  	"summary" varchar,
  	"review_note" varchar,
  	"moved" boolean,
  	"proposed" jsonb,
  	"submitted_at" timestamp(3) with time zone,
  	"decided_by_id" integer,
  	"decided_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "site_changes_id" integer;
  ALTER TABLE "payload"."site_changes" ADD CONSTRAINT "site_changes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "payload"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_changes" ADD CONSTRAINT "site_changes_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."owners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_changes" ADD CONSTRAINT "site_changes_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_changes_site_idx" ON "payload"."site_changes" USING btree ("site_id");
  CREATE INDEX "site_changes_owner_idx" ON "payload"."site_changes" USING btree ("owner_id");
  CREATE INDEX "site_changes_unit_id_idx" ON "payload"."site_changes" USING btree ("unit_id");
  CREATE INDEX "site_changes_status_idx" ON "payload"."site_changes" USING btree ("status");
  CREATE INDEX "site_changes_decided_by_idx" ON "payload"."site_changes" USING btree ("decided_by_id");
  CREATE INDEX "site_changes_updated_at_idx" ON "payload"."site_changes" USING btree ("updated_at");
  CREATE INDEX "site_changes_created_at_idx" ON "payload"."site_changes" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_changes_fk" FOREIGN KEY ("site_changes_id") REFERENCES "payload"."site_changes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_site_changes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("site_changes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_changes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."site_changes" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_changes_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_site_changes_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "site_changes_id";
  DROP TYPE "payload"."enum_site_changes_status";`)
}
