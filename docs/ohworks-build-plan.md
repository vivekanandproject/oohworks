# ohworks.com: end-to-end build plan (Phase 1, India launch)

Date: 9 Oct 2026. Companion to `ohworks-architecture.md` (the what) and the strategy report (the why). This document is the how and when: cloud setup, environments, milestones, team split, costs and the checklist we run on day one.

Decisions fixed for this plan:

- **Cloud:** Google Cloud, region `asia-south1` (Mumbai). Vercel is ruled out. AWS considered and not chosen (more moving parts for the same result).
- **Accounts:** starting fresh. No existing organisation, billing or credits.
- **Team:** 4 to 8 engineers. Phase 1 is 26 weeks.
- **Images, sitemaps, exports:** stay on Cloudflare R2 and Cloudflare Images (no egress fees), not Cloud Storage.
- **Search and jobs:** Typesense Cloud and Inngest Cloud as hosted services, both invoked from or reaching into Cloud Run.

## 1. Target infrastructure on Google Cloud

```
Internet ──► Cloudflare (DNS, WAF, cache, bot rules, R2, Images)
                 │  proxied; adds X-Origin-Secret header via Transform Rule
                 ▼
         Cloud Run service `web`        asia-south1, Next.js standalone, min 1 instance (prod)
                 │                        middleware rejects requests without X-Origin-Secret
                 ├──► Cloud SQL Postgres 16 + PostGIS   private IP, Direct VPC egress
                 ├──► Memorystore Redis 1 GB             ISR cache handler, OTP, rate limits, redirects
                 ├──► Typesense Cloud (Mumbai)           search index
                 ├──► Cloudflare R2                      photos, sitemaps, exports (S3 API)
                 └──► Secret Manager                     all credentials, mounted as env

Inngest Cloud ──► Cloud Run service `jobs`   same image, serves only /api/inngest, 2 vCPU / 4 GB, 60 min timeout
                 (listing.changed, enquiry fan-out, imports, image pipeline, crons)

GitHub Actions ──(Workload Identity Federation)──► Artifact Registry ──► Cloud Run revisions
                                                └► Cloud Run job `migrate` (Drizzle migrations) before each deploy
```

### Google Cloud projects

| Project | Purpose | Notes |
| --- | --- | --- |
| `ohworks-prod` | Production | Cloud SQL with HA off at launch, daily backups, 7-day PITR, deletion protection on |
| `ohworks-staging` | Staging and per-PR previews | Cloud Run scales to zero; Cloud SQL smallest tier; shared by previews |
| `ohworks-shared` | Artifact Registry, Terraform state bucket, WIF pool, DNS of nothing | One place for build artefacts |

Local development uses Docker Compose (Postgres+PostGIS, Redis, Typesense, Inngest dev server, Mailpit) and needs no cloud account.

### Services and sizing at launch

| Component | Prod | Staging |
| --- | --- | --- |
| Cloud Run `web` | 1 vCPU, 1 GB, min 1, max 10, concurrency 80 | 1 vCPU, 512 MB, min 0, max 2 |
| Cloud Run `jobs` | 2 vCPU, 4 GB, min 0, max 5, concurrency 4, timeout 3600 s | 1 vCPU, 2 GB, min 0, max 2 |
| Cloud SQL | `db-custom-2-8192`, 50 GB SSD, PostGIS enabled, private IP | `db-f1-micro` or `db-custom-1-3840`, 10 GB |
| Memorystore Redis | Basic, 1 GB | Basic, 1 GB (or Redis in the staging `web` container to save cost) |
| Typesense Cloud | 0.5 GB RAM node, Mumbai | shared collection with `staging_` prefix |
| Inngest Cloud | Free tier, then Team | separate environment |

### Security and access

- No service-account keys anywhere. GitHub Actions uses Workload Identity Federation; humans use `gcloud auth login` with IAM roles per group (owners, engineers, ops).
- Cloud SQL and Redis on private IP only. Cloud Run reaches them through Direct VPC egress.
- Cloud Run ingress stays public (needed for Cloudflare and Inngest Cloud), but the Next.js middleware rejects any request that lacks the `X-Origin-Secret` header Cloudflare injects, and Inngest requests are verified by signing key. A global load balancer with Cloud Armor is a later upgrade, not needed at launch.
- Secrets live in Secret Manager and are referenced from Cloud Run, never written in Terraform state or CI logs.
- Budgets and alerts at 50%, 90% and 100% of a monthly cap on each project from day one.

### Why these choices on Cloud Run

