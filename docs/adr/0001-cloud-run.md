# ADR 0001: Run the app on Google Cloud Run in Mumbai

Date: 9 Oct 2026. Status: accepted.

## Context

The strategy needs hundreds of thousands of server-rendered pages with real status codes, one background job per listing change, and India-first latency. The founder ruled out Vercel and chose between AWS and Google Cloud with no existing accounts or credits. The team is 4 to 8 engineers without a dedicated ops role.

## Decision

Deploy one container image to two Cloud Run services in `asia-south1`: `web` (Next.js standalone, min 1 instance in prod) and `jobs` (same image, `SERVICE_ROLE=jobs`, serves only the Inngest handler, more CPU and memory, long timeout). Cloud SQL Postgres 16 with PostGIS and Memorystore Redis on private IP, reached through Direct VPC egress. Cloudflare in front; a Transform Rule adds `X-Origin-Secret`, which the Next.js middleware requires outside local development. GitHub Actions deploys through Workload Identity Federation. Terraform manages Google Cloud and Cloudflare.

## Consequences

- ISR output must be shared across instances, so Next.js uses a Redis-backed cache handler (M2).
- Previews are tagged revisions on the staging service against the staging database, so migrations follow expand-then-contract.
- No load balancer or Cloud Armor at launch; add them if the origin-secret check proves insufficient.
- Cost is per instance-hour, roughly 500 to 1,000 USD a month in Phase 1 for prod.
