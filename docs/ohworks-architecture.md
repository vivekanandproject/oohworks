# ohworks.com: app architecture and tech stack

## Context

The strategy report (9 Oct 2026) defines ohworks.com as two products on one platform: a listings marketplace with one Google-indexed page per physical advertising face, where the media owner is always the seller, and an editorial platform (trade newsroom plus buyer guides) wired into live listings. ohworks never touches the money flow. It verifies owners and buyers, routes enquiries, and earns from owner tools, visibility, sponsorship and data.

This plan turns that report into a buildable architecture and a concrete tech stack for a team of 4 to 8 engineers, with the India launch (Phase 1, months 0 to 6) as the first deliverable and a path to the Gulf, US and UK.

Technical requirements pulled from the report that drive every decision below:

- Hundreds of thousands of server-rendered pages with real HTTP status codes (200, 404, 410), `noindex` below a content bar, hub pages published only above inventory thresholds.
- One background job per listing change: recompute quality score, regenerate page, update sitemap `lastmod`, ping IndexNow, reindex search.
- Geo-first data: coordinates to 5+ decimals, facing, "near Silk Board junction" search, duplicate-face detection, Street View checks, static map first and interactive map on click.
- Industry-standard data model: structure > face > slot, OpenOOH venue taxonomy, Geopath fields, OpenRTB screen IDs, sizes in millimetres.
- Enquiry routing to owners over web, email and WhatsApp, with reply-time tracking for the Responsive badge. No payments between parties.
- Headless CMS with Article, Guide, Market report, Case study, Event, Job, Person, Company; one tag system shared with listings; country editions in subfolders; structured data and sitemaps generated from the model.
- Trust and safety: company document verification, GPS-stamped photos, image reuse checks, buyer verification, report-a-listing, 30-day staleness.
- Later: public listings API, MCP server for AI assistants, owner-system sync, programmatic flags, price index.

## Recommendation in one paragraph

Build a TypeScript modular monolith: one Next.js application running in containers on Google Cloud Run that serves the public site, owner and buyer dashboards, and the Payload CMS admin, backed by one Postgres database with PostGIS as the system of record, Typesense for geo and faceted search, Inngest for durable background jobs, Cloudflare in front for DNS, bot rules, caching and image delivery (R2 and Images), Clerk for owner and buyer auth, Resend for email, Meta's WhatsApp Cloud API for owner messaging, MapTiler plus Google Street View for maps, and the Claude API for natural-language search, media-kit extraction and photo checks. Everything stateful lives in Google Cloud's Mumbai region (asia-south1) for India latency and residency. The monolith is split along module boundaries (listings, verification, enquiries, editorial, indexing, data) so the public API, MCP server or import workers can be peeled into separate deployables in Phase 3 without a rewrite.

## System architecture

### Layers

```
                 ┌──────────────────────────────────────────────────────┐
  Crawlers,      │ Cloudflare: DNS, WAF, bot rules, cache, R2 + Images, │
  buyers,        │ sitemap files, robots.txt, redirects (301/410 map)   │
  owners,        └───────────────────────┬──────────────────────────────┘
  AI assistants                          │
                 ┌───────────────────────▼──────────────────────────────┐
                 │ Next.js 15 app on Cloud Run (asia-south1 Mumbai)      │
                 │  (public)  /in/… hubs, unit pages, guides, owners     │  ISR + on-demand revalidation
                 │  (buyer)   search, plans, enquiries, agency workspace │  SSR, authenticated
                 │  (owner)   inventory, leads inbox, calendar, analytics│  SSR, authenticated
                 │  (admin)   Payload admin: editorial + ops console     │
                 │  /api/v1   public listings API (Phase 3)              │
                 └──────┬─────────────────┬──────────────────┬──────────┘
                        │                 │                  │
        ┌───────────────▼───┐   ┌─────────▼────────┐   ┌─────▼───────────────┐
        │ packages/core     │   │ Inngest functions │   │ Integrations         │
        │ domain services   │◄──┤ (durable jobs,    │   │ Clerk, Resend,       │
        │ listings, verify, │   │ crons, fan-out)   │   │ WhatsApp Cloud API,  │
        │ enquiry, plans,   │   └─────────┬────────┘   │ MapTiler, Google     │
        │ indexing policy,  │             │            │ Street View/Geocode, │
        │ price index       │             │            │ Razorpay, Claude API,│
        └───────┬───────────┘             │            │ IndexNow, Search     │
                │                         │            │ Console API, PostHog │
   ┌────────────▼─────────────────────────▼───────┐   └──────────────────────┘
   │ Data (GCP asia-south1, Mumbai)                │
   │  Cloud SQL Postgres 16 + PostGIS   system of record
   │  Typesense Cloud (Mumbai)          search index
   │  Memorystore Redis                 ISR cache, OTP, rate limits
   │  Cloudflare R2                     originals, AVIF/WebP variants, sitemaps, exports
   └───────────────────────────────────────────────┘
```

