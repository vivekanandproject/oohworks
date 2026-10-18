# ohworks previews, services and API docs: plan

Date: 18 Oct 2026. Status: plan, awaiting go. Builds on `ohworks-build-plan.md` (Google Cloud, `asia-south1`, three projects), ADR 0001 (Cloud Run), and the clean-up of 18 Oct 2026, which left sample data only in the test database and removed Netlify. Staff accounts for these environments come from `ohworks-super-admin-plan.md`.

## 1. What this must achieve

Three things the founder asked for on 18 Oct 2026:

1. **Preview the site with its database and services**, not only its pages: every change can be opened at its own address, running against a real Postgres and the real services, before it reaches anyone else.
2. **See inside the database and each service** in every environment, without exposing any of them to the public.
3. **Host the API documentation as Swagger**, so the API can be read and tried in the browser.

**The test this must pass:** a pull request is opened. Within fifteen minutes a link appears on it. Signing in with a staff Google account opens that preview, with its own database holding the labelled sample sites and pieces. `/admin` works, `/api/docs` shows Swagger with every endpoint, "Try it out" on `GET /api/v1/sites` returns the sample sites, the database can be browsed in the Google Cloud console, and a Services page in the admin shows which services are connected. Closing the pull request removes the preview and its database. Merging deploys staging; a release tag deploys production.

## 2. Where today stands

| Part | Today |
| --- | --- |
| Hosting | None. Netlify removed. Vercel is still connected to the repository and deploys every push to oohworks.vercel.app, where pages that need a database fail |
| Database | Postgres on this Mac: `ohworks` (development, no samples) and `ohworks_test` (tests, with samples). Production tables come only from `apps/web/src/migrations`, run by `pnpm --filter @ohworks/web release` |
| Services the code uses | Postgres, through the CMS. Optional, each off without its key: Resend (email; without it, mail goes to the Outbox), Google Places (company search), MapTiler (map style), Anthropic (reading typed searches), Cloudflare R2 (photos) |
| Services planned but not wired | Redis, Typesense, Inngest, Clerk, Sentry, PostHog. Keys exist in `.env.example`; no code calls them. `packages/jobs` and `packages/integrations` are empty |
| Container | `Dockerfile` exists and has never been built in the cloud. `.dockerignore` added on 18 Oct 2026 |
| Blockers to running on Cloud Run | The home page reads the database while the site is built, so the build needs a database. The release step needs the CMS tools and `tsx`, which the slim runtime image leaves out. Owner documents and media kits are kept on local disk, which Cloud Run does not have |
| Infrastructure as code | `infra/` holds only a README and the parked CI workflow. No Terraform yet |
| API | 30 endpoints in `apps/web/src/app/api`, all for the site's own forms (posts that answer with a redirect and check the Origin header), plus the CMS's own REST and GraphQL API. No public API and no API documentation |

## 3. Decisions (recommended; each can be changed in section 11)

