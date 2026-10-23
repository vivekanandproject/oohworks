# Every published article findable by search engines, answer engines and AI agents

Date: 24 Oct 2026. Status: approved 24 Oct 2026 with the decisions in section 8; built the same day (section 10). Builds on the editorial plan (`ohworks-editorial-plan.md` section 5), the landing page SEO contract (`ohworks-landing-page.md`) and the newsroom desk plan (`oohworks-newsroom-cms-plan.md`).

**The goal:** when an editor presses Publish, the article is already complete for four kinds of reader:

1. **Search engines** (Google, Bing): it can be crawled, indexed and ranked, and is eligible for Top Stories, Discover and rich results.
2. **Answer engines** (Google AI Overviews and AI Mode, ChatGPT search, Perplexity, Copilot): they can lift a correct, sourced answer from it and cite it.
3. **AI agents** (assistants that fetch pages for a user, or call APIs): they can read it cleanly, with its facts, dates and sources as data.
4. **Bots in general:** fast, stable, honest status codes; no traps; told about changes straight away.

"100%" is not a feeling. It means the article passes a fixed checklist **before** publish (section 3) and a fixed contract **after** publish (section 6), and both are enforced by code.

## 1. What is already in place

| Area | Today |
| --- | --- |
| Rendering | Every article is rendered on the server, text in the HTML, real status codes |
| Metadata | Title, description, canonical, `max-image-preview:large`, Open Graph and social cards per pillar (`/og/…`) |
| Structured data | `NewsArticle` for news and `Article` for the other pillars, with headline, description, real published and modified dates, authors, publisher, section, image and `citation` (source URLs); `BreadcrumbList`; `Person` on author pages; `Organization` and `WebSite` site-wide |
| Facts | Every figure is a Fact block with a source and the date it is true for; a numbered sources list; a key-facts panel |
| Discovery | `sitemap.xml`, `news-sitemap.xml`, RSS (`feed.xml`) and JSON Feed, IndexNow ping on publish (Bing, Yandex, Naver, Seznam) |
| Crawlers | robots.txt allows everything public, closes filtered and private paths, and names OAI-SearchBot and PerplexityBot |
| Trust | Corrections log and page, sponsored pieces labelled and kept out of News |

## 2. What is missing

| Gap | Why it matters |
| --- | --- |
| **No check before publish** beyond facts being ticked | An article can go out with a 110-character title, no description, no alt text or no internal links |
| **No short answer at the top** | Answer engines and featured snippets lift a self-contained 40–60 word answer; ours start with narrative |
| **Entities are not marked up** (`about`, `mentions`) | Places, companies and people in a piece are invisible as entities; Google and LLMs link facts to entities |
| **No machine-readable copy for agents** | Agents fetch HTML full of navigation; a clean text copy with facts and sources is far easier to cite correctly |
| **No `llms.txt`** | Google ignores it, but several assistants and agent tools read it to find the important pages |
| **Publisher trust pages are thin** | No masthead, publishing principles, fact-checking policy or ownership page; Google's news guidance and E-E-A-T look for these; `NewsMediaOrganization` can point to them |
| **No "Fact-checked by"** | The fact-check gate exists, but the page and the markup do not say who checked it |
| **Publisher logo is an SVG** | Search features that show a publisher logo are most reliable with a raster image (PNG, at least 112 × 112 px); an SVG may not be used |
| **Changes are not announced to Google** | IndexNow does not include Google; Google reads sitemaps and feeds. A WebSub ping on the feed and accurate `lastmod` are what it uses |
| **No policy for AI crawlers** | Search and answer bots (OAI-SearchBot, PerplexityBot, Claude-SearchBot, ChatGPT-User) and training bots (GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended) are different decisions; only two are named today |
| **The live address is temporary** | Articles are published on `oohworks.vercel.app`, while `oohworks.co` still points at a Ghost blog. Canonicals, sitemaps and every citation an AI makes will point at the wrong host until the domain moves (section 7) |

## 3. Before publish: the readiness check in the CMS

Shown in the desk panel from the newsroom desk plan as a list that updates while writing. **Hard rules block Publish; advice is shown but does not block.**

**Hard rules (Publish refused until fixed):**

1. Title 30–90 characters; no clickbait words from the style guide's banned list.
2. Standfirst present, 80–300 characters.
3. Meta description present (or the standfirst, which fits in 160 characters).
4. Slug set, lowercase, no dates or stop-word padding.
5. **Short answer** present for News, Analysis and Explainer (section 4.1).
6. Every Fact has a source and a date, and is ticked (exists today).
7. Hero image, if any, at least 1200 px wide, with alt text and a credit. Immersive layout requires one.
8. Every image in the body has alt text.
9. At least one author with a person page.
10. At least one place or topic tag.
11. Headings in order (h2 then h3, never skipping).

