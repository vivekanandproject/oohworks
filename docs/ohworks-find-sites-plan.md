# ohworks Find sites: plan

Date: 10 Oct 2026. Status: all three steps are built (sections 14, 15 and 16). What still waits on outside services is listed at the end of section 16. Builds on the strategy report (Product blueprint 2), `ohworks-architecture.md`, the design system's marketplace components and the search page that existed before.

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

## 12. Decisions taken (10 Oct 2026)

The founder chose the defaults:

1. Results layout: the list beside a sticky map. "List first" becomes the "Hide map" setting of the same page.
2. Inventory to build with: clearly labelled sample sites, with no photographs, until a real owner's sites can be loaded.
3. Buyer verification: a code sent by email, no account needed.
4. Shortlist, compare and plan: in step 2.
5. Map: a keyless open tile source for local development until a MapTiler key exists.

## 13. Wireframes

`docs/wireframes/find-sites.html` holds ten views. Open the file in a browser; the bar at the top switches view and width.

- Results: list beside a map, list first, all filters, quick view, few or no results.
- Site page: the full page, and the wording for every state that is not the happy path.
- Basket: compare, plan, and the enquiry in three screens.

## 14. What step 1 built (10 Oct 2026)

Step 1 of the build order is done: the catalogue, the full site page and the enquiry. The wireframes signed off were `r1` (list beside a map), `s1` and `s2` (site page and its states) and `e1` (enquiry).

### Pages

| Address | What it is |
| --- | --- |
| `/search/` | Results: search box, filter bar, all-filters panel, sort, cards, map, pages of twelve |
| `/in/{city}/{locality}/{format}-{road}-{unit id}/` | The site page. The unit id at the end finds the site; any other address for it redirects to this one |
| `/enquire/{unit id}/` | The enquiry form |
| `/enquire/confirm/?ref=` | Enter the emailed code |
| `/enquire/sent/?ref=` | Confirmation, naming the owner |
| `/how-results-are-ordered/` | The published ranking, linked beside the results |

### How it answers the ten questions

The card carries what, where, the photo or "No photo yet", price or "Price on request", availability, earned badges and the owner. The site page adds the gallery, key facts, a factual summary built from the listing's own fields, the calendar, the spec sheet in the system's order, location with the facing arrow, audience with its source, what the buyer supplies, the three enquiry steps, the owner card and similar sites nearby. A fact the owner has not given reads "Not provided yet · Ask the owner".

### Filters and addresses

- Place, format, size, price and dates sit in the bar. Static or digital, lighting and the five trust checks sit in "All filters".
- Every option shows how many sites it would give. An option that would give none is shown but is not a link.
- Each search has one address, with parameters in a fixed order. A filter form that leaves an empty or out-of-order parameter is redirected to the tidy address.
- Filters are links and plain forms, so they work without script. The all-filters panel is a page state (`?filters=1`).
- A price limit only counts sites that show a price. "Booked" sites drop out when the start date falls inside the booking.
- With three or fewer results the page suggests single changes, each with the number of sites it adds. With none it offers the follow form.

### The map

The page draws a still picture of where the sites sit relative to each other. The live map (MapLibre) loads only when someone asks for it, so it costs the page nothing. Its style comes from `MAP_STYLE_URL`; when that is empty it uses the keyless OpenFreeMap style, which is for local development.

### Data model and admin entry

Four collections under **Marketplace** and **Operations** in `/admin`:

| Collection | Holds |
| --- | --- |
| Owners | Name, city, contact email (staff only), phone, verified flag and date, median reply time |
| Sites | One record per face: format, size, lighting, location, facing, price mode and rate, terms, availability, audience with source, permit, dated photos |
| Enquiries | Reference, site, owner, buyer email, dates, brand, budget, artwork, message, status |
| Outbox | Emails that would have been sent, when no email service is configured |

Saving a site derives its title, address, size in millimetres, permanent unit id and completeness score. The save is refused if a rate is missing while the price is set to show, or if an audience figure has no source and date. Sites have drafts: only a published site appears.

### Enquiry

1. The buyer gives dates, brand and category, an optional budget, artwork status, an optional message and a work email.
2. A six-digit code goes to that email. It works for ten minutes and five tries. Only its hash is stored.
3. A right code sends the enquiry straight to the owner by email, with the buyer's address as the reply-to, and sends the buyer a copy.
4. The browser is then remembered for 30 days by a signed cookie, so the next enquiry from the same address needs no code.

