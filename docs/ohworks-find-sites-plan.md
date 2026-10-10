# ohworks Find sites: plan

Date: 10 Oct 2026. Status: plan, awaiting decisions. Nothing here is built yet. Builds on the strategy report (Product blueprint 2), `ohworks-architecture.md`, the design system's marketplace components and the search page that exists today.

## 1. What this page must achieve

Find sites is where ohworks earns its place: a buyer arrives with a need and leaves having asked the right owner about the right site. It should work like a good shop: browse, filter, compare, see everything, then act. The difference from a shop is that ohworks never sells. The action is an enquiry that goes straight to the owner.

**The targets it serves** (Gate 1 in the strategy):

| Target | What Find sites contributes |
| --- | --- |
| 500 enquiries a month | Every results page and every site page makes asking a one-step act |
| Median owner reply under 24 hours | Enquiries arrive complete: dates, category, budget, so an owner can answer at once |
| 5,000 indexable faces | The same cards and site page power the indexable city and locality hubs |
| 300 verified owners | Verified, complete, fresh listings rank higher and look better, which is the owner's reason to enrich |

**The promise to a buyer:** decide in a minute, ask in one tap, and never need to enquire just to learn a basic fact.

## 2. Who uses it, and what each needs

| Audience | Arrives with | Needs from Find sites |
| --- | --- | --- |
| Small business, first-time advertiser | A place and a rough budget; fear that it is unaffordable | A "from" price on the card, photos, the exact spot, plain words, one-step enquiry |
| Agency or OOH specialist | A brief: city, formats, dates, budget, several sites | Precise filters, a map, compare, a shortlist that becomes a plan, one enquiry across many owners, exports |
| Digital planner new to OOH | Audience and spec questions | Audience with source and date, screen specs, a "programmatic via" flag |
| Media owner checking their own listing | Their site | To see it look complete and trustworthy, and know what is missing |

The strategy's research sets the bar: small businesses give up at contact forms and hidden prices; agencies wait about a week for proposals and want short, accurate site sheets; buyers in India face fake photos, double-sold sites and illegal sites. Find sites answers all three with visible facts, speed and verification.

## 3. The ten questions a buyer has before enquiring

The page is complete when a buyer can answer every one of these without contacting anyone. Where an owner has not supplied a fact, the page says so plainly and offers to ask. It never hides the gap.

| # | Question | Answered by | On the card | On the site page |
| --- | --- | --- | --- | --- |
| 1 | What is it? | Format, static or digital, size in feet and metres, lighting | Yes | Full spec sheet |
| 2 | Where exactly? | Road, landmark, locality, coordinates to five decimals, facing | Road and locality | Map, facing arrow, nearby landmarks |
| 3 | What does it look like? | Approach, day and night photos, each dated; GPS-stamped where taken in the app | Approach photo, photo count | Gallery |
| 4 | Who sees it? | Audience figure with its source, method and date, or "not provided" | No | Yes |
| 5 | What does it cost? | Exact rate, "from" price, or price on request; minimum period; printing and mounting | Price or "Price on request" | Price block with terms |
| 6 | When is it free? | Available now, or booked until a date; last confirmed date | Availability chip | Calendar |
| 7 | Who sells it? | The verified owner, by name, with reply time and other sites | Owner badge | Owner card |
| 8 | Is it legitimate? | Verified owner, verified location, permit on file with authority and expiry | Badges earned | Badges with what was checked and when |
| 9 | What must I supply? | Artwork size and file type, or spot and loop length for screens; lead time | No | Creative and booking details |
| 10 | What happens when I ask? | It goes straight to the owner; typical reply time; nothing is charged | Enquire button | Three-step explainer and the neutrality line |

## 4. The experience

### 4.1 Results page: the catalogue

