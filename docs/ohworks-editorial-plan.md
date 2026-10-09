# ohworks editorial platform: news, guides and data

Date: 9 Oct 2026. Status: plan, awaiting go. Builds on the strategy report (Product blueprint 1), `ohworks-architecture.md` (Payload, SEO rules), the design system (ArticlePage, ArticleCard, voice) and the landing page already shipped.

The editorial platform is the business's primary goal now, so it moves ahead of the marketplace in the build order. It is designed so the marketplace plugs into it later, not the other way round: every article can carry live listings the day they exist.

## 1. What "one of the best" means here, concretely

Most OOH trade titles are press-release feeds on slow, ad-cluttered pages with unsourced numbers. The bar to clear is not them; it is the best specialist publishers in any B2B niche (Stratechery, The Information, Digiday at its best, Sifted). Translated to ohworks, ten things make the difference, and each has a mechanism below:

1. **Every number is sourced and dated, by construction.** A figure cannot be published without a source record. Readers, the trade press and AI answer engines can quote ohworks safely.
2. **Original data nobody else has.** A quarterly price index and market reports computed from listings, published with method notes. This is what gets re-reported.
3. **Articles are wired to the real world.** A guide on Bengaluru costs embeds the live Bengaluru sites. A case study links to the faces the campaign ran on. A news piece about a regulation links to the locality hub it affects.
4. **Faster than any competitor.** Lighthouse 100, under 0.6 s to first text, zero layout shift, on a 680 px measure that reads like print.
5. **A newsletter people open.** The niche benchmark is 59% opens. Daily trade briefing and weekly buyer digest, composed from the CMS, not pasted.
6. **Named people with credentials.** Author pages with real bios, a verified contributor programme, and bylines on every piece. Expertise is visible, not claimed.
7. **Honesty as a feature.** Corrections are logged and shown. Sponsored content is labelled and never sits in news. Owner updates are a separate stream.
8. **Local terms, written by people.** "Hoarding" in India, "48-sheet" in the UK. No machine translation, ever.
9. **Design that respects the reader.** No pop-ups, no interstitials, no autoplay, no infinite scroll. Real pagination, a table of contents, reading time, and real photography with credits.
10. **Built for being cited.** Article and Person structured data, a news sitemap, RSS and JSON feeds, clean canonicals, and dated facts in the opening paragraph.

## 2. Content pillars and URL design

No generic "/blog". Pillars read as sections of a publication, each with its own index, feed and tone.

| Pillar | URL | Cadence | Reader | Notes |
| --- | --- | --- | --- | --- |
| News | `/news/{slug}/` | Daily | Owners, agencies | Contracts, people, regulation, launches. 300 to 600 words. Eligible for Top Stories once the publisher signals exist. |
| Analysis | `/analysis/{slug}/` | Weekly | Owners, agencies, investors | 900 to 1,500 words, bylined, with at least three sourced figures. |
| Guides | `/guides/{slug}/` | Evergreen, refreshed quarterly | Advertisers, first-time buyers | Cost guides by city and format, explainers, comparisons. Embed live listings. |
| Owner academy | `/academy/{slug}/` | Two a month | Media owners | Permits, leases, pricing, going digital, programmatic. |
| Data | `/data/{slug}/` | Quarterly | Trade, press, buyers | Price index, market reports, with charts, downloads and method notes. |
| Showcase | `/showcase/{slug}/` | Weekly | Everyone | Billboard of the week, campaign roundups; real, credited photography. |
| Authors | `/authors/{slug}/` | — | Everyone | Person page: bio, credentials, articles, contact. |
| Topics | `/topics/{slug}/` | — | Everyone | Tag hubs for places, formats, companies and themes. Indexed only above 5 articles. |
| Newsletter | `/newsletter/` | — | Everyone | Sign-up, archive of past issues, preferences. |

Rules carried over from the SEO architecture: every article is indexed; topic hubs follow the threshold rule; filtered or sorted views are never indexed; pagination is real links (`/news/page/2/`); the slug never changes after publish (a rename adds a 301); dates in URLs are avoided.

## 3. Content model (Payload collections)