**Advice (warns, does not block):**

- At least two internal links: a related article, a guide, a city hub or a site page.
- At least one outbound link to a primary source.
- The main subject (place, company or format) appears in the title and the first paragraph.
- Body over 300 words for Analysis and Explainer.
- Looks like an earlier piece: a near-duplicate title or slug warning, to avoid two pages competing.
- Reading level: sentences over 30 words flagged.

## 4. In the article itself

### 4.1 A short answer, first

A new **Short answer** field: 40–60 words, plain text, no links. It answers the question the headline raises, with the key figure and its date. It renders as the first thing under the standfirst. It is also used as:

- the meta description fallback;
- the `abstract` in the structured data;
- the summary in the feeds and the agent copy.

Answer engines lift this paragraph; readers in a hurry get it too. For Explainers, section headings are written as the questions people ask ("How much does a hoarding cost in Bengaluru?").

### 4.2 Entities, marked up

Places, companies and people already linked to a piece become `about` (the main subject) and `mentions` (everything else) in the structured data, each with its own page URL. Where a Wikidata or Wikipedia entry exists, it goes in `sameAs`. One new optional field on Tags, Companies and People: **Wikidata ID**.

### 4.3 Who checked it

The editor who marks a piece Fact-checked is recorded. The page shows "Fact-checked by Name · 24 Oct 2026", and the structured data adds the editor as a reviewer. Corrections already show as "Updated" with what changed; `dateModified` changes only when the text changes, never on a re-save.

### 4.4 Structured data, completed

- **`NewsMediaOrganization`** as the publisher, with `publishingPrinciples`, `correctionsPolicy`, `verificationFactCheckingPolicy`, `ownershipFundingInfo`, `masthead` and `actionableFeedbackPolicy`, each pointing at a real page (section 5).
- A **raster publisher logo** (PNG, 600 × 60 and 512 × 512).
- **`speakable`** on the title and the short answer, for news. Google treats it as a beta for English-language news publishers; it costs nothing to add.
- **Images** in three ratios (16:9, 4:3, 1:1) from the hero, as Google recommends for Article.
- Every Fact with a label is listed as a `Claim` in the key facts, with its source as `citation`. This is cautious, so no ClaimReview, which is for checking other people's claims.

## 5. Publisher trust pages

Five short pages, linked from the footer and from the structured data. They need your company details, so they share a dependency with the legal pages:

- **About and masthead:** who runs OOHWORKS and who the editors are.
- **Editorial standards and fact-checking:** how a Fact is checked, what a source must be, and that the charter applies.
- **Corrections policy:** what we correct and how fast (the corrections log exists).
- **Ownership and funding:** who owns the company, and how sponsorship is labelled.
- **Contact the newsroom:** for tips and corrections.

## 6. After publish: what happens automatically, and the contract it must pass

On Publish, in one job:

