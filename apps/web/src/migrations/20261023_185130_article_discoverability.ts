import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."articles" ADD COLUMN "short_answer" varchar;
  ALTER TABLE "payload"."articles" ADD COLUMN "fact_check_by" varchar;
  ALTER TABLE "payload"."articles" ADD COLUMN "fact_check_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."articles" ADD COLUMN "fact_check_user_id" integer;
  ALTER TABLE "payload"."_articles_v" ADD COLUMN "version_short_answer" varchar;
  ALTER TABLE "payload"."_articles_v" ADD COLUMN "version_fact_check_by" varchar;
  ALTER TABLE "payload"."_articles_v" ADD COLUMN "version_fact_check_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."_articles_v" ADD COLUMN "version_fact_check_user_id" integer;
  ALTER TABLE "payload"."guides" ADD COLUMN "short_answer" varchar;
  ALTER TABLE "payload"."guides" ADD COLUMN "fact_check_by" varchar;
  ALTER TABLE "payload"."guides" ADD COLUMN "fact_check_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."guides" ADD COLUMN "fact_check_user_id" integer;
  ALTER TABLE "payload"."_guides_v" ADD COLUMN "version_short_answer" varchar;
  ALTER TABLE "payload"."_guides_v" ADD COLUMN "version_fact_check_by" varchar;
  ALTER TABLE "payload"."_guides_v" ADD COLUMN "version_fact_check_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."_guides_v" ADD COLUMN "version_fact_check_user_id" integer;
  ALTER TABLE "payload"."people" ADD COLUMN "wikidata" varchar;
  ALTER TABLE "payload"."companies" ADD COLUMN "wikidata" varchar;
  ALTER TABLE "payload"."tags" ADD COLUMN "wikidata" varchar;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_fact_check_user_id_users_id_fk" FOREIGN KEY ("fact_check_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_fact_check_user_id_users_id_fk" FOREIGN KEY ("version_fact_check_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."guides" ADD CONSTRAINT "guides_fact_check_user_id_users_id_fk" FOREIGN KEY ("fact_check_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_version_fact_check_user_id_users_id_fk" FOREIGN KEY ("version_fact_check_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "articles_fact_check_fact_check_user_idx" ON "payload"."articles" USING btree ("fact_check_user_id");
  CREATE INDEX "_articles_v_version_fact_check_version_fact_check_user_idx" ON "payload"."_articles_v" USING btree ("version_fact_check_user_id");
  CREATE INDEX "guides_fact_check_fact_check_user_idx" ON "payload"."guides" USING btree ("fact_check_user_id");
  CREATE INDEX "_guides_v_version_fact_check_version_fact_check_user_idx" ON "payload"."_guides_v" USING btree ("version_fact_check_user_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."articles" DROP CONSTRAINT "articles_fact_check_user_id_users_id_fk";
  
  ALTER TABLE "payload"."_articles_v" DROP CONSTRAINT "_articles_v_version_fact_check_user_id_users_id_fk";
  
  ALTER TABLE "payload"."guides" DROP CONSTRAINT "guides_fact_check_user_id_users_id_fk";
  
  ALTER TABLE "payload"."_guides_v" DROP CONSTRAINT "_guides_v_version_fact_check_user_id_users_id_fk";
  
  DROP INDEX "payload"."articles_fact_check_fact_check_user_idx";
  DROP INDEX "payload"."_articles_v_version_fact_check_version_fact_check_user_idx";
  DROP INDEX "payload"."guides_fact_check_fact_check_user_idx";
  DROP INDEX "payload"."_guides_v_version_fact_check_version_fact_check_user_idx";
  ALTER TABLE "payload"."articles" DROP COLUMN "short_answer";
  ALTER TABLE "payload"."articles" DROP COLUMN "fact_check_by";
  ALTER TABLE "payload"."articles" DROP COLUMN "fact_check_at";
  ALTER TABLE "payload"."articles" DROP COLUMN "fact_check_user_id";
  ALTER TABLE "payload"."_articles_v" DROP COLUMN "version_short_answer";
  ALTER TABLE "payload"."_articles_v" DROP COLUMN "version_fact_check_by";
  ALTER TABLE "payload"."_articles_v" DROP COLUMN "version_fact_check_at";
  ALTER TABLE "payload"."_articles_v" DROP COLUMN "version_fact_check_user_id";
  ALTER TABLE "payload"."guides" DROP COLUMN "short_answer";
  ALTER TABLE "payload"."guides" DROP COLUMN "fact_check_by";
  ALTER TABLE "payload"."guides" DROP COLUMN "fact_check_at";
  ALTER TABLE "payload"."guides" DROP COLUMN "fact_check_user_id";
  ALTER TABLE "payload"."_guides_v" DROP COLUMN "version_short_answer";
  ALTER TABLE "payload"."_guides_v" DROP COLUMN "version_fact_check_by";
  ALTER TABLE "payload"."_guides_v" DROP COLUMN "version_fact_check_at";
  ALTER TABLE "payload"."_guides_v" DROP COLUMN "version_fact_check_user_id";
  ALTER TABLE "payload"."people" DROP COLUMN "wikidata";
  ALTER TABLE "payload"."companies" DROP COLUMN "wikidata";
  ALTER TABLE "payload"."tags" DROP COLUMN "wikidata";`)
}