**Layout.** Desktop: a filter bar across the top, then results in two columns beside a sticky map (list 7, map 5, the design system's rule). The map can be hidden for a three-column grid. Phone: list first, a 200 px map strip that opens full screen, a sticky "Filters · Sort" bar, filters in a bottom sheet.

**Search box.** Already understands a typed query and shows it back as removable chips. Add suggestions as you type: places, roads and landmarks, formats, owners, and recent searches.

**Filters, each with a live count of matching sites:**

| Group | Filters |
| --- | --- |
| Place | City, locality, road; near a landmark with a radius; "search this area" from the map |
| Site | Format; static or digital; size band or exact size; lighting; facing; environment (roadside, transit, retail, indoor) |
| Commercial | Price band a month; "price shown" only; available between two dates; minimum period |
| Audience | Weekly audience band, only for sites that give a sourced figure |
| Trust | Verified owner; verified location; permit on file; updated in the last 30 days; replies in under a day |
| Digital | Spot length, loop length, share of time; available programmatically, and through which exchange |
| Seller | A named owner |

The five used most (place, format, size, price, dates) sit in the bar. The rest open in an "All filters" panel. Every filter state lives in the address in a fixed order, so a search can be shared, bookmarked and restored with the back button.

**Sort.** Best match by default, then price low to high, newest, most recently confirmed, largest audience, and nearest when a place is set.

**The card** (the design system's ListingCard, extended): approach photo with its date and a photo count; format, size and road; locality, city, lighting and facing; only the badges the site has earned; price a month or "Price on request"; an availability chip; a shortlist toggle; a compare tick; Enquire. A missing photo shows the format icon and "No photo yet", never a blank box or a stock image.

**The map.** Clustered pins in the billboard-head shape. Hovering a card lights its pin and the reverse. One selected pin at a time. A static image first, the interactive map on first touch, so the page stays fast.

**Quick view.** A side panel from any card with the gallery, the key facts, price, availability and the owner, so a buyer can scan ten sites without losing their place in the list.

**When there is little or nothing.** Real sites only, never padding. Few results: show them, then suggest widening one filter at a time, with the count each change would give. None: the follow form that exists today, which emails the buyer when the first matching site is listed.

### 4.2 Site page: everything before the enquiry

The design system's ListingPage template, built in full:

1. Breadcrumb, then a title of format, size and road, then the badge row.
2. Gallery, 16:9, approach view first, each photo dated.
3. Key facts strip: size, lighting, facing, price, availability.
4. Left column: spec sheet in the system's fixed order, each value with its source; location with a map, facing arrow and nearby landmarks; audience with source, method and date; creative and booking details; permit; campaigns that ran here.
5. Right column, sticky: price block in one of three modes with terms and the date it was last updated; availability calendar with its legend and confirmation date; owner card with badges, reply time and their other sites; the Enquire button; the neutrality line.
6. "What happens when you enquire": three plain steps.
7. Similar sites nearby, then "Report a listing".
8. Phone: a bottom bar with the price on the left and Send enquiry on the right.

**States the page must handle honestly:** booked ("Booked until 14 Nov 2026 · see similar sites nearby"), stale ("Availability last confirmed 6 weeks ago. Ask the owner to confirm."), price hidden ("Price on request · most owners reply within a day"), a fact not supplied ("Not provided yet · ask the owner"), and removed (a real 410, never a silent redirect).

### 4.3 Shortlist, compare and plan: the basket

- **Shortlist.** A toggle on every card and site page. Kept in the browser without an account; kept across devices once signed in.
- **Compare.** Up to four sites side by side: photo, size, lighting, facing, audience with source, price, minimum period, production cost, availability, owner reply time, and the distance between them.
- **Plan.** The shortlist with dates and a budget. A summary bar shows the count, the owners involved and the total of shown prices. Share it by link or WhatsApp. Export a standard site sheet as PDF or Excel, which agencies can white-label later.

### 4.4 Enquiry: one step

One form for one site or a whole plan: dates, brand and category, an optional budget, a message, and a verified email or phone. A plan across several owners becomes one request per owner. The buyer sees a confirmation naming each owner and their typical reply time, then each reply in one thread. Contract, invoice and payment stay between buyer and owner.

## 5. Rules that keep it honest

These come from the charter and apply to every part of this page.

- The owner is named as the seller on every card and site page. ohworks never appears as one.
- The owner chooses how the price shows. A private price is "Price on request", never a penalty, though a "price shown" filter exists for buyers who want it.
- Every figure carries its source and date. An audience figure without a source is not shown at all.
- No invented urgency or scarcity: no countdowns, no "3 people are looking". Availability is the owner's calendar and its confirmation date.
- No star ratings or reviews. Trust comes from what was checked: the five badges and the reply time.
- Paid placement, when it exists, is labelled "Featured · paid placement", capped per page, and never mixed into best match.
- Sample or placeholder content is always labelled. Real photographs only.

## 6. How results are ordered

Best match is published, so owners know how to do well and buyers know it is not for sale:

1. How well the site matches the search and filters.
2. Completeness: the listing's quality score.
3. Freshness: availability or photos confirmed recently.
4. Verification: the badges earned.
5. Responsiveness: the owner's median reply time.
6. Distance, when a place is given.

A "How results are ordered" link beside the sort control explains this in plain words.

## 7. What search engines see

- The search page stays out of the index, as today. Filtered and sorted addresses are blocked in robots.
- The same cards, filters and map power the indexable hubs: `/in/bengaluru/`, `/in/bengaluru/koramangala/`, `/in/bengaluru/hoardings/`. A hub is published only above its inventory threshold and opens with a dated ohworks fact.
- Each site page is indexed once it meets the content bar, with Product or Place structured data and an Offer marked as a lease. A price is marked up only when the page shows one.
- Budgets hold: first text within 2.5 s, taps answered within 200 ms, no layout shift.

## 8. What must exist to build it

**Data.** None of this exists yet; today there are only country, city and locality tables. Needed: structure, face and slot; offers with price mode, rate and terms; dated photos; availability blocks; audience claims with sources; permits; verification records and badges; shortlists, plans, enquiries and messages. Recommendation: hold faces, offers and owners as CMS collections first, as the architecture allows, so the team can enter the first owners' sites by hand from day one, with the fast read queries in SQL.

**Search.** Start on Postgres with PostGIS for distance and trigram matching, behind one search interface. Move to Typesense when inventory or filter counts need it. The switch changes one module, not the page.

**Services and keys.** None is configured locally today.

| Need | Service | Without it |
| --- | --- | --- |
| Interactive map and static map images | MapTiler key | A keyless open tile source works for local development only |
| "Near a landmark", address lookup, street-level check | Google Maps Platform key | Place search limited to seeded cities, localities and roads |
| Enquiry emails to owners | Resend key | Enquiries are stored and visible in the admin, not emailed |
| Buyer verification | Clerk, or an emailed code of our own | An emailed code needs the email key too |
| Photo storage and resizing | Cloudflare R2 and Images | Photos stay on local disk |
| Typed-query understanding beyond the built-in rules | Anthropic API key | The current rule-based understanding continues |

**Inventory.** A page for finding billboards needs billboards. Two routes, not exclusive: load real sites from the first owners' media kits, which is the assisted onboarding the strategy describes; and, for building and testing only, seed clearly labelled sample sites with no photographs.

## 9. Build order

Each step ends in something you can open and judge.

1. **Catalogue and site page.** Data model and admin entry for owners, faces, offers, photos and availability. Results page with the filter bar, all-filters panel, counts, sort, cards and pagination. The full site page with a static map. Enquiry stored and shown to the team. Sample sites for testing.
2. **Map and basket.** Interactive clustered map synced with the list, "search this area", quick view, shortlist, compare, the plan bar, and follow alerts for saved searches.
3. **Plans and reach.** One enquiry split per owner with emails and a reply thread, exports, the indexable city and locality hubs on the same components, typed-query understanding through Claude, and Typesense if volume calls for it.

Before step 1, wireframes for the results page and the site page, opened locally, so the layout is agreed before code.

## 10. How we will know it works

| Measure | Why |
| --- | --- |
| Searches that reach a site page | The results are relevant |
| Site pages that lead to an enquiry | The page answers the ten questions |
| Enquiries per visit, and sites per enquiry | The plan and split are being used |
| Searches with no results | Where supply is missing; feeds owner outreach |
| Filters used, and the ones never used | What to keep in the bar |
| Share of listings showing a price, photos and an audience source | Listing quality, shown to owners as a nudge |
| Median owner reply time | The Gate 1 target |
| Speed and layout-shift budgets | Held in CI, as on the rest of the site |

## 11. Decisions needed

1. **Results layout.** List beside a sticky map, as recommended, or a list-first page with the map behind a toggle. Wireframes will show both.
2. **Inventory to build with.** Real sites from an owner you can introduce, labelled samples, or both.
3. **Buyer verification at enquiry.** An emailed code with no account, as recommended, or a full sign-in.
4. **Shortlist, compare and plan.** In the second step, as planned, or pulled into the first.
5. **Keys.** MapTiler first, since the map is the centre of this page. The others can follow.
