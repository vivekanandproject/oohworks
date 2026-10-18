# oohworks.co landing page: plan, style and SEO contract

Date: 9 Oct 2026. Status: built and verified on 9 Oct 2026 (32 Playwright checks, Lighthouse budgets in CI). Builds on `ohworks-architecture.md` (rendering and SEO rules), the strategy report (location SEO architecture) and the design system (`ohworks-design-system.md`). SEO shaped every decision below; where SEO and visual preference conflicted, SEO won.

## 1. Why the homepage matters for SEO

The homepage is the most-linked page on the domain and the page Google crawls first. Its three SEO jobs:

1. **Distribute authority.** The strategy names "homepage 'new sites' modules" as an internal-link mechanism. Every indexable city hub, guide and owner storefront must be reachable from the homepage within one click, and new unit pages within two.
2. **Earn the brand and category queries.** Title and opening copy target "OOHWORKS", "billboard advertising India", "hoarding advertising" and "OOH advertising sites". The hub and guide pages handle the long tail.
3. **Be quotable by answer engines.** The first paragraph is a dated, sourced sentence that ChatGPT, Perplexity and Google AI Mode can lift verbatim.

What the homepage must never do: link to a hub that returns 404 (wastes crawl budget and signals broken internals), show a number without a source and date, shift layout after load, or be thin.

## 2. Sections, in order

| # | Section | SEO role |
| --- | --- | --- |
| 1 | Edition strip: "Global edition · India edition" links, always rendered, fixed height | Replaces IP redirects; zero CLS because it is static and always present |
| 2 | Nav bar: wordmark, Find sites, Guides, News, For owners, Sign in, List your sites | Site-wide links to the four crawl entry points |
| 3 | Hero: H1, one-sentence standfirst, search box, dated sourc ed fact | H1 is the LCP element (text, not image); the fact is the quotable sentence |
| 4 | How OOHWORKS works: Find, Enquire, Hear back | Substantive copy; answers "how does OOHWORKS work" |
| 5 | The charter: five rules | Unique content no competitor has; strong E-E-A-T signal |
| 6 | New sites: up to 8 ListingCards from the newest indexable faces | The "new sites module" the strategy names; links straight to unit pages. Hidden until the first indexable face exists |
| 7 | Launch cities: Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai | Links to `/in/{city}/` only when the hub is above threshold; otherwise a non-link card with "Opens with the first owners" and a link to owner sign-up |
| 8 | For media owners | Links to `/for-owners/` and sign-up; plain copy on the free listing and assisted onboarding |
| 9 | For agencies and brands | Links to the charter and search |
| 10 | Guides and news: 3 ArticleCards | Links to `/in/guides/` and the newest articles; hidden until articles exist |
| 11 | Neutrality line in display type | Brand statement; also appears in the footer |
| 12 | Footer: Product, For owners, Company, Local terms, legal | Second set of links to every hub and guide index; the local-term column seeds "hoarding", "vía pública", "mídia exterior", "48-sheet", "bulletin" |

Sections 6 and 10 render nothing when there is no data. No placeholders, no lorem ipsum, no fake counts.

## 3. The SEO contract the page must pass

Checked by Playwright and Lighthouse CI on every PR.

**Document**

- Exactly one `<h1>`: "Every billboard, findable." Section titles are `<h2>`; no skipped levels.
- `<title>`: "OOHWORKS: every billboard, findable. The open map of out-of-home advertising" (under 70 characters).
- Meta description, under 160 characters: "Search billboards, hoardings and digital screens, see the verified owner and ask in one step. Owners list free and always sell direct. OOHWORKS never takes a media margin."
- Self-canonical `https://oohworks.co/`. `hreflang`: `x-default` and `en` to `/`, `en-IN` to `/in/` once the India home exists. Generated from editions that actually exist, never hard-coded.
- `robots` meta: index, follow. The search results route is `noindex` and `/search/` is disallowed in robots.txt alongside the existing `/*?*` rule.
- Language attribute `en` on `<html>`.

**Structured data (JSON-LD, one script)**