1. **Pages refresh:** the article, its pillar index, the newsroom front page, the home page, the tag and author pages.
2. **Sitemaps:** `sitemap.xml` and `news-sitemap.xml` get the article with its real `lastmod`. The news sitemap only lists the last 48 hours, as Google News requires.
3. **IndexNow** is pinged (exists today).
4. **WebSub:** the RSS and JSON feeds announce themselves to a WebSub hub (Google's PubSubHubbub), so Google and feed readers learn of the article in seconds rather than at the next crawl.
5. **The agent copy** is written (section 6.1).
6. **The social card** is generated (exists today).

### 6.1 Copies for AI agents

- **`/news/{slug}.md`** (and the same for every pillar): the article as clean Markdown. It contains title, date, authors, the short answer, the body, every Fact written as "value (source, date)", the sources list with URLs, and the canonical URL. Linked from the page with `<link rel="alternate" type="text/markdown">`.
- **`/llms.txt`:** what OOHWORKS is, and links to the newsroom, the charter, the newest articles (Markdown copies), the guides and the public API docs.
- **`/api/v1/articles`** in the public API, documented in the existing OpenAPI, for agents that prefer JSON. The MCP server stays on the roadmap; you decided not to show it yet.

### 6.2 The contract every published article is tested against

A Playwright test, run on every pull request and nightly against the live site, opens every published article and checks:

- status 200, server-rendered text, exactly one `<h1>`, no skipped heading levels;
- `<title>`, description, canonical and robots tag in the `<head>`; canonical on the right host;
- structured data parses, has every required Article field, and the dates are valid ISO dates;
- the short answer is present and under 60 words;
- every image has alt text and set dimensions (no layout shift);
- the Markdown copy exists and matches the title;
- the page is in the sitemap, and in the news sitemap if under 48 hours old;
- Largest Contentful Paint under 2.5 s on a phone, with Lighthouse SEO and accessibility at 100.

## 7. Two decisions that are bigger than one article

1. **The domain.** Everything above helps `oohworks.vercel.app`, which is temporary. When the newsroom moves to `oohworks.co`, every URL changes; old ones then need 301 redirects, and Search Console and Bing Webmaster need the new property. It is cheaper to move **before** the first real articles are published. `oohworks.co` currently shows a Ghost blog (`www` → `oohworks.ghost.io`). Is that blog staying, moving to a subdomain, or being replaced?
2. **AI crawlers.** Recommended:
   - **allow** the search and answer bots (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, Bingbot, Googlebot), because they cite and send readers;
   - **choose** for the training bots (GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended, Bytespider). Allowing them helps OOHWORKS become what models "know" about OOH; blocking them keeps the writing out of training data. Being cited by AI favours allowing them.

## 8. Decisions (24 Oct 2026)

| Question | Decision |
| --- | --- |
| Short answer field | **Yes** |
| Hard rules block Publish | **Advice only.** The readiness check warns; nothing new blocks Publish. The existing fact-check gate (every Fact ticked, piece marked fact-checked) stays as it is. |
| Markdown copies and `llms.txt` | **Yes** |
| AI training crawlers | **Allow** (search, answer and training bots alike) |
| Domain | **oohworks.co only.** The newsroom lives on `oohworks.co`; `oohworks.vercel.app` is temporary. |
| Publisher trust pages | **Later:** company details to come. Structured data links only pages that exist. |

The questions as they were put:

1. **Short answer** field (40–60 words) on News, Analysis and Explainer: yes?
2. **Hard rules block Publish** as listed in section 3: yes, or advise only?
3. **Markdown copies and `llms.txt`:** yes?
4. **Training bots:** allow all, block all, or allow some?
5. **Domain:** move the newsroom to `oohworks.co` before the first real articles? What happens to the Ghost blog?
6. **Publisher trust pages** (section 5): can you give me the company's legal name, registered address, owners and the editors' names?

## 9. Build order once approved

1. The readiness check (section 3) in the desk panel, the Short answer field, and the who-checked-it record. Each collection change ships with a migration.
2. Structured data completed (section 4.4), entities (4.2), raster logo.
3. Markdown copies, `llms.txt`, `/api/v1/articles`, the robots policy, WebSub.
4. The article contract test (6.2), run in CI and nightly against the live site.
5. Publisher trust pages, once the company details are in.

## 10. As built (24 Oct 2026)

- **CMS:** `shortAnswer` and a read-only `factCheck` record (by, at, user) on Articles and Guides; `wikidata` on Tags, People and Companies (migration `20261023_185130_article_discoverability`). The editorial hook records who moved a piece to Fact-checked and clears it if it goes back to Draft or review. A **readiness panel** heads the sidebar of every article and guide (`payload/admin/Readiness.tsx`, rules in `lib/editorial/readiness.ts`): advice only, as decided.
- **Page:** the short answer sits under the standfirst; "Fact-checked by … · date" under the byline.
- **Structured data:** `abstract`, `about` (places) and `mentions` (other tags) with Wikidata `sameAs`, `mainEntityOfPage` with `reviewedBy` and `lastReviewed`, `speakable` on news, images in three sizes; the publisher is a `NewsMediaOrganization` with a 512 px PNG logo, `publishingPrinciples` (the charter) and `correctionsPolicy`.
- **For agents:** `/{section}/{slug}.md` (middleware rewrite to `/api/md/…`, canonical link header, noindex), linked from each page as `rel="alternate" type="text/markdown"`; `/llms.txt`; `/api/v1/articles/` in the public API and its OpenAPI document.
- **Crawlers and discovery:** AI search, answer and training crawlers named and allowed in robots.txt; both feeds name the WebSub hub, which is pinged on publish alongside IndexNow; feeds use the short answer as the summary.
- **Tests:** `e2e/discoverability.e2e.ts`, including a contract every published piece must pass; `readiness.test.ts`.

Not built yet: the publisher trust pages (waiting on company details); the nightly run of the contract against the live site (needs the CI workflow, parked until a GitHub token can push workflow files); `INDEXNOW_KEY` is not set on Vercel, so the IndexNow ping is off there.
