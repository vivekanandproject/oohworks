# ohworks on Netlify: a preview

Written 12 Oct 2026. The plan of record is still Google Cloud Run with Cloud SQL (`ohworks-build-plan.md`). Netlify is a preview: a public address to look at the site on, with sample content.

## What was wrong

`oohworks.netlify.app` said "Page not found" because Netlify had no build settings. It uploaded the repository's files as a plain website, and a folder of source code has no home page. The app is a server (Next.js with the Payload CMS inside), so it has to be built and run, and every page reads from Postgres.

## What the repository now gives Netlify

| File | What it does |
| --- | --- |
| `netlify.toml` | Builds the app in `apps/web` with the Next.js runtime, and marks the build as a preview |
| `apps/web/scripts/hosted-build.mjs` | The build: creates the tables, makes the first users, loads the sample content, publishes the pictures, builds the site |
| `apps/web/src/migrations/` | The SQL that creates the tables. A hosted database is only ever changed by these files |
| `apps/web/src/lib/hosting.ts` | Reads the database address and the signing secret under whatever names the host uses |

## What Netlify must provide

One thing: **a Postgres database**. The build stops with a plain message if there is none.

- The app lists `@netlify/neon`, which asks Netlify to create its own database (Netlify DB, run by Neon) and set `NETLIFY_DATABASE_URL`. A database made this way is deleted after 7 days unless it is claimed from the Netlify dashboard (Extensions, Neon).
- Or set `DATABASE_URL` yourself to any Postgres address, under Site configuration, Environment variables. If the provider gives a pooled and a direct address, put the pooled one in `DATABASE_URL` and the direct one in `DATABASE_URL_UNPOOLED`.

## Settings worth adding in Netlify

All optional. Set them under Site configuration, Environment variables, then deploy again.

| Variable | Without it | With it |
| --- | --- | --- |
| `SEED_ADMIN_PASSWORD` | The admin users exist with a random password nobody knows, so `/admin` is shut | You sign in at `/admin` as `admin@ohworks.local` with this password |
| `PAYLOAD_SECRET` | A signing secret is worked out from the database address | Your own secret signs cookies and links. Changing it signs everyone out |
| `RESEND_API_KEY` | No email is sent. Codes and notices are kept in the admin, under Operations, Outbox | Codes and notices are emailed |
| `GOOGLE_MAPS_API_KEY` | The place search uses the short list of cities in the code | The place search is Google Places |

## What the preview cannot do yet

- **Keep uploaded files.** Netlify's functions have no disk. Photographs, GST certificates, spreadsheets and media kits cannot be saved, so those steps of List your sites fail there. The pictures made at build time are served as plain files. The fix is object storage: the CMS already sends media to Cloudflare R2 when `R2_*` is set, and owner files would need the same.
- **Send email** without `RESEND_API_KEY`. Someone listing gets as far as "enter the code" and no code arrives. With the admin password you can read the code in the Outbox.
- **Be found by search engines.** Every answer from a `netlify.app` address carries `X-Robots-Tag: noindex, nofollow`, and the content is samples.

## Changing a collection from now on

A development machine reshapes its own tables as the code changes. A hosted database does not. After changing any collection, make a migration and commit it with the change:

```
pnpm --filter @ohworks/web payload migrate:create short-name
```

If it is forgotten, the hosted site will build and then fail on the first page that touches the new field.

Two things about the generated file, both hit on the first one:

- Mark its two type imports as types: `import { type MigrateUpArgs, type MigrateDownArgs, sql }`. Left as generated, the migrate command cannot load the file.
- The CMS's migrate command exits as if it had worked even when a migration fails. `hosted-build.mjs` reads its output for that reason.

## Checked before the first push

The hosted build was run on this machine against a new, empty database: tables created, users and samples loaded, site built, then started with no `PAYLOAD_SECRET` set. The home page, search, a site page, a city hub, the newsroom, a showcase piece with its picture, List your sites, Sign in and the admin all answered. The admin's known development password was refused, and the "create the first user" screen was closed. Netlify's own packaging and its database could not be tried from here.