### Modules inside the monolith

Each module owns its tables, its Payload collections, its Inngest functions and its service API. Modules call each other only through the service layer, never through each other's tables.

| Module | Owns | Key responsibilities |
| --- | --- | --- |
| `identity` | Organization, Member, BuyerProfile, OwnerProfile | Mirrors Clerk users and orgs; roles (owner admin, owner sales, agency admin, agency planner, editor, ops) |
| `inventory` | Structure, Face, Slot, Photo, AudienceClaim, ExternalId | The listing data model; sizes in mm; PostGIS point and facing; OpenOOH, Geopath, OpenRTB fields; duplicate detection |
| `offers` | Offer, RateCard, AvailabilityBlock | Several sellers per face; price display mode; min period; production costs; calendar |
| `verification` | VerificationCase, Permit, Document, Badge | Company docs, Street View or GPS photo match, permit record, Fresh and Responsive badge computation |
| `enquiries` | Plan, PlanItem, Enquiry, EnquiryRequest, Message | Plans, split one enquiry into one request per owner, threaded replies over web, email, WhatsApp; reply-time stats |
| `editorial` | Article, Guide, MarketReport, CaseStudy, Event, Job, Person, Company, Tag | Payload content types; shared tag taxonomy that also tags Faces and Organizations |
| `indexing` | PageStatus, SitemapShard, RedirectRule | Content bar evaluation, hub thresholds, index/noindex decisions, 301/410 rules, sitemap shards, IndexNow |
| `search` | Typesense schema and indexer | Face documents with geo, facets, "from" price, badges; NL query parser |
| `data` | PriceIndexSnapshot, HubFact | Quarterly price index, hub opening facts ("Bengaluru has N listed hoardings…"), Search Console pulls |
| `trust` | Report, ImageFingerprint, BuyerCheck | Report-a-listing queue, pHash reuse detection, stock-photo check, staleness flags |
| `billing` | Subscription, FeaturedSlot, ClassifiedListing | Phase 2: Pro and Network tiers, labelled featured slots, classifieds; Razorpay first |
| `notifications` | Template, Delivery | Email, WhatsApp, in-app; newsletter sends |

### Core data model

Postgres is the one system of record. Typesense is rebuildable from it. Key tables:

- **organization** (type: owner | agency | brand | publisher, country, verification_status, slug, storefront settings)
- **structure** → **face** → **slot** (Geopath hierarchy). `face` carries `geom geometry(Point, 4326)` with a GiST index, `facing_deg`, `width_mm`, `height_mm`, `illumination`, `is_digital`, `venue_type_id`, `taxonomy_version`, `local_format`, `environment`, `road`, `landmark`, `locality_id`, `city_id`, `permanent_id` (the `ow8k3x2` URL suffix, immutable), `slug`, `quality_score`, `index_status`, `last_verified_at`, `last_updated_at`
- **face_external_id** (system: geopath | route | roadstar | openrtb, value)
- **digital_spec** (resolution, spot_length, loop_length, slots, motion, audio, hours, exchanges[])
- **audience_claim** (metric, period, demo_base, source, method, measured_at). A face never shows audience without a row here.
- **offer** (face_id, organization_id, role: owner | reseller, price_display: exact | from | on_request, rate, currency, period, min_period, production_costs, status). The verified owner's offer sorts first.
- **availability_block** (offer_id, from, to, status: booked | held | blocked)
- **photo** (face_id, kind: day | night | approach | proof, r2_key, exif_gps, taken_at, phash, verified: bool)
- **permit** (face_id, number, authority, expires_at, document_id)
- **verification_case**, **document** (org-level KYC: GSTIN, trade licence)
- **plan**, **plan_item**, **enquiry**, **enquiry_request** (one per owner per enquiry), **message** (channel: web | email | whatsapp, direction, external_id)
- **page_status** (path, index: true | false, reason, lastmod, sitemap_shard)
- **redirect_rule** (from_path, to_path, code: 301 | 410)
- **tag** and polymorphic **taggable** join (face, organization, article, guide, case_study)
- **price_index_snapshot** (city, format, quarter, median, p25, p75, n, published_at)
- Editorial tables are Payload-managed: article, guide, market_report, case_study, event, job, person, company, plus versions and drafts.

Geography reference tables **country**, **city**, **locality** hold slugs, names in each language, centroid and polygon, and hub thresholds. Localities for India come from a curated seed (OSM admin boundaries plus manual cleanup for metros), not free-text.

### Request flows

**Unit page request** `/in/bengaluru/koramangala/hoarding-80-feet-road-ow8k3x2/`

1. Cloudflare serves from cache if fresh; otherwise forwards to Cloud Run.
2. Next.js resolves by `permanent_id` (the trailing suffix). Slug mismatch returns a 301 to the canonical path. Missing or dismantled returns 404 or 410 from `redirect_rule`.
3. Page renders from Postgres with ISR, tagged `face:{id}`, `locality:{id}`, `city:{id}`.
4. `robots` metadata is `noindex` unless `page_status.index` is true. JSON-LD (`Product` plus `Offer` as lease, `GeoCoordinates`, `additionalProperty`) is emitted only with fields the page shows. Price is marked up only in `exact` or `from` mode.
5. Static map image from MapTiler Static API; interactive MapLibre map loads on click.

**Listing change** (owner edits price, uploads photo, ops verifies, calendar updated)

1. Payload `afterChange` hook or service call emits `listing.changed {face_id}` to Inngest.
2. Inngest function, idempotent per face and debounced 30 s:
   recompute `quality_score` and content bar → update `page_status` for the face and its locality, city and format hubs (thresholds 10 and 25) → `revalidateTag` for the affected pages → update `lastmod` only if an indexable field changed → mark sitemap shard dirty → upsert Typesense document → ping IndexNow with the changed URLs.
3. Hourly cron rewrites dirty sitemap shards to R2 (under 50,000 URLs each, grouped by country, city and type) and regenerates the sitemap index.

**Enquiry**

1. Buyer verified by Clerk (work email or phone OTP). Buyer builds a plan or picks one face.
2. `enquiries.submit` creates one `enquiry` and one `enquiry_request` per owner organization with dates, budget, brand category and creative status.
3. Inngest fan-out sends each owner an email (Resend) and a WhatsApp template message (Cloud API) with a deep link to the leads inbox.
4. Owner replies in the inbox, by email reply (inbound parse), or by WhatsApp (webhook). All land in `message` on the same thread. ohworks never sees contract or payment.
5. Reply-time stats recomputed nightly feed the Responsive badge. The buyer sees owner replies side by side in the workspace.

**Assisted onboarding (media kit to listings)**

1. Ops uploads an owner's PDF or spreadsheet in the Payload admin.
2. Inngest job sends it to the Claude API with a strict JSON schema (structure, face, size, lighting, location text, rate). Output goes to a review queue as draft faces, never straight to live.
3. Ops geocodes and pins each face (Google Geocoding for India coverage), checks Street View, flags duplicates (PostGIS within 25 m and same facing ±30°), and publishes.