Nothing reaches an owner from an unconfirmed address. Form posts from other sites are refused, a hidden trap field catches simple bots, and one address can start five enquiries an hour. Without `RESEND_API_KEY` every email is written to the Outbox instead. On a development server only, the confirm page also shows the code.

### Sample sites

`pnpm --filter @ohworks/web seed:sites` loads 5 sample owners and 37 sample sites across the six launch cities. Each is flagged as a sample: labelled on every card and page, with no photograph, never indexed and never in the sitemap. Roads and places are real; the sites, owners, permits and audience figures are not, and the audience source reads "Sample data". The script updates in place, so addresses stay the same between runs.

### What search engines see

Search, the enquiry pages and every sample are `noindex`; `/enquire/` is closed in robots. A real site page joins the index and the sitemap once it meets the content bar: a verified owner, a dated photo, coordinates and facing, size and lighting, and no unsourced audience figure. It then carries Product structured data with an Offer marked as a lease, and a price only when the page shows one.

### Checks

Unit tests cover the search state and its addresses, filtering, counts, ordering, the wording of each site state, the calendar and the enquiry codes. Browser tests cover the results page, every site-page state and the whole enquiry on desktop Chrome, Android Chrome and iPhone Safari, plus overflow checks from 320 to 1920 px. Lighthouse budgets run on the results page, a site page and the enquiry form.

### Not in step 1

- Shortlist, compare, plan, quick view, the clustered map synced with the list, and "search this area": built in step 2, section 15.
- One enquiry across several owners, the reply thread, exports, city and locality hubs and Claude query parsing: built in step 3, section 16. Typesense is not needed yet.
- A taken-down site answers 404 today. The true "gone" (410) answer with similar sites needs a middleware lookup and is deferred.
- Nearby landmarks with distances, and the street-level check, need a Google Maps key.
- "Campaigns that ran here" appears once case studies are linked to sites.
- The phone number is revealed on the page; it is not yet logged per buyer.

### To put real sites on it

1. Sign in at `/admin` as an admin or ops user.
2. Add the owner under Marketplace, Owners. Tick "Verified owner" only after the documents are checked.
3. Add each face under Marketplace, Sites, with real dated photographs, and publish it.
4. Set `RESEND_API_KEY` and `EMAIL_FROM` so enquiries are emailed, and `MAP_STYLE_URL` to a MapTiler style.
5. Remove the samples before launch: delete the sample sites, then the sample owners, in the admin.

## 15. What step 2 built (10 Oct 2026)

Step 2 of the build order is done: the basket and the live map. The wireframes were `r1` (card actions, clustered map), `rq` (quick view), `b1` (compare) and `b2` (shortlist and summary).

### Pages and controls

| Where | What was added |
| --- | --- |
| Every site card | Save on the photo, and Compare, Quick view and Enquire along the foot |
| Results page | A bar at the foot showing what is saved; the live map with counted clusters; "Search this area"; "Email me new sites for this search" |
| Site page | Save, Compare, Copy link and a link to the shortlist, beside the price |
| `/shortlist/` | Saved sites grouped by owner, with dates, an optional budget and a summary |
| `/compare/` | Two to four sites side by side, fact by fact |
| `/quick/{unit id}/` | The content of the quick view panel |

### Shortlist

- Save is a toggle on every card, in quick view and on the site page. The word changes from "Save" to "Saved" with the state.
- The shortlist is kept in the buyer's own browser, in a cookie of unit ids. Nothing about it is stored on the server, and nobody sees it until the buyer enquires or shares it. It holds up to 50 sites.
- The page groups sites by the owner who sells them, because each enquiry goes to one owner.
- The summary counts sites and owners and adds up the monthly prices that owners show. A "from" price makes the sum a floor, and the page says so. Sites with price on request are counted and named, never estimated.
- With dates, each row says "Free for your dates" or "Booked until", judged against the start date. With a budget, the summary says how far the shown prices sit under or over it.
- Each row's Enquire link carries the dates into the enquiry form.
- Sharing is a link, with buttons to copy it or send it by WhatsApp. The link carries the sites and the dates, never the budget. Whoever opens it sees "A shared shortlist" and can save the sites to their own.

### Compare

- Compare is a second toggle, limited to four sites. A fifth is refused with the reason.
- The table rows are: size, lighting, facing, audience with its source, price a month, minimum period, printing and mounting, availability, owner and reply time, what was checked, distance from the first site, and an Enquire button for each.
- A comparison can be shared as a link. On a phone the table scrolls sideways with its row labels held in place.

### Quick view

