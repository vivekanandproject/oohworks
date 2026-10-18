import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_outbox_kind" ADD VALUE 'alert';
  ALTER TYPE "payload"."enum_outbox_kind" ADD VALUE 'confirm_email';
  ALTER TABLE "payload"."follows" ADD COLUMN "seen" jsonb;
  ALTER TABLE "payload"."follows" ADD COLUMN "notified_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."outbox" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_outbox_kind";
  CREATE TYPE "payload"."enum_outbox_kind" AS ENUM('code', 'owner_enquiry', 'buyer_confirmation', 'owner_reply', 'buyer_message', 'owner_code', 'owner_notice', 'team_notice');
  ALTER TABLE "payload"."outbox" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_outbox_kind" USING "kind"::"payload"."enum_outbox_kind";
  ALTER TABLE "payload"."follows" DROP COLUMN "seen";
  ALTER TABLE "payload"."follows" DROP COLUMN "notified_at";`)
}
