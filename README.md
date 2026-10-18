# ohworks

The open map of out-of-home, where the owner is always the seller.

Docs live in `docs/`: strategy, architecture, build plan and design system.

## Local development

```bash
corepack enable                # pnpm from package.json
pnpm install
cp .env.example .env && ln -s ../../.env apps/web/.env   # Next reads env from the app folder
pnpm db:up                     # Postgres+PostGIS, Redis, Typesense, Inngest dev, Mailpit
pnpm db:migrate && pnpm db:seed
pnpm dev                       # http://localhost:3000
```

Check: `/in/bengaluru/koramangala/hoarding-80-feet-road-ow8k3x2/` returns 200 with JSON-LD, `/in/nowhere/` returns 404, `/api/health/` returns JSON.

Other local UIs: Inngest http://localhost:8288, Mailpit http://localhost:8025, Typesense http://localhost:8108.

## Layout

- `apps/web`: Next.js app (public site, owner and buyer dashboards, Payload admin, API, Inngest handler)
- `packages/core`: domain services, one folder per module
- `packages/db`: Drizzle schema, migrations, seeds
- `packages/ui`: design-system components
- `packages/jobs`: Inngest functions
- `packages/integrations`: external clients
- `packages/config`: shared tsconfig and eslint presets
- `infra`: Terraform for Google Cloud and Cloudflare

## Commands

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, `pnpm db:generate|migrate|seed`.

One Docker image serves both Cloud Run services; `SERVICE_ROLE=jobs` restricts it to the Inngest handler.

## Newsroom

The editorial side runs on the CMS at `/admin` and renders at `/newsroom/`, with one section each for news, analysis, guides, owner academy, data and showcase.

```bash
pnpm --filter @ohworks/web seed        # users, tags, companies, sources: no sample content
```

- A piece publishes only when an editor has ticked every Fact against its source and marked it fact-checked.
- Pieces with at least two sections and 300 words get the contents and key-facts rails; shorter ones are a single column. Set Layout to Immersive on a piece with a strong photo for the full-width opening.
- Feeds: `/feed.xml`, `/feed.json`. Sitemaps: `/sitemap.xml`, `/news-sitemap.xml`.
- After changing a CMS collection or block, restart the dev server. A server that was running during the change can serve stale routes and a broken editor.

## Tests

Tests have their own database (`ohworks_test`), uploads folder (`apps/web/test-data`), build
(`.next-verify`) and address (`127.0.0.1:3100`), all set in `apps/web/scripts/test-env.mjs`. The sample
owners, sites and pieces in `apps/web/e2e/fixtures` are loaded only there, and refuse any database whose
name does not end in `_test`. The development database and production never hold sample content.

```bash
pnpm --filter @ohworks/web test:db      # make the test database afresh, with its sample data
pnpm --filter @ohworks/web verify:cms   # editorial workflow checks, on the test database
pnpm --filter @ohworks/web build:test   # the test build; the dev server can stay up
pnpm test:e2e
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" pnpm lighthouse
```

## Releasing

`pnpm --filter @ohworks/web release` prepares a database for a new version: it runs the migrations in
`apps/web/src/migrations`, then makes sure the first users and reference data exist. Every change to a
CMS collection needs a migration committed with it (`pnpm --filter @ohworks/web payload migrate:create name`).
In production set `PAYLOAD_SECRET`, `SUPER_ADMIN_EMAILS` and `SUPER_ADMIN_PASSWORD` (see `docs/ohworks-super-admin-plan.md`). A release stops if it would leave no active super admin.
