# syntax=docker/dockerfile:1.7
# One image for both Cloud Run services; SERVICE_ROLE=web|jobs picks the behaviour at runtime.
# A second target, `release`, is the Cloud Run job that prepares the database before each deploy:
#   docker build --target release -t oohworks-release .
# The build needs no database: pages that read one fill in on their first request.

FROM node:22-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
# The install applies these, so they must be present before it runs.
COPY patches patches/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/core/package.json packages/core/
COPY packages/ui/package.json packages/ui/
COPY packages/jobs/package.json packages/jobs/
COPY packages/integrations/package.json packages/integrations/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
# Every node_modules folder the install made, the workspace packages' own included, then the
# source on top (.dockerignore keeps this machine's node_modules out).
COPY --from=deps /app ./
COPY . .
# The site's address is not built in: the host sets SITE_URL, so one image serves every environment.
# Browser error reports go to Sentry only when this is given (src/instrumentation-client.ts).
ARG NEXT_PUBLIC_SENTRY_DSN=
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
RUN pnpm --filter @ohworks/web build

# Migrations, then the first users and reference data (apps/web/scripts/release.mjs). Needs the
# CMS's own command and tsx, which the slim runner leaves out, so it keeps the build's files.
FROM build AS release
WORKDIR /app/apps/web
ENV NODE_ENV=production
CMD ["node", "scripts/release.mjs"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /app/apps/web/public ./apps/web/public
USER app
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
