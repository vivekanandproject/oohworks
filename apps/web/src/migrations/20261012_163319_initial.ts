import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The CMS keeps its tables in a schema of its own. A development machine creates it as it goes.
  // A hosted database starts empty, so the first migration makes it.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "payload";`)
  await db.execute(sql`
   CREATE TYPE "payload"."enum_sites_photos_kind" AS ENUM('approach', 'day', 'night');
  CREATE TYPE "payload"."enum_sites_review" AS ENUM('draft', 'submitted', 'changes', 'approved');
  CREATE TYPE "payload"."enum_sites_source" AS ENUM('team', 'form', 'sheet');
  CREATE TYPE "payload"."enum_sites_format" AS ENUM('hoarding', 'unipole', 'gantry', 'bus-shelter', 'led-screen', 'transit');
  CREATE TYPE "payload"."enum_sites_environment" AS ENUM('roadside', 'transit', 'retail', 'indoor');
  CREATE TYPE "payload"."enum_sites_size_unit" AS ENUM('ft', 'm');
  CREATE TYPE "payload"."enum_sites_lighting" AS ENUM('front-lit', 'back-lit', 'unlit', 'digital');
  CREATE TYPE "payload"."enum_sites_city" AS ENUM('bengaluru', 'mumbai', 'delhi-ncr', 'hyderabad', 'pune', 'chennai');
  CREATE TYPE "payload"."enum_sites_price_display" AS ENUM('exact', 'from', 'on_request');
  CREATE TYPE "payload"."enum_sites_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__sites_v_version_photos_kind" AS ENUM('approach', 'day', 'night');
  CREATE TYPE "payload"."enum__sites_v_version_review" AS ENUM('draft', 'submitted', 'changes', 'approved');
  CREATE TYPE "payload"."enum__sites_v_version_source" AS ENUM('team', 'form', 'sheet');
  CREATE TYPE "payload"."enum__sites_v_version_format" AS ENUM('hoarding', 'unipole', 'gantry', 'bus-shelter', 'led-screen', 'transit');
  CREATE TYPE "payload"."enum__sites_v_version_environment" AS ENUM('roadside', 'transit', 'retail', 'indoor');
  CREATE TYPE "payload"."enum__sites_v_version_size_unit" AS ENUM('ft', 'm');
  CREATE TYPE "payload"."enum__sites_v_version_lighting" AS ENUM('front-lit', 'back-lit', 'unlit', 'digital');
  CREATE TYPE "payload"."enum__sites_v_version_city" AS ENUM('bengaluru', 'mumbai', 'delhi-ncr', 'hyderabad', 'pune', 'chennai');
  CREATE TYPE "payload"."enum__sites_v_version_price_display" AS ENUM('exact', 'from', 'on_request');
  CREATE TYPE "payload"."enum__sites_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_owners_city" AS ENUM('bengaluru', 'mumbai', 'delhi-ncr', 'hyderabad', 'pune', 'chennai');
  CREATE TYPE "payload"."enum_owners_source" AS ENUM('team', 'self');
  CREATE TYPE "payload"."enum_enquiries_artwork" AS ENUM('ready', 'in_progress', 'not_started');
  CREATE TYPE "payload"."enum_enquiries_status" AS ENUM('pending', 'sent', 'replied', 'closed');
  CREATE TYPE "payload"."enum_messages_answers_availability" AS ENUM('available', 'unavailable', 'other_dates');
  CREATE TYPE "payload"."enum_messages_from" AS ENUM('owner', 'buyer');
  CREATE TYPE "payload"."enum_articles_pillar" AS ENUM('news', 'analysis', 'academy', 'showcase');
  CREATE TYPE "payload"."enum_articles_layout" AS ENUM('standard', 'immersive');
  CREATE TYPE "payload"."enum_articles_workflow" AS ENUM('draft', 'in_review', 'fact_checked', 'scheduled', 'published');
  CREATE TYPE "payload"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__articles_v_version_pillar" AS ENUM('news', 'analysis', 'academy', 'showcase');
  CREATE TYPE "payload"."enum__articles_v_version_layout" AS ENUM('standard', 'immersive');
  CREATE TYPE "payload"."enum__articles_v_version_workflow" AS ENUM('draft', 'in_review', 'fact_checked', 'scheduled', 'published');
  CREATE TYPE "payload"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_guides_kind" AS ENUM('cost', 'explainer', 'comparison', 'measurement');
  CREATE TYPE "payload"."enum_guides_workflow" AS ENUM('draft', 'in_review', 'fact_checked', 'scheduled', 'published');
  CREATE TYPE "payload"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__guides_v_version_kind" AS ENUM('cost', 'explainer', 'comparison', 'measurement');
  CREATE TYPE "payload"."enum__guides_v_version_workflow" AS ENUM('draft', 'in_review', 'fact_checked', 'scheduled', 'published');
  CREATE TYPE "payload"."enum__guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_reports_workflow" AS ENUM('draft', 'in_review', 'fact_checked', 'scheduled', 'published');
  CREATE TYPE "payload"."enum_reports_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__reports_v_version_workflow" AS ENUM('draft', 'in_review', 'fact_checked', 'scheduled', 'published');
  CREATE TYPE "payload"."enum__reports_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_sources_type" AS ENUM('report', 'filing', 'press', 'interview', 'ohworks', 'article');
  CREATE TYPE "payload"."enum_companies_type" AS ENUM('owner', 'agency', 'brand', 'vendor', 'authority', 'association', 'publisher');
  CREATE TYPE "payload"."enum_tags_kind" AS ENUM('place', 'format', 'company', 'theme');
  CREATE TYPE "payload"."enum_media_licence" AS ENUM('owned', 'licensed', 'cc-by', 'press');
  CREATE TYPE "payload"."enum_issues_kind" AS ENUM('daily', 'weekly');
  CREATE TYPE "payload"."enum_follows_source" AS ENUM('search', 'saved_search', 'hub', 'guide');
  CREATE TYPE "payload"."enum_subscribers_lists" AS ENUM('daily', 'weekly');
  CREATE TYPE "payload"."enum_outbox_kind" AS ENUM('code', 'owner_enquiry', 'buyer_confirmation', 'owner_reply', 'buyer_message', 'owner_code', 'owner_notice', 'team_notice');
  CREATE TYPE "payload"."enum_owner_files_kind" AS ENUM('document', 'media_kit', 'sheet');
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor', 'writer', 'contributor', 'ops');
  CREATE TABLE "payload"."sites_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"kind" "payload"."enum_sites_photos_kind" DEFAULT 'approach',
  	"taken_on" timestamp(3) with time zone,
  	"gps" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."sites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"review" "payload"."enum_sites_review",
  	"review_note" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"duplicate_note" varchar,
  	"owner_ref" varchar,
  	"source" "payload"."enum_sites_source" DEFAULT 'team',
  	"permanent_id" varchar,
  	"quality_score" numeric,
  	"sample" boolean DEFAULT false,
  	"removed" boolean DEFAULT false,
  	"owner_id" integer,
  	"format" "payload"."enum_sites_format",
  	"environment" "payload"."enum_sites_environment" DEFAULT 'roadside',
  	"width" numeric,
  	"height" numeric,
  	"size_unit" "payload"."enum_sites_size_unit" DEFAULT 'ft',
  	"width_mm" numeric,
  	"height_mm" numeric,
  	"lighting" "payload"."enum_sites_lighting" DEFAULT 'front-lit',
  	"lit_hours" varchar,
  	"height_above_road_m" numeric,
  	"digital_resolution" varchar,
  	"digital_spot_seconds" numeric,
  	"digital_loop_seconds" numeric,
  	"digital_advertisers" numeric,
  	"digital_exchanges" varchar,
  	"country" varchar DEFAULT 'in',
  	"city" "payload"."enum_sites_city",
  	"locality" varchar,
  	"locality_slug" varchar,
  	"road" varchar,
  	"landmark" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"facing_deg" numeric,
  	"traffic_direction" varchar,
  	"verified_location" boolean DEFAULT false,
  	"last_verified_on" timestamp(3) with time zone,
  	"price_display" "payload"."enum_sites_price_display" DEFAULT 'on_request',
  	"rate" numeric,
  	"min_period" varchar,
  	"production_cost" varchar,
  	"taxes_note" varchar DEFAULT 'Taxes extra',
  	"not_accepted" varchar,
  	"booked_until" timestamp(3) with time zone,
  	"availability_confirmed_on" timestamp(3) with time zone,
  	"artwork_spec" varchar,
  	"file_types" varchar,
  	"lead_time_days" numeric,
  	"audience_figure" numeric,
  	"audience_metric" varchar,
  	"audience_source" varchar,
  	"audience_method" varchar,
  	"audience_measured_on" timestamp(3) with time zone,
  	"permit_number" varchar,
  	"permit_authority" varchar,
  	"permit_expires_on" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_sites_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_sites_v_version_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"kind" "payload"."enum__sites_v_version_photos_kind" DEFAULT 'approach',
  	"taken_on" timestamp(3) with time zone,
  	"gps" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_sites_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_review" "payload"."enum__sites_v_version_review",
  	"version_review_note" varchar,
  	"version_submitted_at" timestamp(3) with time zone,
  	"version_duplicate_note" varchar,
  	"version_owner_ref" varchar,
  	"version_source" "payload"."enum__sites_v_version_source" DEFAULT 'team',
  	"version_permanent_id" varchar,
  	"version_quality_score" numeric,
  	"version_sample" boolean DEFAULT false,
  	"version_removed" boolean DEFAULT false,
  	"version_owner_id" integer,
  	"version_format" "payload"."enum__sites_v_version_format",
  	"version_environment" "payload"."enum__sites_v_version_environment" DEFAULT 'roadside',
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_size_unit" "payload"."enum__sites_v_version_size_unit" DEFAULT 'ft',
  	"version_width_mm" numeric,
  	"version_height_mm" numeric,
  	"version_lighting" "payload"."enum__sites_v_version_lighting" DEFAULT 'front-lit',
  	"version_lit_hours" varchar,
  	"version_height_above_road_m" numeric,
  	"version_digital_resolution" varchar,
  	"version_digital_spot_seconds" numeric,
  	"version_digital_loop_seconds" numeric,
  	"version_digital_advertisers" numeric,
  	"version_digital_exchanges" varchar,
  	"version_country" varchar DEFAULT 'in',
  	"version_city" "payload"."enum__sites_v_version_city",
  	"version_locality" varchar,
  	"version_locality_slug" varchar,
  	"version_road" varchar,
  	"version_landmark" varchar,
  	"version_lat" numeric,
  	"version_lng" numeric,
  	"version_facing_deg" numeric,
  	"version_traffic_direction" varchar,
  	"version_verified_location" boolean DEFAULT false,
  	"version_last_verified_on" timestamp(3) with time zone,
  	"version_price_display" "payload"."enum__sites_v_version_price_display" DEFAULT 'on_request',
  	"version_rate" numeric,
  	"version_min_period" varchar,
  	"version_production_cost" varchar,
  	"version_taxes_note" varchar DEFAULT 'Taxes extra',
  	"version_not_accepted" varchar,
  	"version_booked_until" timestamp(3) with time zone,
  	"version_availability_confirmed_on" timestamp(3) with time zone,
  	"version_artwork_spec" varchar,
  	"version_file_types" varchar,
  	"version_lead_time_days" numeric,
  	"version_audience_figure" numeric,
  	"version_audience_metric" varchar,
  	"version_audience_source" varchar,
  	"version_audience_method" varchar,
  	"version_audience_measured_on" timestamp(3) with time zone,
  	"version_permit_number" varchar,
  	"version_permit_authority" varchar,
  	"version_permit_expires_on" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__sites_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."owners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"city" "payload"."enum_owners_city",
  	"location_label" varchar,
  	"location_place_id" varchar,
  	"location_country" varchar,
  	"about" varchar,
  	"contact_email" varchar NOT NULL,
  	"phone" varchar,
  	"phone_country" varchar,
  	"contact_name" varchar,
  	"gstin" varchar,
  	"login_email" varchar,
  	"password_hash" varchar,
  	"password_set_at" timestamp(3) with time zone,
  	"failed_sign_ins" numeric DEFAULT 0,
  	"locked_until" timestamp(3) with time zone,
  	"source" "payload"."enum_owners_source" DEFAULT 'team',
  	"submitted_at" timestamp(3) with time zone,
  	"verified" boolean DEFAULT false,
  	"verified_on" timestamp(3) with time zone,
  	"median_reply_hours" numeric,
  	"sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"site_id" integer NOT NULL,
  	"plan" varchar,
  	"lead" boolean DEFAULT true,
  	"owner_id" integer NOT NULL,
  	"email" varchar NOT NULL,
  	"date_from" timestamp(3) with time zone NOT NULL,
  	"date_to" timestamp(3) with time zone NOT NULL,
  	"brand" varchar NOT NULL,
  	"budget" numeric,
  	"artwork" "payload"."enum_enquiries_artwork" DEFAULT 'not_started' NOT NULL,
  	"message" varchar,
  	"status" "payload"."enum_enquiries_status" DEFAULT 'pending' NOT NULL,
  	"code_hash" varchar,
  	"code_expires_at" timestamp(3) with time zone,
  	"attempts" numeric DEFAULT 0,
  	"verified_at" timestamp(3) with time zone,
  	"sent_at" timestamp(3) with time zone,
  	"replied_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."enquiries_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sites_id" integer
  );
  
  CREATE TABLE "payload"."messages_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"availability" "payload"."enum_messages_answers_availability",
  	"quote" numeric
  );
  
  CREATE TABLE "payload"."messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enquiry_id" integer NOT NULL,
  	"from" "payload"."enum_messages_from" NOT NULL,
  	"body" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."articles_related_faces" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"permanent_id" varchar
  );
  
  CREATE TABLE "payload"."articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pillar" "payload"."enum_articles_pillar" DEFAULT 'news',
  	"lead" boolean DEFAULT false,
  	"layout" "payload"."enum_articles_layout" DEFAULT 'standard',
  	"title" varchar,
  	"slug" varchar,
  	"standfirst" varchar,
  	"hero_id" integer,
  	"body" jsonb,
  	"workflow" "payload"."enum_articles_workflow" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"created_by_id" integer,
  	"sponsor_enabled" boolean DEFAULT false,
  	"sponsor_company_id" integer,
  	"sponsor_label" varchar,
  	"series" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"tags_id" integer,
  	"sources_id" integer
  );
  
  CREATE TABLE "payload"."_articles_v_version_related_faces" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"permanent_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_pillar" "payload"."enum__articles_v_version_pillar" DEFAULT 'news',
  	"version_lead" boolean DEFAULT false,
  	"version_layout" "payload"."enum__articles_v_version_layout" DEFAULT 'standard',
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_standfirst" varchar,
  	"version_hero_id" integer,
  	"version_body" jsonb,
  	"version_workflow" "payload"."enum__articles_v_version_workflow" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_created_by_id" integer,
  	"version_sponsor_enabled" boolean DEFAULT false,
  	"version_sponsor_company_id" integer,
  	"version_sponsor_label" varchar,
  	"version_series" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"tags_id" integer,
  	"sources_id" integer
  );
  
  CREATE TABLE "payload"."guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "payload"."enum_guides_kind" DEFAULT 'cost',
  	"title" varchar,
  	"slug" varchar,
  	"standfirst" varchar,
  	"hero_id" integer,
  	"body" jsonb,
  	"city_id" integer,
  	"format_id" integer,
  	"listing_query_area" varchar,
  	"listing_query_format" varchar,
  	"toc_enabled" boolean DEFAULT true,
  	"last_refreshed_at" timestamp(3) with time zone,
  	"workflow" "payload"."enum_guides_workflow" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"created_by_id" integer,
  	"sponsor_enabled" boolean DEFAULT false,
  	"sponsor_company_id" integer,
  	"sponsor_label" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"tags_id" integer,
  	"sources_id" integer
  );
  
  CREATE TABLE "payload"."_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_kind" "payload"."enum__guides_v_version_kind" DEFAULT 'cost',
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_standfirst" varchar,
  	"version_hero_id" integer,
  	"version_body" jsonb,
  	"version_city_id" integer,
  	"version_format_id" integer,
  	"version_listing_query_area" varchar,
  	"version_listing_query_format" varchar,
  	"version_toc_enabled" boolean DEFAULT true,
  	"version_last_refreshed_at" timestamp(3) with time zone,
  	"version_workflow" "payload"."enum__guides_v_version_workflow" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_created_by_id" integer,
  	"version_sponsor_enabled" boolean DEFAULT false,
  	"version_sponsor_company_id" integer,
  	"version_sponsor_label" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_guides_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"tags_id" integer,
  	"sources_id" integer
  );
  
  CREATE TABLE "payload"."reports_charts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"series" jsonb
  );
  
  CREATE TABLE "payload"."reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"period" varchar,
  	"standfirst" varchar,
  	"body" jsonb,
  	"method_notes" jsonb,
  	"dataset_id" integer,
  	"workflow" "payload"."enum_reports_workflow" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"created_by_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_reports_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."reports_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"sources_id" integer
  );
  
  CREATE TABLE "payload"."_reports_v_version_charts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"series" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_reports_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_period" varchar,
  	"version_standfirst" varchar,
  	"version_body" jsonb,
  	"version_method_notes" jsonb,
  	"version_dataset_id" integer,
  	"version_workflow" "payload"."enum__reports_v_version_workflow" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_created_by_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__reports_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_reports_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"sources_id" integer
  );
  
  CREATE TABLE "payload"."sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"publisher" varchar NOT NULL,
  	"url" varchar,
  	"published_on" timestamp(3) with time zone,
  	"retrieved_on" timestamp(3) with time zone NOT NULL,
  	"type" "payload"."enum_sources_type" NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."people_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."people_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"role" varchar NOT NULL,
  	"bio" varchar NOT NULL,
  	"photo_id" integer,
  	"email" varchar,
  	"verified" boolean DEFAULT false,
  	"verified_at" timestamp(3) with time zone,
  	"user_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."companies_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."companies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"type" "payload"."enum_companies_type" NOT NULL,
  	"logo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"kind" "payload"."enum_tags_kind" NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar NOT NULL,
  	"licence" "payload"."enum_media_licence" DEFAULT 'owned' NOT NULL,
  	"taken_at" timestamp(3) with time zone,
  	"place_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "payload"."issues_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"external_url" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "payload"."issues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "payload"."enum_issues_kind" NOT NULL,
  	"subject" varchar NOT NULL,
  	"preheader" varchar,
  	"sponsor_id" integer,
  	"sent_at" timestamp(3) with time zone,
  	"stats_recipients" numeric,
  	"stats_opens" numeric,
  	"stats_clicks" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."issues_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"guides_id" integer,
  	"reports_id" integer
  );
  
  CREATE TABLE "payload"."follows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"city" varchar,
  	"format" varchar,
  	"query" varchar,
  	"search" varchar,
  	"source" "payload"."enum_follows_source" DEFAULT 'search' NOT NULL,
  	"confirmed" boolean DEFAULT false,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."subscribers_lists" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_subscribers_lists",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"source" varchar,
  	"confirmed" boolean DEFAULT false,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."corrections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar NOT NULL,
  	"corrected_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."corrections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"guides_id" integer,
  	"reports_id" integer
  );
  
  CREATE TABLE "payload"."outbox" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"to" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"kind" "payload"."enum_outbox_kind" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."owner_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"kind" "payload"."enum_owner_files_kind" NOT NULL,
  	"note" varchar,
  	"handled" boolean DEFAULT false,
  	"report" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."access_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"token" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"used_at" timestamp(3) with time zone,
  	"details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "payload"."enum_users_role" DEFAULT 'writer' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sites_id" integer,
  	"owners_id" integer,
  	"enquiries_id" integer,
  	"messages_id" integer,
  	"articles_id" integer,
  	"guides_id" integer,
  	"reports_id" integer,
  	"sources_id" integer,
  	"people_id" integer,
  	"companies_id" integer,
  	"tags_id" integer,
  	"media_id" integer,
  	"issues_id" integer,
  	"follows_id" integer,
  	"subscribers_id" integer,
  	"corrections_id" integer,
  	"outbox_id" integer,
  	"owner_files_id" integer,
  	"access_codes_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."sites_photos" ADD CONSTRAINT "sites_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."sites_photos" ADD CONSTRAINT "sites_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."sites" ADD CONSTRAINT "sites_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."owners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_sites_v_version_photos" ADD CONSTRAINT "_sites_v_version_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_sites_v_version_photos" ADD CONSTRAINT "_sites_v_version_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_sites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_sites_v" ADD CONSTRAINT "_sites_v_parent_id_sites_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_sites_v" ADD CONSTRAINT "_sites_v_version_owner_id_owners_id_fk" FOREIGN KEY ("version_owner_id") REFERENCES "payload"."owners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."enquiries" ADD CONSTRAINT "enquiries_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "payload"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."enquiries" ADD CONSTRAINT "enquiries_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."owners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."enquiries_rels" ADD CONSTRAINT "enquiries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."enquiries_rels" ADD CONSTRAINT "enquiries_rels_sites_fk" FOREIGN KEY ("sites_id") REFERENCES "payload"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."messages_answers" ADD CONSTRAINT "messages_answers_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "payload"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."messages_answers" ADD CONSTRAINT "messages_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."messages" ADD CONSTRAINT "messages_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "payload"."enquiries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_related_faces" ADD CONSTRAINT "articles_related_faces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_sponsor_company_id_companies_id_fk" FOREIGN KEY ("sponsor_company_id") REFERENCES "payload"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_rels" ADD CONSTRAINT "articles_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_rels" ADD CONSTRAINT "articles_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_version_related_faces" ADD CONSTRAINT "_articles_v_version_related_faces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_sponsor_company_id_companies_id_fk" FOREIGN KEY ("version_sponsor_company_id") REFERENCES "payload"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."guides" ADD CONSTRAINT "guides_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."guides" ADD CONSTRAINT "guides_city_id_tags_id_fk" FOREIGN KEY ("city_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."guides" ADD CONSTRAINT "guides_format_id_tags_id_fk" FOREIGN KEY ("format_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."guides" ADD CONSTRAINT "guides_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."guides" ADD CONSTRAINT "guides_sponsor_company_id_companies_id_fk" FOREIGN KEY ("sponsor_company_id") REFERENCES "payload"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."guides_rels" ADD CONSTRAINT "guides_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."guides_rels" ADD CONSTRAINT "guides_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."guides_rels" ADD CONSTRAINT "guides_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_parent_id_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_version_city_id_tags_id_fk" FOREIGN KEY ("version_city_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_version_format_id_tags_id_fk" FOREIGN KEY ("version_format_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v" ADD CONSTRAINT "_guides_v_version_sponsor_company_id_companies_id_fk" FOREIGN KEY ("version_sponsor_company_id") REFERENCES "payload"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reports_charts" ADD CONSTRAINT "reports_charts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reports" ADD CONSTRAINT "reports_dataset_id_media_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reports" ADD CONSTRAINT "reports_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reports_rels" ADD CONSTRAINT "reports_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reports_rels" ADD CONSTRAINT "reports_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reports_rels" ADD CONSTRAINT "reports_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v_version_charts" ADD CONSTRAINT "_reports_v_version_charts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v" ADD CONSTRAINT "_reports_v_parent_id_reports_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."reports"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v" ADD CONSTRAINT "_reports_v_version_dataset_id_media_id_fk" FOREIGN KEY ("version_dataset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v" ADD CONSTRAINT "_reports_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."people_credentials" ADD CONSTRAINT "people_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."people_links" ADD CONSTRAINT "people_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."people" ADD CONSTRAINT "people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."companies_links" ADD CONSTRAINT "companies_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."companies" ADD CONSTRAINT "companies_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."media" ADD CONSTRAINT "media_place_id_tags_id_fk" FOREIGN KEY ("place_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."issues_items" ADD CONSTRAINT "issues_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."issues" ADD CONSTRAINT "issues_sponsor_id_companies_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "payload"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."issues_rels" ADD CONSTRAINT "issues_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."issues_rels" ADD CONSTRAINT "issues_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."issues_rels" ADD CONSTRAINT "issues_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "payload"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."issues_rels" ADD CONSTRAINT "issues_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."subscribers_lists" ADD CONSTRAINT "subscribers_lists_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."corrections_rels" ADD CONSTRAINT "corrections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."corrections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."corrections_rels" ADD CONSTRAINT "corrections_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."corrections_rels" ADD CONSTRAINT "corrections_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "payload"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."corrections_rels" ADD CONSTRAINT "corrections_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."owner_files" ADD CONSTRAINT "owner_files_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."owners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sites_fk" FOREIGN KEY ("sites_id") REFERENCES "payload"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_owners_fk" FOREIGN KEY ("owners_id") REFERENCES "payload"."owners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "payload"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "payload"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "payload"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "payload"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_companies_fk" FOREIGN KEY ("companies_id") REFERENCES "payload"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_issues_fk" FOREIGN KEY ("issues_id") REFERENCES "payload"."issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_follows_fk" FOREIGN KEY ("follows_id") REFERENCES "payload"."follows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "payload"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_corrections_fk" FOREIGN KEY ("corrections_id") REFERENCES "payload"."corrections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outbox_fk" FOREIGN KEY ("outbox_id") REFERENCES "payload"."outbox"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_owner_files_fk" FOREIGN KEY ("owner_files_id") REFERENCES "payload"."owner_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_access_codes_fk" FOREIGN KEY ("access_codes_id") REFERENCES "payload"."access_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sites_photos_order_idx" ON "payload"."sites_photos" USING btree ("_order");
  CREATE INDEX "sites_photos_parent_id_idx" ON "payload"."sites_photos" USING btree ("_parent_id");
  CREATE INDEX "sites_photos_image_idx" ON "payload"."sites_photos" USING btree ("image_id");
  CREATE INDEX "sites_slug_idx" ON "payload"."sites" USING btree ("slug");
  CREATE INDEX "sites_review_idx" ON "payload"."sites" USING btree ("review");
  CREATE INDEX "sites_owner_ref_idx" ON "payload"."sites" USING btree ("owner_ref");
  CREATE UNIQUE INDEX "sites_permanent_id_idx" ON "payload"."sites" USING btree ("permanent_id");
  CREATE INDEX "sites_owner_idx" ON "payload"."sites" USING btree ("owner_id");
  CREATE INDEX "sites_locality_slug_idx" ON "payload"."sites" USING btree ("locality_slug");
  CREATE INDEX "sites_updated_at_idx" ON "payload"."sites" USING btree ("updated_at");
  CREATE INDEX "sites_created_at_idx" ON "payload"."sites" USING btree ("created_at");
  CREATE INDEX "sites__status_idx" ON "payload"."sites" USING btree ("_status");
  CREATE INDEX "_sites_v_version_photos_order_idx" ON "payload"."_sites_v_version_photos" USING btree ("_order");
  CREATE INDEX "_sites_v_version_photos_parent_id_idx" ON "payload"."_sites_v_version_photos" USING btree ("_parent_id");
  CREATE INDEX "_sites_v_version_photos_image_idx" ON "payload"."_sites_v_version_photos" USING btree ("image_id");
  CREATE INDEX "_sites_v_parent_idx" ON "payload"."_sites_v" USING btree ("parent_id");
  CREATE INDEX "_sites_v_version_version_slug_idx" ON "payload"."_sites_v" USING btree ("version_slug");
  CREATE INDEX "_sites_v_version_version_review_idx" ON "payload"."_sites_v" USING btree ("version_review");
  CREATE INDEX "_sites_v_version_version_owner_ref_idx" ON "payload"."_sites_v" USING btree ("version_owner_ref");
  CREATE INDEX "_sites_v_version_version_permanent_id_idx" ON "payload"."_sites_v" USING btree ("version_permanent_id");
  CREATE INDEX "_sites_v_version_version_owner_idx" ON "payload"."_sites_v" USING btree ("version_owner_id");
  CREATE INDEX "_sites_v_version_version_locality_slug_idx" ON "payload"."_sites_v" USING btree ("version_locality_slug");
  CREATE INDEX "_sites_v_version_version_updated_at_idx" ON "payload"."_sites_v" USING btree ("version_updated_at");
  CREATE INDEX "_sites_v_version_version_created_at_idx" ON "payload"."_sites_v" USING btree ("version_created_at");
  CREATE INDEX "_sites_v_version_version__status_idx" ON "payload"."_sites_v" USING btree ("version__status");
  CREATE INDEX "_sites_v_created_at_idx" ON "payload"."_sites_v" USING btree ("created_at");
  CREATE INDEX "_sites_v_updated_at_idx" ON "payload"."_sites_v" USING btree ("updated_at");
  CREATE INDEX "_sites_v_latest_idx" ON "payload"."_sites_v" USING btree ("latest");
  CREATE UNIQUE INDEX "owners_slug_idx" ON "payload"."owners" USING btree ("slug");
  CREATE UNIQUE INDEX "owners_login_email_idx" ON "payload"."owners" USING btree ("login_email");
  CREATE INDEX "owners_updated_at_idx" ON "payload"."owners" USING btree ("updated_at");
  CREATE INDEX "owners_created_at_idx" ON "payload"."owners" USING btree ("created_at");
  CREATE UNIQUE INDEX "enquiries_reference_idx" ON "payload"."enquiries" USING btree ("reference");
  CREATE INDEX "enquiries_site_idx" ON "payload"."enquiries" USING btree ("site_id");
  CREATE INDEX "enquiries_plan_idx" ON "payload"."enquiries" USING btree ("plan");
  CREATE INDEX "enquiries_owner_idx" ON "payload"."enquiries" USING btree ("owner_id");
  CREATE INDEX "enquiries_email_idx" ON "payload"."enquiries" USING btree ("email");
  CREATE INDEX "enquiries_updated_at_idx" ON "payload"."enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "payload"."enquiries" USING btree ("created_at");
  CREATE INDEX "enquiries_rels_order_idx" ON "payload"."enquiries_rels" USING btree ("order");
  CREATE INDEX "enquiries_rels_parent_idx" ON "payload"."enquiries_rels" USING btree ("parent_id");
  CREATE INDEX "enquiries_rels_path_idx" ON "payload"."enquiries_rels" USING btree ("path");
  CREATE INDEX "enquiries_rels_sites_id_idx" ON "payload"."enquiries_rels" USING btree ("sites_id");
  CREATE INDEX "messages_answers_order_idx" ON "payload"."messages_answers" USING btree ("_order");
  CREATE INDEX "messages_answers_parent_id_idx" ON "payload"."messages_answers" USING btree ("_parent_id");
  CREATE INDEX "messages_answers_site_idx" ON "payload"."messages_answers" USING btree ("site_id");
  CREATE INDEX "messages_enquiry_idx" ON "payload"."messages" USING btree ("enquiry_id");
  CREATE INDEX "messages_updated_at_idx" ON "payload"."messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "payload"."messages" USING btree ("created_at");
  CREATE INDEX "articles_related_faces_order_idx" ON "payload"."articles_related_faces" USING btree ("_order");
  CREATE INDEX "articles_related_faces_parent_id_idx" ON "payload"."articles_related_faces" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "payload"."articles" USING btree ("slug");
  CREATE INDEX "articles_hero_idx" ON "payload"."articles" USING btree ("hero_id");
  CREATE INDEX "articles_created_by_idx" ON "payload"."articles" USING btree ("created_by_id");
  CREATE INDEX "articles_sponsor_sponsor_company_idx" ON "payload"."articles" USING btree ("sponsor_company_id");
  CREATE INDEX "articles_updated_at_idx" ON "payload"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "payload"."articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "payload"."articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "payload"."articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "payload"."articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "payload"."articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_people_id_idx" ON "payload"."articles_rels" USING btree ("people_id");
  CREATE INDEX "articles_rels_tags_id_idx" ON "payload"."articles_rels" USING btree ("tags_id");
  CREATE INDEX "articles_rels_sources_id_idx" ON "payload"."articles_rels" USING btree ("sources_id");
  CREATE INDEX "_articles_v_version_related_faces_order_idx" ON "payload"."_articles_v_version_related_faces" USING btree ("_order");
  CREATE INDEX "_articles_v_version_related_faces_parent_id_idx" ON "payload"."_articles_v_version_related_faces" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "payload"."_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "payload"."_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_hero_idx" ON "payload"."_articles_v" USING btree ("version_hero_id");
  CREATE INDEX "_articles_v_version_version_created_by_idx" ON "payload"."_articles_v" USING btree ("version_created_by_id");
  CREATE INDEX "_articles_v_version_sponsor_version_sponsor_company_idx" ON "payload"."_articles_v" USING btree ("version_sponsor_company_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "payload"."_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "payload"."_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "payload"."_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "payload"."_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "payload"."_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "payload"."_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "payload"."_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_rels_order_idx" ON "payload"."_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "payload"."_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "payload"."_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_people_id_idx" ON "payload"."_articles_v_rels" USING btree ("people_id");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "payload"."_articles_v_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_rels_sources_id_idx" ON "payload"."_articles_v_rels" USING btree ("sources_id");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "payload"."guides" USING btree ("slug");
  CREATE INDEX "guides_hero_idx" ON "payload"."guides" USING btree ("hero_id");
  CREATE INDEX "guides_city_idx" ON "payload"."guides" USING btree ("city_id");
  CREATE INDEX "guides_format_idx" ON "payload"."guides" USING btree ("format_id");
  CREATE INDEX "guides_created_by_idx" ON "payload"."guides" USING btree ("created_by_id");
  CREATE INDEX "guides_sponsor_sponsor_company_idx" ON "payload"."guides" USING btree ("sponsor_company_id");
  CREATE INDEX "guides_updated_at_idx" ON "payload"."guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "payload"."guides" USING btree ("created_at");
  CREATE INDEX "guides__status_idx" ON "payload"."guides" USING btree ("_status");
  CREATE INDEX "guides_rels_order_idx" ON "payload"."guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "payload"."guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "payload"."guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_people_id_idx" ON "payload"."guides_rels" USING btree ("people_id");
  CREATE INDEX "guides_rels_tags_id_idx" ON "payload"."guides_rels" USING btree ("tags_id");
  CREATE INDEX "guides_rels_sources_id_idx" ON "payload"."guides_rels" USING btree ("sources_id");
  CREATE INDEX "_guides_v_parent_idx" ON "payload"."_guides_v" USING btree ("parent_id");
  CREATE INDEX "_guides_v_version_version_slug_idx" ON "payload"."_guides_v" USING btree ("version_slug");
  CREATE INDEX "_guides_v_version_version_hero_idx" ON "payload"."_guides_v" USING btree ("version_hero_id");
  CREATE INDEX "_guides_v_version_version_city_idx" ON "payload"."_guides_v" USING btree ("version_city_id");
  CREATE INDEX "_guides_v_version_version_format_idx" ON "payload"."_guides_v" USING btree ("version_format_id");
  CREATE INDEX "_guides_v_version_version_created_by_idx" ON "payload"."_guides_v" USING btree ("version_created_by_id");
  CREATE INDEX "_guides_v_version_sponsor_version_sponsor_company_idx" ON "payload"."_guides_v" USING btree ("version_sponsor_company_id");
  CREATE INDEX "_guides_v_version_version_updated_at_idx" ON "payload"."_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_guides_v_version_version_created_at_idx" ON "payload"."_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_guides_v_version_version__status_idx" ON "payload"."_guides_v" USING btree ("version__status");
  CREATE INDEX "_guides_v_created_at_idx" ON "payload"."_guides_v" USING btree ("created_at");
  CREATE INDEX "_guides_v_updated_at_idx" ON "payload"."_guides_v" USING btree ("updated_at");
  CREATE INDEX "_guides_v_latest_idx" ON "payload"."_guides_v" USING btree ("latest");
  CREATE INDEX "_guides_v_autosave_idx" ON "payload"."_guides_v" USING btree ("autosave");
  CREATE INDEX "_guides_v_rels_order_idx" ON "payload"."_guides_v_rels" USING btree ("order");
  CREATE INDEX "_guides_v_rels_parent_idx" ON "payload"."_guides_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guides_v_rels_path_idx" ON "payload"."_guides_v_rels" USING btree ("path");
  CREATE INDEX "_guides_v_rels_people_id_idx" ON "payload"."_guides_v_rels" USING btree ("people_id");
  CREATE INDEX "_guides_v_rels_tags_id_idx" ON "payload"."_guides_v_rels" USING btree ("tags_id");
  CREATE INDEX "_guides_v_rels_sources_id_idx" ON "payload"."_guides_v_rels" USING btree ("sources_id");
  CREATE INDEX "reports_charts_order_idx" ON "payload"."reports_charts" USING btree ("_order");
  CREATE INDEX "reports_charts_parent_id_idx" ON "payload"."reports_charts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "reports_slug_idx" ON "payload"."reports" USING btree ("slug");
  CREATE INDEX "reports_dataset_idx" ON "payload"."reports" USING btree ("dataset_id");
  CREATE INDEX "reports_created_by_idx" ON "payload"."reports" USING btree ("created_by_id");
  CREATE INDEX "reports_updated_at_idx" ON "payload"."reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "payload"."reports" USING btree ("created_at");
  CREATE INDEX "reports__status_idx" ON "payload"."reports" USING btree ("_status");
  CREATE INDEX "reports_rels_order_idx" ON "payload"."reports_rels" USING btree ("order");
  CREATE INDEX "reports_rels_parent_idx" ON "payload"."reports_rels" USING btree ("parent_id");
  CREATE INDEX "reports_rels_path_idx" ON "payload"."reports_rels" USING btree ("path");
  CREATE INDEX "reports_rels_people_id_idx" ON "payload"."reports_rels" USING btree ("people_id");
  CREATE INDEX "reports_rels_sources_id_idx" ON "payload"."reports_rels" USING btree ("sources_id");
  CREATE INDEX "_reports_v_version_charts_order_idx" ON "payload"."_reports_v_version_charts" USING btree ("_order");
  CREATE INDEX "_reports_v_version_charts_parent_id_idx" ON "payload"."_reports_v_version_charts" USING btree ("_parent_id");
  CREATE INDEX "_reports_v_parent_idx" ON "payload"."_reports_v" USING btree ("parent_id");
  CREATE INDEX "_reports_v_version_version_slug_idx" ON "payload"."_reports_v" USING btree ("version_slug");
  CREATE INDEX "_reports_v_version_version_dataset_idx" ON "payload"."_reports_v" USING btree ("version_dataset_id");
  CREATE INDEX "_reports_v_version_version_created_by_idx" ON "payload"."_reports_v" USING btree ("version_created_by_id");
  CREATE INDEX "_reports_v_version_version_updated_at_idx" ON "payload"."_reports_v" USING btree ("version_updated_at");
  CREATE INDEX "_reports_v_version_version_created_at_idx" ON "payload"."_reports_v" USING btree ("version_created_at");
  CREATE INDEX "_reports_v_version_version__status_idx" ON "payload"."_reports_v" USING btree ("version__status");
  CREATE INDEX "_reports_v_created_at_idx" ON "payload"."_reports_v" USING btree ("created_at");
  CREATE INDEX "_reports_v_updated_at_idx" ON "payload"."_reports_v" USING btree ("updated_at");
  CREATE INDEX "_reports_v_latest_idx" ON "payload"."_reports_v" USING btree ("latest");
  CREATE INDEX "_reports_v_rels_order_idx" ON "payload"."_reports_v_rels" USING btree ("order");
  CREATE INDEX "_reports_v_rels_parent_idx" ON "payload"."_reports_v_rels" USING btree ("parent_id");
  CREATE INDEX "_reports_v_rels_path_idx" ON "payload"."_reports_v_rels" USING btree ("path");
  CREATE INDEX "_reports_v_rels_people_id_idx" ON "payload"."_reports_v_rels" USING btree ("people_id");
  CREATE INDEX "_reports_v_rels_sources_id_idx" ON "payload"."_reports_v_rels" USING btree ("sources_id");
  CREATE INDEX "sources_updated_at_idx" ON "payload"."sources" USING btree ("updated_at");
  CREATE INDEX "sources_created_at_idx" ON "payload"."sources" USING btree ("created_at");
  CREATE INDEX "people_credentials_order_idx" ON "payload"."people_credentials" USING btree ("_order");
  CREATE INDEX "people_credentials_parent_id_idx" ON "payload"."people_credentials" USING btree ("_parent_id");
  CREATE INDEX "people_links_order_idx" ON "payload"."people_links" USING btree ("_order");
  CREATE INDEX "people_links_parent_id_idx" ON "payload"."people_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "people_slug_idx" ON "payload"."people" USING btree ("slug");
  CREATE INDEX "people_photo_idx" ON "payload"."people" USING btree ("photo_id");
  CREATE INDEX "people_user_idx" ON "payload"."people" USING btree ("user_id");
  CREATE INDEX "people_updated_at_idx" ON "payload"."people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "payload"."people" USING btree ("created_at");
  CREATE INDEX "companies_links_order_idx" ON "payload"."companies_links" USING btree ("_order");
  CREATE INDEX "companies_links_parent_id_idx" ON "payload"."companies_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "companies_slug_idx" ON "payload"."companies" USING btree ("slug");
  CREATE INDEX "companies_logo_idx" ON "payload"."companies" USING btree ("logo_id");
  CREATE INDEX "companies_updated_at_idx" ON "payload"."companies" USING btree ("updated_at");
  CREATE INDEX "companies_created_at_idx" ON "payload"."companies" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "payload"."tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "payload"."tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "payload"."tags" USING btree ("created_at");
  CREATE INDEX "media_place_idx" ON "payload"."media" USING btree ("place_id");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "issues_items_order_idx" ON "payload"."issues_items" USING btree ("_order");
  CREATE INDEX "issues_items_parent_id_idx" ON "payload"."issues_items" USING btree ("_parent_id");
  CREATE INDEX "issues_sponsor_idx" ON "payload"."issues" USING btree ("sponsor_id");
  CREATE INDEX "issues_updated_at_idx" ON "payload"."issues" USING btree ("updated_at");
  CREATE INDEX "issues_created_at_idx" ON "payload"."issues" USING btree ("created_at");
  CREATE INDEX "issues_rels_order_idx" ON "payload"."issues_rels" USING btree ("order");
  CREATE INDEX "issues_rels_parent_idx" ON "payload"."issues_rels" USING btree ("parent_id");
  CREATE INDEX "issues_rels_path_idx" ON "payload"."issues_rels" USING btree ("path");
  CREATE INDEX "issues_rels_articles_id_idx" ON "payload"."issues_rels" USING btree ("articles_id");
  CREATE INDEX "issues_rels_guides_id_idx" ON "payload"."issues_rels" USING btree ("guides_id");
  CREATE INDEX "issues_rels_reports_id_idx" ON "payload"."issues_rels" USING btree ("reports_id");
  CREATE INDEX "follows_email_idx" ON "payload"."follows" USING btree ("email");
  CREATE INDEX "follows_city_idx" ON "payload"."follows" USING btree ("city");
  CREATE INDEX "follows_updated_at_idx" ON "payload"."follows" USING btree ("updated_at");
  CREATE INDEX "follows_created_at_idx" ON "payload"."follows" USING btree ("created_at");
  CREATE INDEX "subscribers_lists_order_idx" ON "payload"."subscribers_lists" USING btree ("order");
  CREATE INDEX "subscribers_lists_parent_idx" ON "payload"."subscribers_lists" USING btree ("parent_id");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "payload"."subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "payload"."subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "payload"."subscribers" USING btree ("created_at");
  CREATE INDEX "corrections_updated_at_idx" ON "payload"."corrections" USING btree ("updated_at");
  CREATE INDEX "corrections_created_at_idx" ON "payload"."corrections" USING btree ("created_at");
  CREATE INDEX "corrections_rels_order_idx" ON "payload"."corrections_rels" USING btree ("order");
  CREATE INDEX "corrections_rels_parent_idx" ON "payload"."corrections_rels" USING btree ("parent_id");
  CREATE INDEX "corrections_rels_path_idx" ON "payload"."corrections_rels" USING btree ("path");
  CREATE INDEX "corrections_rels_articles_id_idx" ON "payload"."corrections_rels" USING btree ("articles_id");
  CREATE INDEX "corrections_rels_guides_id_idx" ON "payload"."corrections_rels" USING btree ("guides_id");
  CREATE INDEX "corrections_rels_reports_id_idx" ON "payload"."corrections_rels" USING btree ("reports_id");
  CREATE INDEX "outbox_to_idx" ON "payload"."outbox" USING btree ("to");
  CREATE INDEX "outbox_updated_at_idx" ON "payload"."outbox" USING btree ("updated_at");
  CREATE INDEX "outbox_created_at_idx" ON "payload"."outbox" USING btree ("created_at");
  CREATE INDEX "owner_files_owner_idx" ON "payload"."owner_files" USING btree ("owner_id");
  CREATE INDEX "owner_files_updated_at_idx" ON "payload"."owner_files" USING btree ("updated_at");
  CREATE INDEX "owner_files_created_at_idx" ON "payload"."owner_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "owner_files_filename_idx" ON "payload"."owner_files" USING btree ("filename");
  CREATE INDEX "access_codes_email_idx" ON "payload"."access_codes" USING btree ("email");
  CREATE UNIQUE INDEX "access_codes_token_idx" ON "payload"."access_codes" USING btree ("token");
  CREATE INDEX "access_codes_updated_at_idx" ON "payload"."access_codes" USING btree ("updated_at");
  CREATE INDEX "access_codes_created_at_idx" ON "payload"."access_codes" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_sites_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("sites_id");
  CREATE INDEX "payload_locked_documents_rels_owners_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("owners_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("messages_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_locked_documents_rels_sources_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("sources_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_companies_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("companies_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_issues_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("issues_id");
  CREATE INDEX "payload_locked_documents_rels_follows_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("follows_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_corrections_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("corrections_id");
  CREATE INDEX "payload_locked_documents_rels_outbox_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("outbox_id");
  CREATE INDEX "payload_locked_documents_rels_owner_files_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("owner_files_id");
  CREATE INDEX "payload_locked_documents_rels_access_codes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("access_codes_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."sites_photos" CASCADE;
  DROP TABLE "payload"."sites" CASCADE;
  DROP TABLE "payload"."_sites_v_version_photos" CASCADE;
  DROP TABLE "payload"."_sites_v" CASCADE;
  DROP TABLE "payload"."owners" CASCADE;
  DROP TABLE "payload"."enquiries" CASCADE;
  DROP TABLE "payload"."enquiries_rels" CASCADE;
  DROP TABLE "payload"."messages_answers" CASCADE;
  DROP TABLE "payload"."messages" CASCADE;
  DROP TABLE "payload"."articles_related_faces" CASCADE;
  DROP TABLE "payload"."articles" CASCADE;
  DROP TABLE "payload"."articles_rels" CASCADE;
  DROP TABLE "payload"."_articles_v_version_related_faces" CASCADE;
  DROP TABLE "payload"."_articles_v" CASCADE;
  DROP TABLE "payload"."_articles_v_rels" CASCADE;
  DROP TABLE "payload"."guides" CASCADE;
  DROP TABLE "payload"."guides_rels" CASCADE;
  DROP TABLE "payload"."_guides_v" CASCADE;
  DROP TABLE "payload"."_guides_v_rels" CASCADE;
  DROP TABLE "payload"."reports_charts" CASCADE;
  DROP TABLE "payload"."reports" CASCADE;
  DROP TABLE "payload"."reports_rels" CASCADE;
  DROP TABLE "payload"."_reports_v_version_charts" CASCADE;
  DROP TABLE "payload"."_reports_v" CASCADE;
  DROP TABLE "payload"."_reports_v_rels" CASCADE;
  DROP TABLE "payload"."sources" CASCADE;
  DROP TABLE "payload"."people_credentials" CASCADE;
  DROP TABLE "payload"."people_links" CASCADE;
  DROP TABLE "payload"."people" CASCADE;
  DROP TABLE "payload"."companies_links" CASCADE;
  DROP TABLE "payload"."companies" CASCADE;
  DROP TABLE "payload"."tags" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."issues_items" CASCADE;
  DROP TABLE "payload"."issues" CASCADE;
  DROP TABLE "payload"."issues_rels" CASCADE;
  DROP TABLE "payload"."follows" CASCADE;
  DROP TABLE "payload"."subscribers_lists" CASCADE;
  DROP TABLE "payload"."subscribers" CASCADE;
  DROP TABLE "payload"."corrections" CASCADE;
  DROP TABLE "payload"."corrections_rels" CASCADE;
  DROP TABLE "payload"."outbox" CASCADE;
  DROP TABLE "payload"."owner_files" CASCADE;
  DROP TABLE "payload"."access_codes" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TYPE "payload"."enum_sites_photos_kind";
  DROP TYPE "payload"."enum_sites_review";
  DROP TYPE "payload"."enum_sites_source";
  DROP TYPE "payload"."enum_sites_format";
  DROP TYPE "payload"."enum_sites_environment";
  DROP TYPE "payload"."enum_sites_size_unit";
  DROP TYPE "payload"."enum_sites_lighting";
  DROP TYPE "payload"."enum_sites_city";
  DROP TYPE "payload"."enum_sites_price_display";
  DROP TYPE "payload"."enum_sites_status";
  DROP TYPE "payload"."enum__sites_v_version_photos_kind";
  DROP TYPE "payload"."enum__sites_v_version_review";
  DROP TYPE "payload"."enum__sites_v_version_source";
  DROP TYPE "payload"."enum__sites_v_version_format";
  DROP TYPE "payload"."enum__sites_v_version_environment";
  DROP TYPE "payload"."enum__sites_v_version_size_unit";
  DROP TYPE "payload"."enum__sites_v_version_lighting";
  DROP TYPE "payload"."enum__sites_v_version_city";
  DROP TYPE "payload"."enum__sites_v_version_price_display";
  DROP TYPE "payload"."enum__sites_v_version_status";
  DROP TYPE "payload"."enum_owners_city";
  DROP TYPE "payload"."enum_owners_source";
  DROP TYPE "payload"."enum_enquiries_artwork";
  DROP TYPE "payload"."enum_enquiries_status";
  DROP TYPE "payload"."enum_messages_answers_availability";
  DROP TYPE "payload"."enum_messages_from";
  DROP TYPE "payload"."enum_articles_pillar";
  DROP TYPE "payload"."enum_articles_layout";
  DROP TYPE "payload"."enum_articles_workflow";
  DROP TYPE "payload"."enum_articles_status";
  DROP TYPE "payload"."enum__articles_v_version_pillar";
  DROP TYPE "payload"."enum__articles_v_version_layout";
  DROP TYPE "payload"."enum__articles_v_version_workflow";
  DROP TYPE "payload"."enum__articles_v_version_status";
  DROP TYPE "payload"."enum_guides_kind";
  DROP TYPE "payload"."enum_guides_workflow";
  DROP TYPE "payload"."enum_guides_status";
  DROP TYPE "payload"."enum__guides_v_version_kind";
  DROP TYPE "payload"."enum__guides_v_version_workflow";
  DROP TYPE "payload"."enum__guides_v_version_status";
  DROP TYPE "payload"."enum_reports_workflow";
  DROP TYPE "payload"."enum_reports_status";
  DROP TYPE "payload"."enum__reports_v_version_workflow";
  DROP TYPE "payload"."enum__reports_v_version_status";
  DROP TYPE "payload"."enum_sources_type";
  DROP TYPE "payload"."enum_companies_type";
  DROP TYPE "payload"."enum_tags_kind";
  DROP TYPE "payload"."enum_media_licence";
  DROP TYPE "payload"."enum_issues_kind";
  DROP TYPE "payload"."enum_follows_source";
  DROP TYPE "payload"."enum_subscribers_lists";
  DROP TYPE "payload"."enum_outbox_kind";
  DROP TYPE "payload"."enum_owner_files_kind";
  DROP TYPE "payload"."enum_users_role";`)
}