1. **Three environments on Google Cloud**, as the build plan says: preview (one per pull request), staging (`main`), production (release tags). Vercel is disconnected.
2. **Each preview gets its own database**, inside the staging Cloud SQL instance. This changes the build plan, which had previews share the staging database: a pull request that adds a migration would change staging for everyone, and reviewers need sample content to click through. Databases inside one instance cost nothing extra.
3. **Only services the code uses are hosted.** Each planned service is switched on in the same pull request that first calls it. This keeps staging near 40 to 60 USD a month instead of 50 to 100.
4. **No database or service console is ever a public web page.** Staff look at data through the CMS, the Google Cloud console and each service's own dashboard, all behind a sign-in.
5. **Preview and staging are for staff only.** They sit behind Google sign-in (Identity-Aware Proxy on the staging Cloud Run services; step 2 confirms it also covers each preview's tagged link, and if not, previews go through Cloudflare Access instead), are never indexed, and never send email to anyone outside an allowlist.
6. **Swagger documents two specifications**: a public API (new, read-only listings, version 1) that will also be public in production, and an internal reference (the site's own endpoints and the CMS API) shown only in preview and staging. Both are written as OpenAPI 3.1 files in the repository and served by the app at `/api/docs`.

## 4. The environments

| | Local | Preview | Staging | Production |
| --- | --- | --- | --- | --- |
| Made by | `pnpm dev` | Opening or updating a pull request | Merging to `main` | Pushing a tag `v*` |
| Address | `localhost:3000` | `pr-123---web-….a.run.app` (Cloud Run revision tag) | `staging.ohworks.com` | `ohworks.com` |
| Google Cloud project | none | `ohworks-staging` | `ohworks-staging` | `ohworks-prod` |
| Database | `ohworks` on the Mac | `pr_123_preview` in the staging instance, made fresh | `ohworks` in the staging instance | `ohworks` in the production instance, backups and 7-day point-in-time recovery |
| Data in it | Reference data and drafts | Reference data plus the labelled sample sites, owners and pieces | Reference data, staff, and pilot content entered by the team. No samples | Real only |
| Who can open it | You | Staff, after Google sign-in | Staff, after Google sign-in | Everyone |
| Search engines | n/a | `noindex` header and robots closed | `noindex` header and robots closed | Indexed by the page rules |
| Email | Outbox | Outbox | Sent only to allowlisted addresses; the rest to the Outbox | Sent |
| Swagger at `/api/docs` | Public API and internal reference | Public API and internal reference | Public API and internal reference | Public API only |
| Removed | n/a | When the pull request closes: tag and database dropped | Never | Never |

One new setting, `SITE_ENV` (`local`, `preview`, `staging`, `production`), drives the rows that differ: the noindex header, the email allowlist, the internal reference and the Services page.

## 5. Seeing the database

| Need | Local | Preview and staging | Production |
| --- | --- | --- | --- |
| Content: sites, owners, pieces, enquiries, emails | `/admin` | `/admin` | `/admin`, by role |
| Raw tables and SQL | Any Postgres client, or Drizzle Studio | Cloud SQL Studio in the Google Cloud console, signed in with a staff Google account (step 2 confirms it reaches a private-only instance; if not, the laptop route below) | Same, with a read-only database user; access recorded in Cloud Audit Logs |
| From a laptop | Direct | Cloud SQL Auth Proxy, then TablePlus or pgAdmin | Same, for engineers named in IAM only |
| A preview's own database | n/a | Same instance, database `pr_123_preview` | n/a |

**Optional:** if a database viewer at a web address is wanted for staging, `pgweb` can run as its own Cloud Run service behind the same Google sign-in, with a read-only user. It is never deployed to production.

**Data in previews.** A preview database is made with the release step (migrations, users, reference data), then the test fixtures. The fixtures' guard is widened from "name ends in `_test`" to "name ends in `_test` or `_preview`", so they still can never reach staging or production.

## 6. Seeing the services

| Service | Used by code today | Local | Preview and staging | Production | Where to look |
| --- | --- | --- | --- | --- | --- |
| Postgres | Yes | On the Mac | Cloud SQL, smallest tier | Cloud SQL, 2 vCPU, 8 GB | Cloud SQL page, Cloud SQL Studio |
| App and logs | Yes | Terminal | Cloud Run `web`, scales to zero | Cloud Run `web`, one warm instance | Cloud Run revisions, Logs Explorer |
| Photos | Yes, when keys are set | Disk | R2 bucket `ohworks-media-staging` | R2 bucket `ohworks-media` | Cloudflare dashboard |
| Owner documents and media kits | Yes | Disk | Private R2 bucket, signed links for staff only | Private R2 bucket | Cloudflare dashboard |
| Email | Yes | Outbox | Resend, staging domain, allowlist | Resend, `ohworks.com` | Resend dashboard and the Outbox |
| Place search | Yes | Photon, or Google with a key | Google Places, staging key | Google Places | Google Cloud APIs page |
| Map style | Yes | OpenFreeMap | MapTiler, staging key | MapTiler | MapTiler dashboard |
| Claude | Yes, when the key is set | Off | On, staging key with a low limit | On | Anthropic console |
| Errors | Not yet | Off | Sentry, staging environment | Sentry | Sentry. Recommended in step 1: small, and previews need it |
| Redis | Not yet | Docker | Off until code uses it | Memorystore 1 GB | Memorystore page. Needed before production runs more than one instance, for the shared rate limit and page cache |
| Inngest (jobs) | Not yet | Docker | Off until the first job | Inngest Cloud | Inngest dashboard. Arrives with saved-search emails and availability reminders |
| Typesense (search) | Not yet | Docker | Off | Off until inventory passes a few thousand sites | Typesense Cloud |
| Analytics | Not yet | Off | Off | PostHog, at launch | PostHog |

**A Services page in the admin.** One staff-only page, `/admin/services`, shows each service in that environment: whether it is configured, whether it answered just now, and how long it took, with a link to its dashboard. It reads `/api/health/services`, which only signed-in staff can call. The public `/api/health` stays as it is, for Cloud Run's checks. This is the single place to see what a preview is connected to.

## 7. Swagger and the API

### What is documented

| Specification | Endpoints | Shown in | Try it out |
| --- | --- | --- | --- |
| **Public API v1** (`openapi/public-v1.yaml`) | New, read-only, JSON: `GET /api/v1/sites` (the same filters as search, paged), `GET /api/v1/sites/{unitId}`, `GET /api/v1/cities`, `GET /api/v1/formats`, `GET /api/v1/owners/{slug}` (with the public owner page), `GET /api/health` | Every environment | Yes, everywhere |
| **Internal reference** (`openapi/internal.yaml`) | The 30 form endpoints, grouped as Enquiries, Shortlist, Owners, Places, Newsletter, Replies; the CMS REST API for each collection; the GraphQL endpoint | Preview and staging only, staff signed in | Read-only: the form endpoints require the site's own Origin and cookies, so the page explains each field and answer instead |

The public API follows the same rules as the pages: only published, non-sample sites; a price the owner keeps private is `null` with its display mode; an audience figure only with its source and date; the owner always named as the seller. It is versioned in the path, so a change that breaks a field becomes `/api/v2/`.

### How it is hosted

- **Swagger UI is served by the app** at `/api/docs`, with a choice of specification at the top. Its files come from the `swagger-ui-dist` package and are copied into the build, as the map worker is, so the page loads nothing from another site.
- The specifications are served as JSON at `/api/v1/openapi.json` and, in preview and staging, `/api/internal/openapi.json`.
- In production, `developers.ohworks.com` can point at the same page later. It needs no separate hosting.

### How it stays true

- The YAML files are written first and reviewed like code.
- CI lints both files (Redocly CLI).
- A contract test calls every public endpoint against the test database and checks each answer against the specification, so the documentation cannot drift from the code.
- The internal reference is checked against the route folders: a new endpoint without an entry fails the test.

### Limits on the public API

Read-only, no key at first. Cloudflare rate-limits it per address (for example 60 requests a minute). API keys for agencies and AI assistants come later, with the Owner Network tier.

### The CMS API in Swagger

The CMS does not describe its own REST API as OpenAPI. A one-day spike tries the community plugin `payload-oapi` against this version of the CMS. If it does not fit, the internal reference describes the collections staff actually use by hand, and links to the GraphQL playground on staging.

## 8. Build order

Each step ends in something you can open and judge. "You" marks what only you can do.

| Step | Who | What | You can open |
| --- | --- | --- | --- |
| 0 | You | Create the Google Cloud organisation and billing account; add ohworks.com to Cloudflare; give GitHub a token with the workflow permission; disconnect Vercel from the repository | Nothing yet. About an hour of your time |
| 1 | Code | **Make the container deployable.** Build without a database (the home page renders on its first request instead of at build). A `release` image stage with the CMS tools for the release job. Owner documents to a private R2 bucket. `SITE_ENV` with the noindex header, robots and email allowlist. `/api/health/services`. Sentry. Prove it with a local container build | The app running from its container on this Mac, against the local database |
| 2 | Code, You approve | **Terraform for `shared` and `staging`:** Artifact Registry, Workload Identity for GitHub, Cloud SQL, Secret Manager, the Cloud Run service and release job, Google sign-in in front, budget alerts at 50%, 90% and 100% of a monthly cap. You put the service keys into Secret Manager | `staging.ohworks.com` after Google sign-in, with `/admin` |
| 3 | Code | **Deploy workflows.** CI moves from `infra/ci` to `.github/workflows`. On a pull request: build the image, make `pr_N_preview`, run the release step and fixtures, deploy a tagged revision, comment the link. On close: drop the database and the tag. On `main`: staging. On a tag: production, release job first, then traffic 10% and 100% | A preview link on a test pull request |
| 4 | Code | **Swagger.** Both specifications, Swagger UI at `/api/docs`, the public v1 endpoints, the contract test, Redocly in CI | `/api/docs` on the preview, with Try it out |
| 5 | Code | **The Services page** in the admin, and Cloud SQL Studio access for staff | `/admin/services` on staging |
| 6 | Code, You | **Production.** The `ohworks-prod` project from the same Terraform, Cloud SQL with backups and point-in-time recovery, the super admin seeding from `ohworks-super-admin-plan.md`, Resend on `ohworks.com`, Cloudflare in front with the origin secret, alerts. A dry run: restore a backup into a scratch database | `ohworks.com`, empty and ready for the first owners |

Steps 1 and 4 need no cloud account and can start now. Step 2 starts when step 0 is done. Planned services (Redis, Inngest, Typesense, PostHog) join when the code that calls them lands; Redis must land before production is allowed more than one instance.

## 9. Monthly cost (USD)

| Item | Previews and staging | Production at launch |
| --- | --- | --- |
| Cloud Run `web` | 5 to 15 (scales to zero) | 60 to 120 (one warm instance) |
| Cloud SQL | 10 to 40 (one small instance for staging and every preview) | 110 to 140 |
| Secret Manager, Artifact Registry, logs | under 5 | 5 to 15 |
| Cloudflare R2 | shared, under 5 | 5 to 20 |
| Resend, Sentry | free tiers | 20 to 50 |
| Google Places, MapTiler, Anthropic | free tiers, low limits | usage, 50 to 200 |
| **Total** | **about 25 to 65** | **about 250 to 550**, before Redis, Inngest, Typesense and PostHog |

## 10. How we will know it works

- The test in section 1 passes on a real pull request.
- A preview's database holds samples; staging's and production's never do. A test fails the deploy if a sample site is found outside a preview.
- No preview or staging page is indexed: every answer carries `X-Robots-Tag: noindex`.
- `/api/docs` in production shows the public API only, and the internal specification answers 404 there.
- Every public endpoint passes its contract test on every pull request.
- A rollback is one command: traffic back to the previous revision.

## 11. Decisions for you

1. **A database per preview** (recommended), or all previews sharing the staging database as the build plan first said.
2. **Who may open previews and staging:** the Google accounts to allow. Each needs a Google account; a work address is best.
3. **The public API in production:** live at launch (recommended, the strategy wants assistants and agencies to quote ohworks), or staff-only until there are real sites.
4. **The CMS API in the internal reference:** try the plugin (recommended), or document by hand.
5. **Addresses:** `staging.ohworks.com` for staging, and the Cloud Run tag links for previews (recommended, nothing to set up per preview), or a custom address per preview through Cloudflare, which needs a small Worker.
6. **Sentry from step 1** (recommended) or later.