**Search**

1. Buyer query hits Typesense directly from the server: geo radius or bounding box, facets on format, size band, lighting, price band, digital, badges, programmatic exchange, availability window.
2. Natural-language box: Claude (`claude-haiku-5-5`) parses "20×10 hoardings on Outer Ring Road under ₹1 lakh a month in November" into the same filter object, which is then shown to the user as chips before running. No free-text generation reaches the page.

### Rendering and SEO rules encoded in code

- All public routes under `app/(public)/[country]/…` with `generateMetadata` reading `page_status`. Filtered views (`?size=…`) are blocked in `robots.txt` and empty filter combinations return 404.
- Hubs render only when above threshold; below it they return 404 and are absent from sitemaps.
- Hub pages open with a dated fact from `hub_fact` computed nightly.
- `redirect_rule` is loaded into Next.js middleware (cached in Redis) for 301 and 410 responses with real status codes.
- Locale paths (`/ae/ar/`) via `next-intl`; `hreflang` generated from the editions a page actually exists in. No IP redirects, a country banner instead.
- Images served through Cloudflare Images (AVIF/WebP, fixed dimensions) with `width` and `height` set to avoid layout shift. Core Web Vitals budgets enforced in CI with Lighthouse CI.
- `robots.txt` allows Googlebot, Bingbot, OAI-SearchBot and PerplexityBot. AI training crawlers (GPTBot, ClaudeBot, CCBot) are a separate decision, configured in one place.

## Tech stack

