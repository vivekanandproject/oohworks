import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_users_role" ADD VALUE 'superadmin' BEFORE 'admin';
  ALTER TABLE "payload"."users" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "payload"."users" ADD COLUMN "must_change_password" boolean DEFAULT false;
  ALTER TABLE "payload"."users" ADD COLUMN "last_sign_in_at" timestamp(3) with time zone;
  CREATE INDEX "users_active_idx" ON "payload"."users" USING btree ("active");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DATA TYPE text;
  UPDATE "payload"."users" SET "role" = 'admin' WHERE "role" = 'superadmin';
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DEFAULT 'writer'::text;
  DROP TYPE "payload"."enum_users_role";
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor', 'writer', 'contributor', 'ops');
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DEFAULT 'writer'::"payload"."enum_users_role";
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DATA TYPE "payload"."enum_users_role" USING "role"::"payload"."enum_users_role";
  DROP INDEX "payload"."users_active_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "active";
  ALTER TABLE "payload"."users" DROP COLUMN "must_change_password";
  ALTER TABLE "payload"."users" DROP COLUMN "last_sign_in_at";`)
}
