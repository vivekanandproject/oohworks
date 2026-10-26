# OOHWORKS goes global: plan

Date: 27 Oct 2026. Status: phases 1 to 3 built (section 8); phases 4 and 5 next. Builds on the inventory of India-only code (27 Oct 2026, summarised in section 7) and the founder's decisions below.

## 1. What the founder decided

| Question | Decision |
| --- | --- |
| Where can owners list? | Any city in the world, picked with the worldwide place search the company form already uses. A city gets its own page at the same bar as today: 25 verified sites. |
| Prices | Each site's rate is stored in the currency its owner sets, defaulting to the owner's country. It is shown as set, with a small dated approximate in the visitor's currency beside it ("₹ 85,000 / month · ≈ AED 3,750"). The owner's figure is the price; the approximate one only helps compare. |
| Number words | Lakh and crore in India only; thousands and millions everywhere else. |
| The visitor's country | Detected on the first visit (Cloudflare's `cf-ipcountry`), changeable in a switcher in the header beside Sign in (inside the menu on a phone). Every country is offered, those with listed sites first. |
| What the country changes | Currency of the approximate figure and of the price filter, time zone of dates and times, the content shown first (sites and pieces from that country), and the sites recommended. |

## 2. Rules that keep it honest and findable

- **One page, one content, for every visitor and every search engine.** An indexable page (a site, a city page, an article) never changes its main content by country; that would be cloaking. The country changes only small parts that are drawn in the browser: the approximate price, the "Sites in your country" strip, the switcher's label. Search engines see the owner's price and the page's own country.
- **The site's own place decides its facts.** A site in Dubai shows AED, Dubai time for "today" and its availability, and metres first; a visitor in London sees the same page, plus "≈ GBP …".
- **Never a converted price as the price.** The approximate figure is labelled as approximate, carries its rate date and source, and is never stored, emailed to an owner or used in an enquiry.
- **Addresses stay put.** `/in/bengaluru/…` keeps working; a site in Dubai lives at `/ae/dubai/…`. City slugs are made once, from the place's English name, and never change.

## 3. Phases

### Phase 1: the data (the base for everything else)

- `city` becomes open text on sites, site versions and owners (migration from the six-value enums to text, data kept), with `cityLabel`, `placeId`, `region` and `timeZone` beside it; `country` stays the ISO code (lower case, as in the address).
- `currency` (ISO 4217) on sites, enquiry budgets and owner quotes; existing rows become INR.
- A world list of countries with currency, main time zone, number style and default size unit, in code (`lib/world/countries.ts`), so nothing depends on a service to know that the UAE uses AED.
- The site's time zone from its coordinates (an offline lookup), falling back to the country's main zone.
- Migrations generated and committed with each change; payload types regenerated.

### Phase 2: owners anywhere

- The site form's City becomes the place search (any city); the map opens on the owner's city; the India-only pin check becomes "is this pin within the city you chose".
- A currency choice beside the rate, defaulting to the owner's country; the ₹ affix follows it.
- Spreadsheet and media kit: City is any place name, matched through the place search; a Currency column; the kit reader asks for currency and reads millions as well as lakh.
- Company documents: GSTIN when the company is in India, a registration or trade licence number elsewhere, with wording to match.
- Dates in imports read in the owner's country's order.

### Phase 3: the visitor's country

- Middleware sets an `oh_country` cookie from `cf-ipcountry` on the first visit; the header switcher (every country, searchable, those with sites first) changes it.
- Formatting by country: `Intl.NumberFormat` with the currency, lakh and crore only for India, dates in the chosen time zone.
- Exchange rates: a daily job stores rates with their date and source; the approximate figure is drawn in the browser from them.
- Search: the default scope is the visitor's country when it has sites, otherwise everywhere; the price filter works in one currency, the visitor's by default; medians and totals are per currency.
- City pages, sitemaps and the public API for any country (`price: { amount, currency }`, with `monthlyInr` kept, marked deprecated).

### Phase 4: content and recommendations

- Home: "Sites in your country" (newest verified sites there, or the nearest country with sites), drawn in the browser so the page stays cached and the same for search engines.
- Example searches and hints by country (Dubai: "LED screens on Sheikh Zayed Road"), from a short list per country with a world default.
- Newsroom: pieces tagged with the visitor's country first in "Latest"; the place tags become a world list.
- Search understanding: currencies and "k / million" in typed briefs; Claude's reading takes any city and returns a currency.

### Phase 5: proof

- Fixtures with sites in Dubai, London and New York beside the Indian ones; every test that pins `/in/`, ₹ or lakh checks the right thing per country.
- A test per rule in section 2: the same page for two countries' visitors, the approximate figure labelled and dated, a Dubai site in AED and Dubai time.

## 4. Order and size

| Phase | Depends on | Days |
| --- | --- | --- |
| 1. Data | nothing | 2 |
| 2. Owners anywhere | 1 | 2 |
| 3. Visitor's country | 1 | 3 |
| 4. Content and recommendations | 3 | 2 |
| 5. Proof | runs alongside each | (in each) |