- **ISR needs a shared cache.** Next.js stores ISR output on local disk by default, which breaks with several instances. We use a Redis cache handler (`@neshca/cache-handler` or the Next.js 15 `cacheHandler` API) so every instance serves the same page.
- **Cold starts.** Prod keeps one warm `web` instance. Staging may scale to zero.
- **Heavy jobs apart from web.** `sharp` image processing, PDF extraction and sitemap rebuilds run in the `jobs` service, so a burst of imports never slows page serving.
- **Previews.** Each PR deploys a tagged revision on the staging `web` service (`pr-123---web-xxxx.a.run.app`), sharing the staging database. Migrations are therefore expand-then-contract only: never drop or rename a column in the same release that stops using it.

## 2. Environments and release flow

| Env | Branch | Deploy | Data |
| --- | --- | --- | --- |
| Local | any | `pnpm dev` with Docker Compose | seed data |
| Preview | PR | tagged revision on staging, URL posted on the PR | staging DB |
| Staging | `main` | automatic on merge | staging DB, anonymised copy of prod monthly |
| Production | `main` tagged `v*` | GitHub release triggers deploy, migration job runs first, traffic shifts 10% then 100% | prod DB |

Release rules: every PR runs lint, typecheck, Vitest, Playwright smoke and Lighthouse CI; migrations are reviewed as SQL; a rollback is `gcloud run services update-traffic` to the previous revision, with the expand-then-contract rule making it safe.

## 3. Repository, tooling and conventions

- Turborepo + pnpm workspaces, Node 22, TypeScript strict. Layout as in the architecture doc (`apps/web`, `packages/core|db|payload|jobs|integrations|ui|config`, `infra/`, `docs/`).
- ESLint + Prettier (Payload and Next.js presets), Husky + lint-staged, Conventional Commits.
- Vitest for domain rules (content bar, hub thresholds, quality score, enquiry splitting). Playwright for status codes, JSON-LD and the enquiry flow. Lighthouse CI budgets on the unit page.
- One Dockerfile, multi-stage, Next.js `output: "standalone"`, `sharp` installed in the runtime stage; the `jobs` service uses the same image with `SERVICE_ROLE=jobs`.
- `docs/adr/` with one Architecture Decision Record per stack row, written as each piece lands.
- The design system doc (`ohworks-design-system.md`) drives `packages/ui`: tokens first, then the listing card, badges, site sheet, map and enquiry form.

## 4. Milestones (26 weeks)

Each milestone has an exit check. Nothing moves to the next until the exit check passes on staging.

### M0, Foundations (weeks 1 to 2)

- Accounts: Google Cloud organisation and billing, three projects, Cloudflare zone for ohworks.com, GitHub organisation and repo, Typesense Cloud, Inngest Cloud, Clerk, Resend, Google Maps Platform (Geocoding, Places, Street View Static), MapTiler, Sentry, PostHog, Anthropic API, Meta Business account (WhatsApp verification takes weeks, so it starts here).
- Terraform bootstrap: state bucket, projects, enabled APIs, VPC and subnet, Cloud SQL, Memorystore, Artifact Registry, Secret Manager, Cloud Run `web`, `jobs` and `migrate`, WIF pool and provider, budgets, Cloudflare DNS and Transform Rule.
- Monorepo scaffold, Docker Compose, Dockerfile, GitHub Actions build and deploy.
- Exit: `https://staging.ohworks.com` serves a hello page from Cloud Run through Cloudflare; a PR gets a preview URL; `main` auto-deploys to staging; a direct hit on the `run.app` URL without the origin header returns 403.

### M1, Data foundation (weeks 3 to 4)

- Drizzle schema and migrations for geography, identity, inventory, offers, photos, audience claims, page status, redirects. PostGIS geometry with GiST indexes.
- Seed data: countries, the six launch cities, their localities (curated from OSM boundaries), OpenOOH venue taxonomy v1.2, local format names, size presets.
- Payload installed in the app with editorial collections (Article, Guide, Person, Company, Tag) and editor auth; ops collections for verification and reports.
- Clerk wired with organisations and a webhook that mirrors users and orgs into Postgres.
- Spikes: PostGIS duplicate and nearby queries at 1M synthetic points; Payload point field stores PostGIS geometry; `afterChange` enqueues to Inngest.
- Exit: `pnpm db:migrate && pnpm db:seed` on a fresh database; Payload admin works on staging; a Clerk sign-up appears in Postgres.

### M2, Public pages and indexing (weeks 5 to 7)