- `Organization`: name OOHWORKS, url, logo (the mark as PNG at 512 px), `sameAs` for social profiles once they exist, `contactPoint` for press.
- `WebSite` with `potentialAction: SearchAction` targeting `/search/?q={search_term_string}` so Google can show a sitelinks search box.
- No `Product`, `Offer` or `FAQPage` on the homepage. FAQ rich results ended 7 May 2026; any FAQ is visible text only.

**Performance budgets (throttled mobile, Lighthouse CI)**

- LCP under 2.5 s. The LCP element is the H1 text: Bricolage Grotesque is preloaded, `font-display: swap`, subset to Latin; Plex Sans and Plex Mono load with `swap` but are not preloaded.
- CLS under 0.1: the edition strip and nav have fixed heights; every image and map thumbnail has `width` and `height`; fonts use size-adjusted fallbacks via `next/font`.
- INP under 200 ms: the page is a server component with one small client island (the search box). No analytics script blocks the main thread; PostHog loads after interaction or idle.
- Total JS under 120 kB first load. No map library on the homepage; city thumbnails are static images from MapTiler with fixed dimensions in AVIF/WebP via Cloudflare Images.

**Links and crawl**

- Every link on the page resolves 200. A Playwright test crawls all internal links from `/` and fails on any 3xx or 4xx.
- Launch-city cards link to a hub only when `page_status.index` is true for that hub. Below threshold they are not links.
- The homepage is listed in `sitemap-pages.xml`, referenced from `/sitemap-index.xml`, with `lastmod` updated only when copy or the new-sites module changes.
- Rendering: ISR tagged `home`; revalidated by the `listing.changed` job when a face becomes indexable, so the new-sites module stays current without per-request rendering.

**Content**

- The hero fact at launch: "Global OOH spend was $54.2 bn in 2025, up 15%. Source: WOO Global OOH Expenditure Report 2026." It switches to an OOHWORKS figure the moment we have one: "N verified sites across 6 Indian cities (OOHWORKS, Oct 2026)."
- Every number on the page carries unit, source and date, in the format the design system fixes.
- No machine-translated copy. Hindi and Arabic homepages are written by people when those editions open.

**Crawlers**

- `robots.txt` already allows Googlebot, Bingbot, OAI-SearchBot and PerplexityBot. AI training crawlers remain a separate, single-place decision.
- The Cloudflare origin-secret check must never block crawlers: Cloudflare injects the header for all proxied traffic, including bots. The Playwright test fetches `/` with a Googlebot user agent through the same path to prove it.

## 4. Style, from the design system

- Day theme only: `paper` background, `ink` text, hairline rules between sections. No dark mode, gradients, shadows on type, emoji or stock photos.
- Type: Bricolage Grotesque for the H1 (`display-xl` 64/0.95) and section titles (`display-md` 30/1.1); IBM Plex Sans 15/23 body; IBM Plex Mono for the sourced figure and any ID.
- One `survey` element: the search submit button. "List your sites" is navy primary; everything else is ghost or text link.
- The charter band uses `survey-tint` background with `ink` text, no survey ink inside.
- Imagery: the mark, the icon set, hairline schematics and static map tiles. Real approach-view photos arrive with the first owners in M3.
- Motion 120 ms on hover and focus; nothing bounces; honours `prefers-reduced-motion`.
- 44 px tap targets, 2 px navy focus ring, `text-wrap: balance` on headings, 60 to 70 character measure, 1200 px content width, 16 px gutters on phones.

## 5. Copy to approve

- H1: "Every billboard, findable."
- Standfirst: "OOHWORKS is the open map of out-of-home advertising. Search any site, see the owner, ask in one step. The owner always sells."
- Search placeholder: "Try: hoarding on Outer Ring Road, Bengaluru"
- Hero fact: as in section 3.
- Neutrality line: "OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients."

## 6. Technical setup before the page