A side panel opened from a card or a map pin: photo area, title, badges, size, lighting, facing, audience, price, availability, owner, then Save, Compare, Open full page and the enquiry button. The list keeps its scroll position. The keyboard focus moves into the panel, stays there, and returns to the link that opened it. Without script the same link opens the full site page.

### Live map

- Nearby sites gather into a cluster showing their count. Pressing a cluster zooms in until it splits into pins.
- Pointing at a card lights its pin, or the cluster holding it. Pointing at a pin lights its card. Choosing a pin turns it orange, names the site with its price, and offers quick view. One pin is chosen at a time.
- After the buyer moves the map, "Search this area" searches what is in view. The area becomes the place: it replaces the city, appears as a "Map area" filter that can be removed, and lives in the address as `bbox`.
- Once a buyer asks for the live map, it stays on for their next searches in that tab. On a phone it can go full screen.
- If a browser cannot draw the map, the still drawing stays with a line saying so.

**A fault found in step 1 and fixed here.** The live map drew pins on an empty background: the map library could not load its worker file once bundled. The worker is now copied into `public/vendor/` before every dev run and build, and the map loads it from the site itself. The map also records what it reports, and the browser test now fails if the worker does not load.

### Saved searches

A search that has results now offers "Email me new sites for this search". It stores the email with the search's own address in the Follows collection, marked "Saved search". **The job that sends those emails is not built.** Until it is, the team reads the Follows list in the admin. The same is true of the older "tell me when the first sites are listed" form.

### How it works without script

Save, Compare, Remove and Clear are plain forms that post and return to the same page. Filters were already links and forms. Quick view falls back to the site page. Script only makes these faster: it updates the page in place, one change at a time so two quick presses cannot undo each other.

### What search engines see

`/shortlist/`, `/compare/` and `/quick/` are `noindex` and closed in robots. A search by map area is a filtered search, so it is already kept out.

### Checks

Unit tests cover the lists, the summary sums, the budget line and map-area search. Browser tests cover saving in place and without script, the shortlist with dates and budget, a shared shortlist, the four-site limit, the compare table, quick view with its focus handling, saved searches, and the live map: worker loading, clusters, list and map lighting each other, choosing a pin, and searching an area. Lighthouse budgets run on the shortlist and compare pages.

### Not in step 2

- One enquiry for the whole shortlist, split into one request per owner, with a reply thread: built in step 3, section 16.
- Exports: Excel, CSV and printable site sheets are built in step 3, section 16. Slides are not.
- A shortlist that follows a buyer across devices: needs sign-in.
- Plan names and several plans: not built; there is one shortlist per browser.
- Sending the saved-search emails: needs the email service and a scheduled job.
- A static map image with streets before the live map loads: needs a MapTiler key. The still drawing shows positions only.

## 16. What step 3 built (10 Oct 2026)

Step 3 of the build order is done: plans and reach. There were no wireframes for these screens; they follow the design system's templates and the screens already agreed.

### Pages

| Address | What it is |
| --- | --- |
| `/enquire/plan/` | One enquiry for a whole shortlist |
| `/reply/{reference}/?k=…` | The owner's reply page, opened from the link in their email |
| `/enquiries/{reference}/?k=…` | The buyer's page of replies, opened from the link in their email |
| `/shortlist/sheets/` | Site sheets laid out to print, one site to a page |
| `/api/export/shortlist/` | The shortlist as Excel, or CSV with `format=csv` |
| `/in/{city}/` | A city's hub |
| `/in/{city}/{area}/` and `/in/{city}/{format}/` | An area's hub, and a format's, such as `/in/bengaluru/hoardings/` |

### One enquiry, split per owner

- The shortlist has one main action: "Send enquiry to N owners". The form lists who gets what, with a tick box beside each site.
- The buyer fills in dates, brand and category, artwork status, an optional message and their email once. One code confirms the whole enquiry.
- It becomes one request per owner. **Each owner is told about their own sites only.** They never see the rest of the shortlist, the other owners, or the shared reference.
- **The buyer's budget is never sent** with a shortlist enquiry. A budget for a whole plan says nothing fair about one owner's sites, and passing it on would share the plan.
- Several sites belonging to one owner go as a single request to that owner.
- At most 25 owners can be reached in one go. A longer shortlist is sent in parts.

### The reply thread

- Each owner's email carries a link to a reply page. No account is needed: the link holds a signed key that opens that one request, as that owner, and nothing else.
- The owner answers each site as available, not available or free on other dates, can quote their own monthly rate, and can add a message.
- The reply is emailed straight to the buyer and kept on the thread.
- The buyer's confirmation email carries their own link. It shows every owner asked, who has replied, and a table of answers side by side: site, owner, availability and the rate quoted.
- The buyer can write back to one owner from that page. It goes to that owner alone.
- Both sides can still simply reply by email. Every email's reply-to is the other party, never ohworks.
- A quoted rate is the owner's own quote to that buyer. ohworks does not set it, change it or add to it, and the page says so.

