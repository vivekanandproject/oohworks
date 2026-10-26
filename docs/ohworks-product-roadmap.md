# OOHWORKS: end-to-end product plan, by phase

Date: 18 Oct 2026. Status: proposed. Replaces the milestones of `ohworks-build-plan.md` (9 Oct 2026), which assumed four to eight engineers starting from nothing. This plan starts from what exists today and follows the strategy's three phases and two gates. The cloud choices (Google Cloud Run in Mumbai, Cloudflare in front) and the charter are unchanged.

## 1. Where the product stands

| Area | Built | Not built |
| --- | --- | --- |
| Public site | Landing, charter, For owners, how results are ordered; design system in `packages/ui` | Legal pages, About and masthead |
| Newsroom | Six sections, articles, guides, authors, topics, corrections, feeds, news sitemap, social cards, fact-check gate, sign-up form | Sending the newsletter, double opt-in, listing strips in guides, chart blocks, article search |
| Find sites | Search with every filter, site page, quick view, shortlist, compare, live map, one enquiry per site or per shortlist split by owner, emailed codes, reply thread, Excel, CSV and print exports, city, area and format hubs, Claude reading of typed searches (never run live) | Landmarks and street view (Google Maps key), licensed map style (MapTiler key), buyer sign-in, shortlist across devices, agency workspace |
| List your sites | Start form, code, password sign-in, company with worldwide place search, add sites by form, spreadsheet and media kit, review states, the team's check, quick price and availability changes, withdrawal, completeness score | Public owner page, editing a live site, photo date and GPS reading, bulk photo matching, WhatsApp codes, leads inbox, per-site figures, calendar, team seats, cities beyond six |
| Team | CMS at `/admin` with roles; super admin role, seeded team, sign-in rules and change-password screen (18 Oct, uncommitted) | Audit log, platform settings, dashboard of queues, suspend and restore, blocked senders, privacy requests, set-password emails |
| Trust | Verified owner, location and permit badges, reply-time badge, duplicate flag, samples never indexed | Report a listing, the 410 answer, image reuse checks, proof of posting, staleness reminders |
| API | Public API v1 and Swagger at `/api/docs/`, internal reference, contract tests | API keys, rate limits at the edge, owners endpoint, MCP server |
| Email | Code, enquiry, reply and review emails written; Outbox when no service | Resend domain not verified, so nothing sends yet |
| Jobs | Nothing on a timer | Saved-search emails, first-sites emails, availability reminders, staleness flags, newsletter sends, reply-time stats |
| Hosting | Dockerfile, release script, migrations, test database, CI workflow parked | Google Cloud projects, Terraform, live CI, previews, staging, production, Cloudflare, secrets, Sentry, backups |
| Storage | Photos and owner files on local disk; R2 code path for photos | R2 in use; private bucket for owner documents |
| Checks | 122 unit tests, 155 browser tests on desktop and the same on two phone engines, Lighthouse budgets, OpenAPI lint | Load test, security review, accessibility pass, restore drill |

Roughly: the buyer side and the owner's door are complete on sample data; nothing runs anywhere but this Mac; no email sends; nothing happens on a timer; no real site is listed.

## 2. The phases at a glance

| Phase | Goal | Done when | Working weeks |
| --- | --- | --- | --- |
| 0. Close the loop | The user workflow runs for real on a staff-only public address | A pull request gets a preview; on staging an owner lists a site, the team publishes it, a buyer enquires, the owner replies, every email arrives | 2 to 3 |
| 1. Go live | oohworks.co is up, safe and empty; the first founding owners list real sites | 25 real Bengaluru sites are indexable, the Bengaluru hub opens, the first organic enquiry arrives | 4 |
| 2. Supply and demand | Gate 1: 5,000 indexable faces, 300 verified owners, 500 enquiries a month, median reply under 24 hours | The Gate 1 dashboard shows every target from live data | 8, then as long as supply takes |
| 3. Revenue | Gate 2: 2,000 enquiries a month, 100 paying owners, 40% of pages earning impressions, 80% of listings updated within 30 days | Owner Pro and Network are billed; featured slots and classifieds sell | 10 |
| 4. Data and new markets | Price index, assistants quoting OOHWORKS, the Gulf | The first quarterly price index publishes; `/ae/` serves Arabic and English | ongoing |

