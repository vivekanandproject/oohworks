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
pnpm --filter @ohworks/web seed        # users, tags, sources
pnpm --filter @ohworks/web seed:demo   # nine sample pieces, for development and tests only
```

- A piece publishes only when an editor has ticked every Fact against its source and marked it fact-checked.
- Pieces with at least two sections and 300 words get the contents and key-facts rails; shorter ones are a single column. Set Layout to Immersive on a piece with a strong photo for the full-width opening.
- Feeds: `/feed.xml`, `/feed.json`. Sitemaps: `/sitemap.xml`, `/news-sitemap.xml`.
- After changing a CMS collection or block, restart the dev server. A server that was running during the change can serve stale routes and a broken editor.

## Verifying without stopping the site

Test builds go to their own folder, so the dev server can stay up:

```bash
NEXT_DIST_DIR=.next-verify pnpm build
NEXT_DIST_DIR=.next-verify pnpm test:e2e
NEXT_DIST_DIR=.next-verify CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" pnpm lighthouse
```
