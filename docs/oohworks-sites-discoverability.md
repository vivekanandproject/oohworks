# Sites and owner onboarding: ready for search engines, Bing, answer engines and AI agents

Date: 24 Oct 2026. Status: built. Asked for on 24 Oct 2026: "the onboarding has to be again AI agent friendly, AEO, SEO and Bing … make sure it is 100% implemented". Follows the same decisions as the article work (`oohworks-article-discoverability-plan.md`): advice only in the CMS, AI crawlers allowed, oohworks.co as the one domain.

## 1. One content bar everywhere

A site page goes to search engines only when it is real (not a sample, not taken down), has at least one photo, a verified owner, exact coordinates, the direction it faces, its size and lighting, and any audience figure carries its source and date (`indexChecks()` in `lib/sites/view.ts`).

The same function now decides three things that could disagree before:

| Where | Before | Now |
| --- | --- | --- |
| The page's robots tag | The full bar | The full bar |
| The sitemap | Only "has a photo and a verified owner" | The full bar, so the sitemap never offers a page that says noindex |
| The admin | Nothing | The "Will this site go to Google?" panel lists each check, and what to fix |

## 2. The site page

- **Social cards:** `og:title`, `og:description`, `og:image` (the first photo) and a large Twitter card; `max-image-preview:large` when indexed.
- **Structured data:** typed as both `Product` (something you can lease) and `Place` (a point on the map). It includes:
  - `geo` with the coordinates to five decimals;
  - a `PostalAddress` (road, locality, city, country);
  - `containedInPlace`, the city;
  - `additionalProperty` for format, size in mm, lighting, facing, landmark, audience (with source and date) and permit;
  - an `Offer`, only when a price is shown, with the monthly unit price, `availability` (`InStock`, or `PreOrder` with `availabilityStarts` when booked) and the owner as `seller` with their page.

  A `BreadcrumbList` matches the visible breadcrumb.
- **Markdown copy for AI agents:** the page address with `.md` for the closing slash (`/in/{city}/{locality}/{slug}.md`), linked from the page as `rel="alternate" type="text/markdown"`. It holds:
  - every fact with units, sources and dates;
  - the checks the site has passed;
  - photo addresses;
  - the enquiry link.

  It never includes the owner's contact details. Only sites that meet the content bar have one; it carries a canonical link back to the page and `noindex`.

## 3. Publishing tells search engines

When a live site changes, goes live or is taken down, the IndexNow ping (Bing, Yandex, Naver, Seznam) carries the site page, its city page and the home page (`lib/indexnow.ts`, used by both the site and editorial hooks). `INDEXNOW_KEY` is set in Vercel production since 24 Oct 2026. Google learns from the sitemap, which now lists each site's photos as image entries.

## 4. Owner onboarding

- **One source of truth:** `lib/owners/guide.ts` holds the short answer, the five steps and nine questions owners ask. It describes only what the product does today. The For owners page used to promise WhatsApp enquiries, an app with GPS photos, buyer sign-in and "Pro free for a year"; it no longer does.
- **/for-owners/:**
  - a "How to list your sites, in short" answer (56 words);
  - the five steps;
  - "Questions owners ask", with `FAQPage` structured data, which Bing and AI answer engines read;
  - a social card;
  - a link to the Markdown guide.
- **/list-your-sites/:** a social card, the Markdown alternate, and links to the questions and the guide.
- **Markdown guide** at `/for-owners.md` and `/list-your-sites.md`. Written for owners and the AI assistants helping them, it includes:
  - the steps and where each happens;
  - the template address;
  - every spreadsheet column with whether it is needed, what goes in it, the allowed values and an example, generated from the template's own column list so the two never disagree;
  - the questions and answers.

  It says plainly that the owner confirms the emailed code themselves.
- **llms.txt** now has a section for owners and their assistants (guide, start page, template) and one for sites (find sites, open city pages, the sites API, and how to get a site's Markdown copy).

## 5. Bing and Google ownership

`GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` become the `google-site-verification` and `msvalidate.01` meta tags when set, so either console can confirm ownership by tag. They are read at build time, so a redeploy follows setting them. In Bing Webmaster Tools the quicker path is "Import from Google Search Console" once Google is verified.

## 6. Tests

- `e2e/sites-discoverability.e2e.ts` makes one real, verified site in Chennai, checks its page, structured data, Markdown copy and sitemap entry, checks the onboarding pages and guides, then removes the site.
- `src/lib/sites/indexing.test.ts` covers the content bar and the guide.

## 7. Waiting on you

- The verification codes from Google Search Console and Bing Webmaster Tools, for the production domain (`oohworks.co`), once the site moves there.
- The domain move itself, which replaces the Ghost blog's DNS records.
- Photo storage (Cloudflare R2): without it, uploaded photos are lost on Vercel, and no site can meet the content bar there.