| Concern | Choice | Why this, and not the alternative |
| --- | --- | --- |
| Language | TypeScript everywhere, Node 22 | One language for 4 to 8 engineers; Payload, Next.js and Inngest are all TS-native. Python would split the team for no feature need. Data science on the price index can be SQL plus notebooks over Postgres. |
| Monorepo | Turborepo, pnpm | Shared `core`, `db`, `ui` packages; separate deployables later without moving code |
| Web framework | Next.js 15 App Router | ISR with on-demand `revalidateTag` is exactly the "one job per listing change" model; real status codes; route groups for public, owner, buyer and admin surfaces. Astro was considered for the public site but would mean two frameworks once dashboards exist. |
| CMS and ops console | Payload 3 (self-hosted inside the Next.js app, Postgres adapter) | Report names Payload, Sanity or Strapi. Payload is Postgres-native, TS, embeds in Next.js, and its admin doubles as the internal ops console for verification queues, report review and assisted onboarding. Sanity is hosted with per-seat pricing and no Postgres; Strapi is a second server. |
| ORM | Drizzle (Payload's own adapter plus direct Drizzle for hot paths) | Geo queries, hub counts and indexers need raw SQL and PostGIS; Payload's local API handles admin CRUD and hooks |
| Database | PostgreSQL 16 + PostGIS on Cloud SQL, asia-south1 (Mumbai), private IP only | India latency and residency; PostGIS for radius, duplicate and nearby-sites queries; managed backups and point-in-time recovery. |
| Search | Typesense Cloud (Mumbai) | Geo search, facets, typo tolerance, synonyms (hoarding = billboard), simple ops, cheap at 1M documents. Vertex AI Search or OpenSearch only if the team wants everything inside one cloud. |
| Background jobs | Inngest Cloud | Durable, idempotent, debounced, scheduled functions served from the app's own containers on Cloud Run (a separate `jobs` service with more CPU and memory); replay and observability built in. BullMQ would need a hand-rolled worker fleet; Trigger.dev is the close second. |
| ISR cache, OTP, rate limits | Memorystore for Redis (asia-south1) | Shared Next.js ISR cache handler so every Cloud Run instance serves the same regenerated pages; also OTP, rate limits and the redirect map |
| Object storage and images | Cloudflare R2 + Cloudflare Images | No egress fees for a photo-heavy site; on-the-fly AVIF/WebP variants; R2 also hosts sitemap shards and plan exports |
| Edge, DNS, WAF | Cloudflare | Bot rules for AI crawlers, cache rules for hubs and units, redirect lists, DDoS |
| App hosting | Google Cloud Run, asia-south1: `web` service (Next.js standalone, min 1 instance in prod) and `jobs` service (same image, Inngest handler only, higher CPU and memory, long timeout) | Containers with no cluster, VPC load balancer or NAT to run; scale to zero in staging; revision tags give per-PR previews. Chosen over Vercel (ruled out) and AWS ECS Fargate (more moving parts). |
| Auth | Clerk (owners, agencies, buyers; organizations and roles; phone and WhatsApp OTP) and Payload auth for editors and ops staff | Clerk gives orgs, team seats and phone OTP without building them. Better Auth is the self-hosted alternative if Clerk pricing bites at scale. |
| Email | Resend (transactional and newsletter broadcasts, inbound parse for replies) | One vendor at launch; move newsletters to Beehiiv or Customer.io if cohort analytics are needed |
| WhatsApp | Meta WhatsApp Cloud API, via a BSP such as Gupshup or Twilio for India numbers | Owners already sell on WhatsApp; templates for lead alerts and one-tap availability checks; webhooks for replies |
| Maps | MapLibre GL + MapTiler (tiles, static images, geocoding fallback); Google Maps Platform for Geocoding, Places and Street View Static API | MapTiler is far cheaper than Mapbox for static images at page-view volume; Google has the best India geocoding and the only Street View |
| AI | Claude API: `claude-haiku-5-5` for NL query parsing and image checks, `claude-sonnet-5-5` for media-kit extraction | Structured outputs with JSON schemas; vision for stock-photo and mismatch detection. Later the MCP server exposes the same listings service. |
| Image forensics | `sharp` for variants and EXIF, `sharp-phash` for reuse detection | Catches reused and stock photos cheaply before an LLM check |
| Payments (Phase 2) | Razorpay (India subscriptions, UPI) then Stripe (Gulf, US, UK) | Only owner subscriptions and classifieds; never media payments |
| Analytics | PostHog (product analytics, feature flags, session replay) plus Google Search Console API pulls into Postgres | KPI "40% of indexable pages earning impressions" needs Search Console data per URL |
| Observability | Sentry (errors, traces), Cloud Logging and Cloud Monitoring (logs, metrics, uptime checks, alerts), Inngest dashboard | |
| Testing | Vitest (unit, domain rules such as the content bar), Playwright (public page status codes, JSON-LD, enquiry flow), Lighthouse CI (CWV budgets) | |
| CI/CD | GitHub Actions authenticating with Workload Identity Federation (no service-account keys): build image to Artifact Registry, run Drizzle migrations as a Cloud Run job, deploy a new revision; per-PR preview revisions on the staging service | |
| Infra as code | Terraform for Google Cloud (projects, APIs, VPC, Cloud SQL, Memorystore, Cloud Run, Artifact Registry, Secret Manager, WIF, budgets) and Cloudflare; Typesense and Inngest configured by dashboard plus checked-in config | |

Estimated Phase 1 monthly run cost at 50k faces: roughly $1,500 to $3,000 across Cloud Run, Cloud SQL, Memorystore, Typesense, Cloudflare, Clerk, Inngest and messaging. Re-estimate at Gate 1 with real traffic.

## Repository layout

```
ohworks/
  apps/
    web/                    Next.js app: public site, owner and buyer dashboards, Payload admin, API routes, Inngest handler
  packages/
    core/                   domain services per module (inventory, offers, verification, enquiries, indexing, search, data, trust)
    db/                     Drizzle schema, migrations, PostGIS helpers, seed data (countries, cities, localities, taxonomies)
    payload/                Payload config: editorial collections, ops collections, hooks
    jobs/                   Inngest functions (listing.changed, enquiry.submitted, sitemaps.rebuild, staleness.nightly, import.mediakit, index.price)
    integrations/           Clerk, Resend, WhatsApp, MapTiler, Google Maps, Claude, IndexNow, Search Console, Razorpay clients
    ui/                     shared components: listing card, map, badges, site sheet, enquiry form
    config/                 eslint, tsconfig, tailwind presets
  infra/                    Terraform for Google Cloud and Cloudflare
  docs/                     ADRs (one per decision in the table above), data model, SEO rules
```

## Phase mapping

**Phase 1, India launch (months 0 to 6)**
Identity, inventory, offers, verification, enquiries (web, email, WhatsApp), indexing with content bar and hub thresholds, search, editorial (Article, Guide, Person, Company, Tag), owner storefront, newsletter sends, PostHog, assisted-onboarding pipeline, image checks, report-a-listing, staleness cron.

**Phase 2, monetise (months 6 to 12)**
Billing (Razorpay), Pro and Network entitlements, labelled featured slots capped per page, classifieds, agency workspace with team seats and private folders, plan exports (PDF via Playwright render, Excel via `exceljs`, slides via `pptxgenjs`), availability sync connectors (CSV, iCal, Broadsign API), Hindi edition under `/in/hi/`, Tier-2 city seeds.

**Phase 3, expand (months 12 to 24)**
`/ae/` and `/sa/` editions with Arabic, quarterly price index pipeline, programmatic exchange flags, public read-only listings API with API keys (extract to `apps/api` on Hono if load warrants), MCP server over the same core services, data API, Stripe.

## Key design decisions and trade-offs

1. **Marketplace entities as Payload collections, with Drizzle for hot paths.** Gives the ops team an admin UI on day one for verification and assisted onboarding. Cost: Payload's schema conventions on core tables. Exit: tables are plain Postgres, so marketplace modules can drop Payload later.
2. **Cloud Run containers from day one.** Vercel was ruled out. Next.js runs in standalone mode with a Redis-backed ISR cache handler so every instance shares one page cache; previews use Cloud Run revision tags. Cost is per instance-hour, predictable at hundreds of thousands of pages.
3. **Typesense over Postgres-only search.** PostGIS alone handles radius queries, but faceting, typo tolerance and synonyms across formats and languages are what Typesense does well. The index is disposable and rebuilt from Postgres.
4. **Inngest over a queue plus workers.** Debounce, idempotency and retries are the hard parts of "one job per listing change". Inngest gives them without an always-on worker fleet.
5. **No LLM-written page copy.** Unit summaries are deterministic templates from structured fields, which keeps the site clear of Google's scaled-content rule. Claude is used only for parsing, extraction and checks whose outputs humans review or that never reach a public page.
6. **Charter enforced in code.** No payment tables between buyer and owner, no ohworks-owned offers, enquiry requests always addressed to the owner organization, every audience figure requires a source row, featured slots carry a `sponsored` flag the UI must render.

## Verification

Spikes to run before committing, each one to two days:

1. **ISR at scale:** generate 100k fake faces, confirm on-demand revalidation per tag, 404 and 410 status codes, and `noindex` toggling. Confirm the Redis cache handler shares ISR output across two Cloud Run instances.
2. **PostGIS duplicate and nearby queries:** 1M points, radius 25 m with facing filter under 20 ms; nearby similar sites under 50 ms.
3. **Payload point field and hooks:** confirm Payload 3's Postgres adapter stores `point` as PostGIS geometry and that `afterChange` can enqueue to Inngest reliably.
4. **Job chain:** listing change → page_status → revalidate → sitemap shard → IndexNow, end to end, with a replay of a failed step.
5. **WhatsApp sandbox:** template send, webhook reply, thread stitching into `message`.
6. **Media-kit extraction:** three real PDF media kits through Claude with the JSON schema; measure field accuracy against manual entry.
7. **Lighthouse CI:** a unit page hits LCP under 2.5 s on a throttled mobile profile with the static map and one AVIF photo.

Acceptance for Phase 1 architecture: all seven spikes pass, ADRs written for each row in the stack table, and the Terraform and Turborepo skeleton deploys a hello-world unit page with correct JSON-LD to a preview URL.