Weeks are of focused engineering at the current pace (one engineer plus the founder's decisions). Phases 2 to 4 are gated by owners signing up, not by code.

## 3. Phase 0: close the loop (now, 2 to 3 weeks)

Nothing new for users. Everything that is built starts working for real, somewhere other than this Mac.

| # | Step | Who | Done when |
| --- | --- | --- | --- |
| 0.1 | Commit the open work: home page changes, Swagger, super admin step 1 | Code | Pushed, tests green |
| 0.2 | **Email.** Verify `oohworks.co` in Resend (DNS records), `EMAIL_FROM`, an allowlist outside production so previews never email strangers, a real run of code, enquiry, reply and review emails | You verify the domain; code the rest | Every email in the workflow arrives in a real inbox |
| 0.3 | **Deployable container.** Build without a database, a release image stage with the CMS tools, owner documents and photos to Cloudflare R2, `SITE_ENV` driving noindex and the allowlist, `/api/health/services`, Sentry | Code | The container runs on this Mac against the local database |
| 0.4 | **Accounts.** Google Cloud organisation and billing, oohworks.co on Cloudflare, a GitHub token with the workflow permission, Vercel disconnected, Meta Business verification started (WhatsApp takes weeks) | You, about two hours | |
| 0.5 | **Staging.** Terraform for `shared` and `staging`: Artifact Registry, Workload Identity, Cloud SQL, Secret Manager, Cloud Run, Google sign-in in front, budget alerts; CI moves to `.github/workflows`; previews per pull request with their own database | Code, you approve the Terraform | `staging.oohworks.co` after Google sign-in; a preview link on a test pull request |
| 0.6 | **Super admin steps 2 and 3.** Audit log, platform settings (close sign-ups without a release), dashboard of queues, suspend and restore owners and staff, blocked senders, take down | Code | Every action in the super admin test appears in the log |
| 0.7 | **Services page** in the admin: what each environment is connected to | Code | `/admin/services` on staging |

### Where phase 0 stands (18 Oct 2026, evening)

| # | Status |
| --- | --- |
| 0.1 | Done: everything open was committed and pushed |
| 0.2 | Code done: `EMAIL_ALLOWLIST` keeps staging and previews from emailing strangers, and on this Mac a code that went to the Outbox shows on the confirm page. **Waiting on you:** verify `oohworks.co` in Resend |
| 0.3 | Code done: builds with no database, a `release` image target, owner documents in a private R2 bucket (`R2_PRIVATE_BUCKET`), `SITE_ENV` noindex for previews and staging, `/api/health/services/`, Sentry (switched on by `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`), and the site address read at run time (`SITE_URL`) so one image serves every environment. Not yet built with Docker on this Mac, and R2 not yet tried with real credentials |
| 0.4 | **Waiting on you** |
| 0.5 | Terraform for shared, staging and production, and the deploy workflow, written and validated (`infra/terraform`, `infra/ci/github-actions-deploy.yml`). Applying waits on 0.4. Previews with their own database are not built |
| 0.6 | Super admin step 1 done; steps 2 and 3 not started |
| 0.7 | The data behind it is live (`/api/health/services/`); the admin page belongs with 0.6 |

Exit: the end-to-end test in `ohworks-preview-and-api-plan.md` section 1 and the walk-through in `ohworks-user-workflow.html` section 9 both pass on staging with real email.

### Where phase 0 stands (26 Oct 2026)

The site runs on Google Cloud and Vercel is gone. The founder chose a **lean production only** to start (no staging): shared and production share the project `oohworks`, Cloud SQL `db-g1-small`, Cloud Run scaling to zero, a MYR 150 monthly budget. Raising it is a settings change (`infra/terraform/envs/prod/main.tf`).

| # | Status |
| --- | --- |
| 0.1 | Done |
| 0.2 | Done: `oohworks.co` verified in Resend (DKIM, `send` and `rsend`), DMARC in monitoring mode, a real send checked |
| 0.3 | Done on Cloud Run, except uploads: the R2 buckets and key are being set up (R2 has to be switched on in the Cloudflare account first) |
| 0.4 | Done: Google Cloud organisation and billing, oohworks.co on Cloudflare (nameservers moved from Squarespace, DNSSEC on), Vercel deleted, GitHub's workflow permission. Meta Business verification not started |
| 0.5 | Production instead of staging: applied with Terraform; the CI and deploy workflows are in `.github/workflows` (a tag `v*` deploys). Staging and previews per pull request are not built |
| 0.6 | Super admin step 1 done; steps 2 and 3 not started |
| 0.7 | The data is live (`/api/health/services/`); the admin page belongs with 0.6 |

Phase 1.1 is mostly in place: `oohworks.co` answers through Cloudflare (a Worker adds the origin secret; the run.app address refuses everything but health and jobs), daily backups, and email alerts for downtime and server errors. Still to do from 1.1: Cloudflare Access on `/admin`, point-in-time recovery (off in the lean setup) and the restore drill. Also live: Google Analytics 4 behind a consent banner, the `/cookies/` page, Bing Webmaster Tools and Google Search Console with both sitemaps, and IndexNow.

## 4. Phase 1: go live (4 weeks)

oohworks.co exists, is safe to leave running, and carries its first real inventory.

| # | Step | Who | Done when |
| --- | --- | --- | --- |
| 1.1 | **Production.** The `oohworks-prod` project from the same Terraform; Cloud SQL with daily backups and point-in-time recovery; Cloudflare in front with the origin secret; Cloudflare Access on `/admin`; alerts on errors, latency and storage; a restore drill into a scratch database | Code, you approve | `oohworks.co` answers through Cloudflare; a direct hit on the Cloud Run address is refused; restore under an hour |
| 1.2 | **Jobs on a timer** (built 18 Oct 2026 as endpoints on the web service called by Cloud Scheduler, not Inngest: one service fewer, and Inngest can come later if jobs grow heavy): saved-search and first-sites emails, a weekly "confirm your availability" nudge, staleness flags at 30 days, nightly reply-time stats, newsletter double opt-in | Code | A follow set on staging gets its email when a matching site is listed |
| 1.3 | **Report a listing** on every site page, a queue in the admin with a response time, the true 410 with similar sites for a removed face. *Done 19 Oct 2026:* the middleware (Node runtime) answers 410 for a removed site's page and its public API entry, failing open after 300 ms; the page shows the 404's frame with similar sites nearby | Code | A report reaches the queue; a removed site answers 410 |
| 1.4 | **List your sites step 2.** Edits to a live site that go back through review while the live version stays up; the public owner page `/owners/{slug}`; date and position read from photographs; photographs matched to sites in bulk; `GET /api/v1/owners/{slug}`. *Bulk matching done 19 Oct 2026:* `/owner/photos/` takes up to 20 at once and places each by its GPS position (within 150 m, 40 m clear of the owner's next site); after-dark photographs become the night view; the rest are placed by hand on the same page | Code | An owner changes a live site's size, buyers keep seeing the old one until the team approves |
| 1.5 | **Assisted onboarding.** Claude reads a PDF media kit into draft sites for the team to check (Anthropic key); stock-photo and reuse checks on images. *Kit reading built 18 Oct 2026:* the `media-kits` job (every ten minutes) has Claude Opus read a waiting PDF into drafts the owner checks, and hands back sites it could not finish, most often for want of an exact position, as a filled-in spreadsheet with the gaps marked. It waits on `ANTHROPIC_WORKSPACE_ID` for the current key. *Image checks built 18 Oct 2026:* a photograph whose file credits a stock library is refused; one whose fingerprint matches a photograph on another listing is added but flagged, to the owner and in the site's photoNote for the team. A reverse image search on the web (for stock photos stripped of their credit) waits on a provider | You add the key; code | Three real media kits become drafts with under ten corrections each |
| 1.6 | **Legal and access.** Terms, privacy, cookies, About and masthead pages; an accessibility pass on every public form; the security review (webhook signatures, signed uploads, dependency audit). *Done 19 Oct 2026, except the legal pages, which wait on the company's details:* a Content Security Policy with a per-page nonce and the other security headers on every answer (`src/middleware.ts`); every API route checked for its guard; the dependency audit (drizzle-orm patched; the 19 left are inside Payload's and Next's own dependencies); twelve public pages pass axe at WCAG 2.1 AA with no violations; forms reachable by keyboard with visible focus. Webhook signatures and signed uploads wait on the services that need them (Resend and WhatsApp, Phase 2) | Code | No high finding open; forms usable with a keyboard and a screen reader |
| 1.7 | **Founding owners.** The founding-owner offer (Pro free for a year, a permanent badge); 20 to 30 Bengaluru owners; their media kits; IOAA and the Karnataka association approached | You, with the team entering kits | 25 real, verified Bengaluru sites live with photographs |
| 1.8 | **Launch content.** Bengaluru cost guides by format; the daily briefing starts; search ads on "hoarding advertising cost Bengaluru" | Editors; you for ads | The first guide publishes with live listings under it |

Exit: the Bengaluru city hub passes its 25-site threshold and enters the sitemap; Search Console shows the first impressions; the first organic enquiry arrives and is answered within a day.

## 5. Phase 2: supply and demand (8 weeks of code, then as long as supply takes)

Everything that turns a working marketplace into one that reaches Gate 1.

| # | Step | Done when |
| --- | --- | --- |
| 2.1 | **The owner's desk** (List your sites step 3): a leads inbox across web and email with reply templates and quotes; figures per site (views, search appearances, shortlists, enquiries); an availability calendar; team seats. Free during the pilot; this is Owner Pro's foundation | An owner answers every enquiry from one screen |
| 2.2 | **WhatsApp** (Meta verification from 0.4): codes by WhatsApp or SMS, enquiry notices, replies stitched into the thread, one-tap availability confirmation | An owner replies from WhatsApp and the buyer sees it in the thread |
| 2.3 | **Buyers who come back.** Buyer sign-in; shortlist across devices; the agency workspace: team seats, private client folders, enquiry history, owner replies side by side | A planner opens the same shortlist on a second device |
| 2.4 | **Editorial that sells.** Listing strips in guides; cost guides for all six launch cities; hub opening facts computed nightly; weekly buyer digest; labelled sponsorship slots | Every launch city has a guide with live sites |
| 2.5 | **Search at scale.** Typesense when inventory passes a few thousand sites; the Claude reading run live; nearby landmarks and street view (Google Maps key); a licensed map style and static map images (MapTiler key) | Search under 300 ms at 10,000 sites |
| 2.6 | **Running at scale.** Redis for the shared page cache and rate limits; Cloud Run allowed more than one instance; PostHog events; Search Console pulled per page; the Gate 1 dashboard | The dashboard shows all four targets from live data |
| 2.7 | **More cities.** Cities and localities as data rather than a fixed list; Tier-2 Indian cities; six-city limit on sites lifted | A site in Kochi lists and gets a hub |
| 2.8 | **Supply work** (you): associations, owner events (OAC in July, e4m in April), city by city | 300 verified owners |

Exit: Gate 1. Each target met for a full month.

## 6. Phase 3: revenue (10 weeks, after Gate 1)

Charge owners for visibility and tools, never for media.

| # | Step | Done when |
| --- | --- | --- |
| 3.1 | **Billing.** Razorpay subscriptions, entitlements, invoices, the super admin's view of plans; founding owners' free year honoured | A test owner upgrades and is billed |
| 3.2 | **Owner Pro.** Full analytics, the WhatsApp inbox, availability sync from the owner's system, the verified-photo app flow, priority support | The first ten paying owners |
| 3.3 | **Owner Network.** Bulk import and sync (Broadsign and similar), API keys for the public API with higher limits, team seats, a custom storefront domain, an account manager | A large owner syncs its inventory nightly |
| 3.4 | **Featured placement.** Labelled "Featured · paid placement" slots on hubs and results, capped per page, never mixed into best match | Sold and shown within the cap |
| 3.5 | **Classifieds.** Sites and structures for sale, jobs; a fixed fee per listing | The first paid classified |
| 3.6 | **Programmatic bridges.** "Available programmatically via" per exchange on digital screens | Named exchanges on live screens |
| 3.7 | **Trust at scale.** Proof-of-posting photos buyers can see; report response times tracked; a monthly prune of thin pages | 80% of listings updated within 30 days |

Exit: Gate 2.

## 7. Phase 4: data and new markets (after Gate 2)

| # | Step |
| --- | --- |
| 4.1 | Quarterly price index and market reports computed from listings, with method notes; chart blocks in reports; a data API for owners, agencies and investors |
| 4.2 | Assistants: the public API behind keys, an MCP server so ChatGPT and Claude quote OOHWORKS inventory |
| 4.3 | The Gulf: `/ae/` and `/sa/`, Arabic and English editions written by people, trade-licence verification, Dubai's Mada permit data, regional pricing |
| 4.4 | US and UK through independents and editorial; Africa and Latin America through associations |
| 4.5 | Events and awards once the audience exists |

## 8. What only you can do, and when

| Phase | Action | Why it cannot wait |
| --- | --- | --- |
| 0 | Verify `oohworks.co` in Resend | No email sends until then; every hand-off in the workflow is an email |
| 0 | Google Cloud billing, Cloudflare zone, GitHub token with the workflow permission, disconnect Vercel | Nothing can be hosted or tested on GitHub |
| 0 | Start Meta Business verification | WhatsApp access takes two to six weeks; Phase 2 needs it |
| 0 | Name the Google accounts allowed into previews and staging | They are staff-only |
| 1 | Anthropic, Google Maps and MapTiler keys | Media-kit reading, landmarks and a licensed map |
| 1 | Company details for the legal pages; the charter in final words | Public from launch |
| 1 | The founding-owner offer, and 20 to 30 Bengaluru owners with their media kits | Nothing is indexable without real sites |
| 2 | Association partnerships; a stall or talk at owner events | Supply city by city |
| 3 | Razorpay account; Pro and Network prices after the pilot | Anchor to one extra booking a year, not to SaaS lists |
| 3 | Decide whether to add payment protection as a flat-fee option | Owners' slow-payment pain, without a media margin |

## 9. Rules that hold across every phase

- Nothing ships without its tests: unit, browser on three engines, Lighthouse budgets, OpenAPI lint. Every collection change carries its migration.
- Samples live only in test and preview databases. Production never holds one.
- The charter is code: the owner is the named seller, prices are the owner's, every figure carries its source, paid placement is labelled and capped.
- Pages join the index only above the content bar and hub thresholds; a removed page answers 410, never a silent redirect.
- Each phase ends on staging first, then production behind a release tag, with a rollback that is one command.

## 10. Risks that could move the dates

| Risk | Effect | What we do |
| --- | --- | --- |
| Founding owners are slow to sign | Phase 1 exit and all of Phase 2 slip | Assisted onboarding from day one: "send us your media kit, we list it in 24 hours" |
| WhatsApp verification stalls | Owner replies stay on email | Start in Phase 0; email and the web reply page already work |
| One engineer | Phases run in series, not in parallel | The order above puts revenue-blocking work first; add a second engineer at Phase 2 for the owner's desk and WhatsApp |
| Bengaluru's 2025 advertising rules | Supply concentrates in fewer owners | Confirm the rules' status before counting on Bengaluru alone; Mumbai and Hyderabad guides early |
| Google treats pages as thin | A penalty hits the whole domain | Thresholds, the content bar, a staged city-by-city sitemap release, monthly pruning |

## 11. Decisions for you

1. Accept this order, in particular email and hosting before any new feature.
2. Phase 1 launch city: Bengaluru only, or Bengaluru and Mumbai together.
3. A second engineer at Phase 2, or stretch Phase 2 across more weeks.
4. Whether the public API is open to everyone from launch, as the strategy wants, or keyed from day one.
