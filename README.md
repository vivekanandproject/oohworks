# ohworks

The open map of out-of-home, where the owner is always the seller.

Docs live in `docs/`: strategy, architecture, build plan and design system.

## Local development

```bash
corepack enable                # pnpm from package.json
pnpm install
cp .env.example .env
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