1. Read `project/README.md`, `project/tokens.json` and the Logos, Button, NavBar and ListingCard READMEs from the live Design System artifact.
2. `apps/web/src/app/tokens.css`: every colour, radius, shadow and spacing token as CSS variables; Tailwind theme reads them, so `bg-paper`, `text-ink`, `rounded-md` resolve to the tokens.
3. `apps/web/src/app/fonts.ts`: the three families through `next/font/google` with the exact weights; display font preloaded.
4. `packages/ui`: Button, SearchField, Badge, Icon (formats and states), Mark and Wordmark, NavBar, Footer, ListingCard, ArticleCard, EditionStrip.
5. `apps/web/src/app/sitemap.ts` for static pages and the sitemap index, so `robots.txt` no longer points at a 404.
6. `apps/web/src/lib/seo.ts`: helpers for canonical, hreflang, Organization and WebSite JSON-LD, used by every page from now on.
7. `lighthouserc.json` with the budgets above, wired into CI.
8. Playwright: internal-link crawl, single H1, JSON-LD validity, Googlebot fetch.

## 7. Build order

1. Steps 1 to 3 of section 6.
2. UI primitives in `packages/ui`.
3. `app/page.tsx` as server components, one per section, each with a `data-section` attribute.
4. SEO helpers, sitemap, Lighthouse and Playwright checks.
5. Replace the hello home; keep the sample unit page link behind a dev-only flag.
6. Verify in the browser at 360, 640 and 1200 px, run Lighthouse, run the link crawl.

## 8. Decisions SEO makes for us

- **Edition banner:** a static strip shown to everyone, no geo-IP, no redirect. Zero CLS, fully cacheable, honours the no-IP-redirect rule.
- **Search target:** free text to `/search/?q=`, which is `noindex` and robots-blocked. Search results never compete with hubs for rankings.
- **Headline:** the H1 stays "Every billboard, findable." The `<title>` carries the category words ("out-of-home advertising") so the brand query and the category query are both covered without stuffing the H1.

## 9. Build notes (9 Oct 2026)

- Pages live: `/`, `/charter/`, `/for-owners/`, `/guides/`, `/news/`, `/search/` (noindex), `/sign-in/` (noindex), `/robots.txt`, `/sitemap.xml`.
- Design system deviation to resolve upstream: `on-survey` is set to ink (#101c30) instead of white. White on survey measures 3.63:1 and fails WCAG AA at button sizes; ink measures 4.7:1, the figure the system quotes.
- The display font loads with `font-display: optional` so a late font never reflows the hero.
- UI primitives in `packages/ui` use plain anchors so they stay framework-agnostic; pages in `apps/web` use Next `Link` for internal navigation.
- The "new sites" and "newsroom" sections render only when real data exists; they are wired to empty arrays until M2 and M5.
- Display face changed from Bricolage Grotesque to Archivo (variable, width axis, 800 weight, 106 to 112% width) on 9 Oct 2026 at the founder's request for a stronger headline. The design system artifact still names Bricolage and should be updated; `packages/ui/src/styles/typography.css` holds the live scale.
- Primary font is Archivo for display and body (one variable file with weight and width axes); IBM Plex Mono stays for measured data. Plex Sans is no longer loaded.
- Browser baseline is Tailwind v4's: Chrome 111+, Safari 16.4+, Firefox 128+. Width is set through `font-variation-settings` as well as `font-stretch`; cross-document view transitions degrade to an instant change where unsupported.
- Responsive contract: `apps/web/e2e/responsive.e2e.ts` loads every page at 320, 360, 390, 414, 640, 768, 834, 1024, 1280, 1440 and 1920 px and fails on any horizontal overflow. The suite runs in Chromium (desktop and Pixel 7), WebKit (iPhone 14) and, in CI, Firefox.
- Verified icon changed to a circle with a centred tick (10 Oct 2026): the asset group's scalloped seal blurred at badge size. `packages/ui/assets/icons/verified.svg` is updated; the design system artifact should follow.
- Guides moved out of the top navigation into the footer only (10 Oct 2026, founder's request). The bar is now Find sites, News, For owners, Sign in, List your sites; this differs from the design system's NavBar spec.
- The navigation bar is sticky at the top on every page (10 Oct 2026). It is 64px, under the design system's 25% limit even on a landscape phone; `scroll-padding-top: 80px` keeps anchor targets clear of it.