- Unit page, locality, city and format hubs, owner storefront, all server-rendered with ISR on the Redis cache handler and tagged for revalidation.
- `page_status` service: content bar, hub thresholds (10 and 25), noindex toggling, 404 for hubs under threshold, 301 on slug change, 410 for dismantled faces via middleware backed by Redis.
- JSON-LD (`Product` + `Offer` lease, `GeoCoordinates`, `additionalProperty`), breadcrumbs, `robots.txt`, hreflang scaffolding for `/in/`.
- Sitemap shards to R2 (under 50,000 URLs, by country, city and type), sitemap index, IndexNow client, `lastmod` only on real changes.
- Inngest `listing.changed` chain: score, page status, revalidate, sitemap dirty flag, Typesense upsert, IndexNow.
- Static map image first (MapTiler), MapLibre on click; Cloudflare Images with fixed dimensions.
- Spikes: 100k synthetic faces, revalidation across two instances, real status codes; Lighthouse LCP under 2.5 s on throttled mobile.
- Exit: synthetic Bengaluru data browsable on staging with correct status codes, JSON-LD validated, sitemaps served from R2, Lighthouse budgets green in CI.

### M3, Owner onboarding (weeks 8 to 10)

- Owner sign-up and company verification (GSTIN, documents, phone or WhatsApp OTP), verification queue in the Payload ops console.
- Excel import template and parser, bulk photo upload to R2 via signed URLs, EXIF GPS and time extraction, pHash reuse check.
- Map pinning with Street View side panel, duplicate flagging (25 m radius, facing ±30°), locality auto-assignment.
- Commercial terms (price display mode, minimum period, production costs, categories), availability calendar, quality score and go-live.
- Owner storefront at `/owners/{name}` live from real data.
- Exit: an internal tester lists 20 faces from an Excel file in under an hour and sees them indexable or correctly held back.

### M4, Search, buyers and enquiries (weeks 11 to 13)

- Typesense schema, full and incremental indexers, map and list search with facets, "near landmark" via Places.
- Natural-language search box: Claude Haiku parses to the filter object, shown as editable chips before running.
- Buyer verification (work email or phone OTP), plans, share by link, one enquiry per plan split into one request per owner.
- Fan-out: Resend email and WhatsApp template per owner; inbound email parse and WhatsApp webhook stitch replies into threads.
- Owner leads inbox with templates and quotes; nightly reply-time stats; Responsive and Fresh badges.
- Spike: WhatsApp sandbox end to end.
- Exit: a buyer finds sites on a map, sends one enquiry to three owners, and each owner replies from email, web and WhatsApp into the same thread.

### M5, Editorial (weeks 14 to 16)

- Articles and guides with author pages, shared tags, country edition routing, structured data for `Article`.
- Guides embed live listings with "from" prices and an enquiry button; case studies link to faces.
- Hub opening facts computed nightly; price-index snapshot table ready for Phase 3.
- Newsletter sign-up, daily briefing and weekly buyer digest sends through Resend, with labelled sponsorship slots.
- Exit: the first Bengaluru cost guide publishes with live listings; a newsletter goes to a test list.

### M6, Trust, ops and analytics (weeks 17 to 19)

- Assisted onboarding: PDF media kit to draft faces through Claude Sonnet with a strict schema, into a review queue. Spike: accuracy on three real media kits.
- Report-a-listing with SLA tracking; staleness cron with one-tap WhatsApp availability confirm; stock-photo check.
- Per-site analytics (views, search appearances, shortlists, enquiries) from PostHog events plus own tables; Search Console API pull per URL.
- Rate limits and abuse controls on enquiries and sign-ups.
- Exit: ops processes a real media kit to live listings; the Gate 1 dashboard shows all KPIs from live data.

### M7, Hardening (weeks 20 to 22)

- Load test the unit page and search at 10x expected launch traffic; tune Cloud Run concurrency and Cloud SQL.
- Security review: Clerk and Inngest webhook signatures, R2 signed uploads, authorisation per organisation, OWASP checks, dependency audit.
- Backup restore drill on staging; runbooks for deploy, rollback, incident, key rotation; alerting on error rate, latency, job failures, Cloud SQL storage.
- Accessibility pass on public pages and forms; legal pages; the charter page.
- Exit: restore drill under one hour; all alerts tested; no high or critical findings open.

### M8, Pilot launch (weeks 23 to 26)

