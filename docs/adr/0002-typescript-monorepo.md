# ADR 0002: One TypeScript monorepo with a modular monolith

Date: 9 Oct 2026. Status: accepted.

## Context

Next.js, Payload, Inngest and Drizzle are all TypeScript-native. Nothing in Phase 1 needs Python. A small team moves fastest with one language, one build and one deployable, as long as module boundaries make a later split cheap.

## Decision

Turborepo with pnpm workspaces. `apps/web` is the only deployable. Domain logic lives in `packages/core`, one folder per module (identity, inventory, offers, verification, enquiries, editorial, indexing, search, data, trust, billing, notifications); modules call each other only through exported services, never through each other's tables. `packages/db` owns the Drizzle schema and migrations, `packages/jobs` the Inngest functions, `packages/integrations` the external clients, `packages/ui` the design-system components, `packages/config` shared tsconfig and ESLint presets.

Conventions: TypeScript strict with `noUncheckedIndexedAccess` and `verbatimModuleSyntax`; extensionless relative imports inside packages (webpack does not map `.js` specifiers to `.ts` sources); packages export TypeScript source and are transpiled by Next.js; ESLint 9 flat config, with the Next app using Next's own TypeScript preset; Prettier with the Tailwind plugin; Vitest for domain rules; Playwright for route behaviour.

## Consequences

- Next.js 15.5 is pinned for now because its conventions are known to the team; the Next 16 upgrade (which renames `middleware.ts` to `proxy.ts` and makes Turbopack the default) is scheduled as an early M1 task using the official codemod, before the route tree grows.
- TypeScript 5.9 and ESLint 9 are pinned until Next's preset declares support for TypeScript 7 and ESLint 10.
- Extracting `apps/api` (Hono) or the MCP server in Phase 3 means moving a package import, not rewriting logic.