| Collection | Key fields | Purpose |
| --- | --- | --- |
| `articles` | pillar, title, standfirst, body (Lexical), hero image with credit, authors[], tags[], places[], sources[], publishedAt, updatedAt, readingTime (computed), status, sponsor (optional), series, relatedFaces[], relatedHubs[] | One collection for news, analysis, showcase and academy; the pillar drives URL and template |
| `guides` | as articles, plus city, format, priceSnapshot (from data), listingQuery (area + format), lastRefreshedAt, tocEnabled | Evergreen buyer and owner guides with live listing strips |
| `reports` | title, period, body, charts[] (from price index), dataset download, method notes | The data pillar |
| `people` | name, slug, role, bio, credentials[], photo, links, verified (bool), email | Authors and verified contributors; emits Person JSON-LD |
| `companies` | name, slug, type (owner, agency, brand, vendor, authority), logo, links | Entities articles mention; later the same company can own listings |
| `tags` | name, slug, kind (place, format, company, theme), description | One taxonomy shared with the marketplace |
| `sources` | title, publisher, url, publishedOn, retrievedOn, type (report, filing, interview, ohworks data), notes | The citation registry; a Fact block must point at one |
| `issues` | kind (daily, weekly), subject, blocks[], sentAt, stats | Newsletter issues composed from articles |
| `corrections` | article, note, correctedAt | Shown on the article and on a public corrections page |
| `media` | file, alt, credit, licence, takenAt, place | Images on R2 through Cloudflare Images; alt and credit required |

Roles: editor (publish), writer (draft and submit), contributor (draft only, verified badge on the person), ops (media and tags), admin.

Workflow states: draft → in review → fact-checked → scheduled → published → updated. Fact-check is a required state: an editor ticks every Fact block against its source before publish. Versions and preview links are Payload's own.

### Rich text blocks (Lexical)

These blocks are what make the content different from a page of paragraphs:

- **Fact.** A number, its unit, a source record and a date. Renders inline as "₹ 78,000 a month, ohworks data, Oct 2026" with the source in a hover and in the sources list. Cannot be saved without a source.
- **Listing strip.** "Sites in this area": a face ID list or an area plus format query. Renders ListingCards from live data; renders nothing if empty, never placeholders.
- **Price chart.** A series from the price index by city and format. Rendered server-side as SVG with the chart tokens; interactive on hover without a chart library.
- **Map.** A static map of the places mentioned, interactive on tap.
- **Figure.** Image with required alt, credit and licence. Night shots get the lit-tint glow the design system allows.
- **Quote.** Attributed, with the person's role; links to a Person when one exists.
- **Comparison table.** Format or city comparison, every cell a Fact or plain text.
- **Callout.** For the charter line, a definition, or a warning (lit-tint).
- **Timeline.** Regulation and contract histories.
- **Glossary term.** Inline definition that also builds the glossary page.

## 4. Page templates

**Article page** (`ArticlePage` from the design system). Eyebrow with pillar and place, display-lg title, body-lg standfirst, author card with credentials and date, reading time, a sticky table of contents on desktop for pieces over 900 words, the body at 680 px with Fact blocks and strips, a "Sources" section listing every source record with publisher and date, a corrections note if any, "Related" by shared tags, and the share row (copy link, email, X, LinkedIn, WhatsApp). Sponsored pieces carry the lit-tint band above the title. No comments at launch.

**Index pages** (news, analysis, guides, academy, data, showcase). An opening line that states what the section is, then ArticleCards in a two-column list, filter chips for place and format, and numbered pagination. The first page of News also shows "This week in OOH", the latest daily briefing.

**Author page.** Person header with photo, role and credentials, a short bio, and their articles. Verified contributors show the Verified badge with what was checked.

**Topic page.** The tag's description as a dated opening fact where data exists ("Bengaluru has 42 listed hoardings, ohworks, Oct 2026"), then articles, then, when the marketplace exists, the hub link.

**Newsletter page.** What you get, sample issues, sign-up with double opt-in, preference centre for daily and weekly, and the archive.

**Home page.** The hidden "From the newsroom" section switches on with the first three articles; a "This week in OOH" strip goes above the fold under the search once the briefing runs.

## 5. SEO and distribution for editorial

- **Structured data.** `NewsArticle` for news, `Article` for the rest, `Person` for authors, `Organization` as publisher with logo, `BreadcrumbList`, and `ImageObject` with credit. Dates are `datePublished` and `dateModified`, kept honest: `dateModified` only moves on a real content change.
- **Sitemaps.** `sitemap-articles.xml` (all), `sitemap-news.xml` (Google News format, articles from the last 48 hours), both in the sitemap index. IndexNow on every publish and update.
- **Feeds.** RSS and JSON Feed per pillar and site-wide. Feeds are how aggregators, Feedly readers and some AI systems pick ohworks up.
- **Social cards.** Open Graph and Twitter cards with a generated 1200×630 image per article: title in Archivo on paper, the mark, the pillar and the date. Generated at publish and stored on R2.
- **Canonical and syndication.** Self-canonical always. If a piece is syndicated elsewhere, the partner carries the canonical back to ohworks.
- **Top Stories readiness.** Clear bylines, dates, an About page, a corrections page, a contact page, and a masthead. These are the publisher signals Google looks for.
- **AI answer engines.** The first paragraph of every analysis and guide states the key fact with its date. Feeds and the sources section make the piece easy to quote and attribute.
- **Internal links.** Every article links to at least one topic page and, where one exists, one hub or storefront. Guides link to the glossary. The glossary links back.
- **Performance.** Server-rendered and cached, revalidated on publish. Images through Cloudflare Images with fixed dimensions. No third-party scripts in the article body. Budget unchanged: LCP under 2.5 s, CLS under 0.1, first-load JS under 120 kB.