- Onboard 20 to 30 founding owners in Bengaluru with assisted onboarding; release sitemaps for Bengaluru only.
- Publish cost guides for the launch city and formats; start the newsletter; run search ads on "hoarding advertising cost Bengaluru".
- Watch Search Console coverage and impressions, enquiry volume, reply times; fix what owners and buyers hit.
- Exit: Gate 1 tracking live, owners replying, first organic enquiries.

## 5. Team split for 4 to 8 engineers

| Role | Owns | Milestones |
| --- | --- | --- |
| Tech lead / platform | Terraform, CI/CD, Cloud Run, observability, security, data model review | M0, M1, M7 throughout |
| Full-stack A (public and indexing) | Public pages, ISR, page status, sitemaps, IndexNow, SEO rules, Lighthouse | M2, M5, M8 |
| Full-stack B (owner side) | Onboarding, imports, photos, maps, verification console, leads inbox | M3, M4, M6 |
| Full-stack C (buyer side) | Search, Typesense, plans, enquiries, notifications | M4, M6 |
| Frontend / design system | `packages/ui` from the design-system doc, forms, accessibility, dashboards | M2 onward |
| Data and integrations | Seeds, taxonomies, Claude pipelines, WhatsApp, Search Console, analytics | M1, M4, M6 |

With four engineers, the lead doubles as full-stack A and the data role folds into B and C; add one week to M3, M4 and M6.

## 6. Monthly run cost estimate (USD, Phase 1)

| Item | Prod | Staging |
| --- | --- | --- |
| Cloud Run `web` (1 warm instance) and `jobs` | 60 to 120 | 10 |
| Cloud SQL (2 vCPU, 8 GB, 50 GB) | 110 to 140 | 10 to 40 |
| Memorystore Redis 1 GB | 35 | 0 to 35 |
| Typesense Cloud | 30 to 60 | shared |
| Cloudflare Pro, R2, Images | 40 to 80 | shared |
| Inngest, Clerk, Resend, Sentry, PostHog (starter tiers) | 100 to 250 | shared |
| Google Maps Platform, MapTiler (after free tiers) | 50 to 200 | shared |
| WhatsApp conversations, Anthropic API | usage, 50 to 150 | |
| **Total** | **about 500 to 1,000** | **about 50 to 100** |

Set budget alerts at 800 and 1,500 for prod. Re-estimate at M8 with real traffic.

## 7. What only you can do, and when

| When | Action | Why |
| --- | --- | --- |
| Week 1 | Create the Google Cloud organisation and billing account (card required), then grant the engineering account Billing Account User and Organization Admin | Terraform creates everything else |
| Week 1 | Add ohworks.com to Cloudflare and point the registrar's nameservers at it | All traffic flows through Cloudflare |
| Week 1 | Create the GitHub organisation; invite the team | CI/CD identity |
| Week 1 | Start Meta Business verification and WhatsApp Business API access | Takes two to six weeks |
| Week 1 to 2 | Create accounts for Typesense, Inngest, Clerk, Resend, Sentry, PostHog, MapTiler, Google Maps Platform, Anthropic; put keys in Secret Manager (I will give exact names) | Hosted services |
| Week 2 | Company documents for the legal pages and the charter copy | Public from launch |
| Week 8 | Three real owner media kits (PDF or Excel) | Spike and import tests |
| Week 20 | The first 20 to 30 founding owners' details | Pilot |

## 8. Day-one checklist (what we run first)

1. Verify local tools: Node 22, pnpm, Docker, `gcloud`, Terraform. Install what is missing.
2. Scaffold the monorepo in this folder: Turborepo, `apps/web` (Next.js 15, App Router, TypeScript strict), `packages/*`, ESLint, Prettier, Vitest, Playwright, Husky.
3. Docker Compose for Postgres+PostGIS, Redis, Typesense, Inngest dev server, Mailpit; `.env.example` with every variable named.
4. Dockerfile (standalone output, `sharp`), `SERVICE_ROLE` switch for `web` and `jobs`.
5. `infra/` Terraform: bootstrap module (state bucket), then `shared`, `staging`, `prod` stacks. Applied once the billing account exists.
6. GitHub Actions: `ci.yml` (lint, typecheck, test, build) and `deploy.yml` (WIF auth, build, push, migrate, deploy, preview URL comment).
7. Hello unit page at `/in/bengaluru/koramangala/test-ow000001/` returning 200 with JSON-LD, and `/in/nowhere/` returning 404, to prove routing and status codes before any real feature.
8. `docs/adr/0001-cloud-run.md` and `0002-typescript-monorepo.md`.

Steps 1 to 4, 6 and 7 need no cloud account and start immediately. Step 5 applies as soon as billing exists.