**Keys.** An owner's key never opens the buyer's view and the reverse. A key for one enquiry opens no other. The pages are `noindex`, closed in robots, and send no referrer to other sites, so the address cannot leak through a link.

**Reply time.** An owner's first reply through the page is timed. Once an owner has five answered enquiries, their median reply time is worked out from them and stored, which is what earns "Replies in under a day". Below five the stored value is left alone, so one fast or slow answer neither earns nor costs a badge. Replies sent by plain email are not seen and so are not counted.

### Exports

- **Excel.** One site to a row under 34 fixed columns: identity, size in feet and millimetres, lighting, location with coordinates and facing, price mode and rate, terms, availability, audience with source and date, permit, owner and reply time, and the listing address. With a start date it adds a "Free on" column. A second sheet says what the figures are.
- **CSV.** The same table, for other tools.
- **Site sheets.** A page to print, or save as PDF from the browser's print window: one site to an A4 page with the photo area, price and terms, availability, badges, the factual summary and the spec sheet.
- A price the owner keeps private is a blank cell. A cell that begins like a formula is written as plain text, so an exported file can never run anything.
- Slides are not built. A PDF made on the server, without the print window, would need a headless browser in the container.

### City, area and format hubs

- A hub opens with a dated fact worked out from the listings: how many sites, from how many owners, the most common format, and the median shown rate when at least five real sites show one.
- Under it are chips by format and by area, then the same cards, map, shortlist and quick view as the results.
- Pages are real addresses, `/in/bengaluru/page/2/`, so each can be crawled. Page one has one address.
- **A hub is published only above its threshold of indexable sites:** 25 for a city or a format, 10 for an area. Below it the address answers "not found", and it is not in the sitemap. Samples are never indexable, so today every hub is below its threshold.
- A published hub is indexable, sits in the sitemap, and carries breadcrumb and item-list structured data. A site page's breadcrumb links to its hubs when they are open.
- Links to another hub are followed. Links narrower than a hub go into filtered search and are marked `nofollow`.

**Previews.** `HUB_PREVIEW=1` lets a local or test machine open hubs that are not yet published. A preview says so at the top, is `noindex`, has no structured data and is never in the sitemap. The setting is ignored on any site served over https. It is on in `.env.example` so the hubs can be seen and tested; do not set it in staging or production.

### Typed searches read by Claude

- When `ANTHROPIC_API_KEY` is set, a typed search that the built-in rules could not fully place is also read by Claude (`claude-haiku-5-5`, or `ANTHROPIC_MODEL`).
- Claude can only fill filters from this site's own lists: city, format, lighting, static or digital, size, price limits, dates and the trust checks. Each value is checked again on the server. A place name is kept only if the buyer typed those words.
- A filter the buyer set wins, then the built-in rules, then Claude. Whatever was understood is shown back as removable chips.
- It gives up after 2.5 seconds, remembers answers, and without a key the search works exactly as before.
- **This has not been run against the real service.** No key is configured here. It is covered by tests that stand in for the service, which check the request sent and the handling of answers, bad answers and failures.

### Checks

Unit tests cover hub thresholds and wording, the conversation keys, the reply-time sum, the form checks, the export table and its formula guard, and the Claude reading. Browser tests on three engines cover a shortlist enquiry to two owners from form to code to owner reply to the buyer's page and a follow-up, what each email does and does not contain, the keys, the exports, the site sheets in print, and the hubs with their "not found" answers.

### What still waits on something outside the code

| Waiting on | What it unlocks |
| --- | --- |
| An email service key (`RESEND_API_KEY`) | Real emails for codes, enquiries and replies; today they are written to the Outbox |
| A scheduled job, and the email service | Sending saved-search and "first sites listed" emails |
| Real owner inventory with photographs | Indexable site pages, and hubs that pass their thresholds |
| A MapTiler key | A map style licensed for production, and a street map image before the live map loads |
| A Google Maps key | Nearby landmarks with distances, and street-level checks |
| An Anthropic key | The Claude reading of typed searches, and a live check of it |
| Owner and buyer sign-in | An owner inbox, a shortlist across devices, agency workspaces |
| More inventory than a few thousand sites | A search index such as Typesense; `searchSites()` is the one place to change |