## 6. Newsletter

- **Daily trade briefing.** Composed in the CMS each morning from the day's published news plus three external links with one-line summaries; sent at 08:00 local. Subject lines are plain: "Bengaluru's auction rules, two contracts, one hire".
- **Weekly buyer digest.** Guides refreshed this week, a cost figure of the week, and, once listings exist, new sites by followed city and format.
- **Mechanics.** Resend broadcasts with double opt-in, one-click unsubscribe, a preference centre, open and click tracking per issue stored in `issues`. Templates follow the design system's newsletter rule: single column 600 px, navy header, sans only.
- **Growth loops.** Sign-up in the article footer and on index pages, never a pop-up. Every daily issue ends with "forward this to one person who buys OOH".
- **Target.** 50% or better open rate by month three, measured per issue.

## 7. Editorial operations

- **Style guide** lives in the CMS as a page editors see while writing: the voice rules, number and unit formats, local terms, banned words.
- **Fact-check gate.** No article reaches "scheduled" until an editor has ticked every Fact block. The CMS shows the count of unticked facts.
- **Corrections policy.** Public page; each correction logged with date and what changed. Trust is the product.
- **Sponsored content.** Labelled "Sponsored by X" in the lit-tint band, excluded from the News pillar and from the news sitemap, `sponsored` rel on outbound links.
- **Owner updates.** Owner-authored posts live in a separate stream on the owner's storefront, never in the newsroom.
- **Contributor programme.** Verified contributors get a Person page with the Verified badge once identity and credentials are checked. Columns are bylined and edited.
- **Launch content.** From the strategy: ten news pieces, one analysis and one showcase a week from launch; twenty owner academy guides; the glossary; cost guides per launch city once each has 20 real listings; the first price index when a quarter of priced listings exists.

## 8. Build plan (6 weeks, 2 to 3 engineers plus 1 editor)

| Week | Build | Exit check |
| --- | --- | --- |
| 1 | Payload in the app on Postgres; collections, roles, workflow states; Lexical with the Fact, Figure, Quote, Callout blocks; media to R2 via Cloudflare Images; tag and source seeds | An editor drafts, fact-checks and publishes a news piece in the admin on staging |
| 2 | Article page, index pages with pagination, author and topic pages; ArticleCard in the design system; JSON-LD, canonicals, sitemaps, news sitemap, RSS and JSON feeds, OG image generation; IndexNow on publish | Lighthouse 100 on an article; Rich Results test passes; feeds validate |
| 3 | Listing strip, price chart, map, comparison, timeline and glossary blocks; glossary page; corrections flow; sponsored labelling; Typesense search across articles | A guide renders with a live strip (fixture data), a chart and a sourced table |
| 4 | Newsletter: double opt-in, preference centre, issue composer, daily and weekly templates, send through Resend, stats back into the CMS | A test list receives a daily briefing composed from the CMS |
| 5 | Editorial ops: preview links, scheduling, versions, embargo, style guide page, fact-check counter, PostHog events, Search Console import per URL, Top Stories publisher pages (About, Masthead, Corrections, Contact) | The editor runs a full week of content on staging without engineering help |
| 6 | Launch content loaded; home page newsroom section and "This week in OOH" strip on; production go-live; monitoring | First ten pieces live, first daily briefing sent, Search Console shows the news sitemap |

Marketplace work (M1 data layer onwards) starts in parallel from week 3, so the listing strips move from fixtures to real data in the following phase.

## 9. KPIs from day one

| Metric | Why | First target |
| --- | --- | --- |
| Newsletter subscribers and open rate | The audience we own | 1,000 subscribers, 50% opens by month three |
| Articles published per week | Cadence is credibility | 10 news, 1 analysis, 1 showcase |
| Organic impressions and clicks per article (Search Console) | Whether the pages earn search | 40% of articles earning impressions within 30 days |
| Pieces re-reported by other titles | The data strategy working | First price index picked up by two trade titles |
| Enquiries originating on a guide | Editorial feeding the marketplace | Tracked from the first live strip |
| Corrections per 100 articles | Honesty, visible | Published, whatever the number |

## 10. Decisions needed before week 1

1. Pillar names: News, Analysis, Guides, Owner academy, Data, Showcase. Any to rename or drop?
2. Comments: none at launch (recommended) or a moderated thread per article?
3. Newsletter sender name and domain, for example "ohworks briefing" from news.ohworks.com.
4. The first editor: in-house or a contracted trade journalist for India.
5. Whether the price index launches with partial data labelled as such, or waits for a full quarter.