Each phase lands as its own commit with the suite green, and production is deployed by a `v*` tag only when the checks on main pass.

## 5. Open items for the founder

- Exchange-rate source: a free daily source with attribution (for example ExchangeRate-API's open endpoint) is enough for an approximate figure; a paid one only if the figure is ever used for more.
- Which countries get example searches and hints first (Phase 4); the world default covers the rest.

## 6. What does not change

- The owner is always the seller, and the price is always theirs.
- The URL of every existing page.
- Free for buyers, no commission.

## 7. Where India is assumed today (inventory, 27 Oct 2026)

- **Data:** `city` is a six-value Postgres enum on sites, site versions and owners; `country` defaults to "in"; `rate`, enquiry `budget` and message `quote` are rupees with no currency column; `gstin` is the only registration field.
- **City list:** three copies (`CITIES` in `lib/sites/taxonomy.ts`, `CITY_OPTIONS` in `lib/search-parse.ts`, the fixtures' `City` type); `launchCity()` maps a place to the six; the site form, spreadsheet, media-kit reader, filters, facets, hubs (`readHub` refuses any country but "in"), sitemaps, API v1 `/cities/` and the OpenAPI enums all take it from there.
- **Hard-coded `/in/`:** `hubPath`, `readHub("in", …)` in queries, the IndexNow and "your site is live" links in `payload/hooks/sites.ts`.
- **Money:** `inr()`, `lakh()`, `en-IN` grouping, ₹ affixes, "In rupees" labels, the export's `#,##,##0`, JSON-LD `priceCurrency: "INR"`, API `monthlyInr`; the price filter, sort, median and shortlist totals add raw rates.
- **Search:** the fixed rules know the six cities, feet, ₹ and lakh/crore only; Claude's schema has the six cities and rupees.
- **Validation that blocks other countries today:** a pin outside India's bounding box is refused; a city outside the six is refused; the spreadsheet dropdown lists the six.
- **Time:** `indiaDate()` (Asia/Kolkata) is "today" in 21 files; `formatDate` uses India time; imports read dates day-first.
- **Phone:** defaults to IN when the visitor's country is unknown; `countryOf()` already reads `cf-ipcountry`.

## 8. What is built (27 Oct 2026)

**Phase 1, the data (150b538).** City is open text on sites, site versions and owners (migration `global_places_currency`), with `cityLabel`, `region`, `placeId` and `timeZone`; currency on sites, enquiry budgets and owner quotes. `lib/world` holds every country with its currency, main zone, number style and size unit; `money()` and `countWords()`; an offline zone lookup (`lib/world/zone.ts`, server only).

**Phase 2, owners anywhere (4389a82).** The site form's City is the worldwide place search, with a Currency choice; the checks place any city, keep a launch city's address, and test the pin against the chosen city (150 km). The spreadsheet has Country and Currency columns and still reads the older template in rupees. The media-kit reader takes country, currency and millions. Short dates follow the owner's country. GSTIN is the word only in India.

**Phase 3, the visitor's country (this commit).**

- Every price is in its site's own currency; totals are kept per currency and never added across them; a budget is compared only in its own currency; enquiry budgets and owner quotes carry the site's currency; audience figures use the site country's words; JSON-LD names the site's currency.
- Search knows a country (`country=ae`, or `country=all` for every country) and a currency (`cur=`, sent only when someone chose it). The price filter, the price sort and the median work within one currency. The Place filter offers the launch cities first and then every city that has sites, each with its country. A launch city's search keeps its old address.
- The visitor's country: the middleware remembers Cloudflare's `cf-ipcountry` in the `oh_country` cookie (listed on the cookies page); the header's globe switcher (beside Sign in, inside Menu on phones) changes it, with every country offered and those with sites first. Search starts in the visitor's country when it has sites, says so with a link to every country, and tells a visitor whose country has none that it shows every country. Where a search names no country, prices are filtered in the visitor's currency.
- The approximate price: `/api/rates/` takes ExchangeRate-API's daily rates (cached a day); a small browser part shows "≈ AED 3,750" under a price in another currency, with the rate's date and source, and nothing when the currencies match or no rate is known. It is never stored, sent to an owner or used in an enquiry.
- City pages for any country: `/ae/dubai/` once a city has 25 verified sites; the title and fact name the city as its listings do; the sitemap lists every published city; IndexNow and the "your site is live" email use the site's country.
- A site's own today: its availability calendar, the enquiry form's earliest date and the owner's page for it turn over at midnight where the site stands (`dateIn`).
- The public API gives `price.monthly` with `price.currency`; `monthlyInr` stays for rupee sites and is marked deprecated.

**Left for later:** the enquiry form's server check of the start date still uses India's day; owner-side "today" outside a site page (imports, forms) is still India's; the switcher needs JavaScript (a page without it keeps the detected country).
