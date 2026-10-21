# OOHWORKS Design System

Source of truth: https://claude.ai/artifact/3tDxnSkArm2nu7sEWMhzxb · Day theme only · 9 Oct 2026

---

# Brand book

OOHWORKS is the open map of out-of-home advertising: a verified, public page for every billboard and screen in the world, where the media owner is always the seller. This system makes every surface feel like a trustworthy registry with the warmth of a real street. Build from it as follows.

## The five qualities, and how the system carries them

| Quality | What it means on screen | Where it lives |
| --- | --- | --- |
| Easy to access | One hand, one glance, any language. 44px tap targets, 15px minimum body, Hindi and Arabic set in the same superfamily, RTL mirrored layouts. | `body`, `space-*`, `sans` family, Button, Input |
| Visibility | A site is a physical thing you can see. Real photos lead every card, the exact spot sits on a map, and specs read like a survey sheet. | ListingCard, SpecSheet, MapPin, `data` styles |
| Empathy | The platform never makes an owner feel small or a buyer feel foolish. Prices can be "on request" without shame; every empty state says what to do next; errors explain and never scold. | Voice section, Badge, EmptyState, Toast |
| Emotion | The one accent, `survey`, is the colour of a surveyor's flag: it marks the place that matters. Night photos glow in `lit-tint`. The display face has character; the UI face stays calm. | `survey`, `lit`, `display` family, photography rules |
| Tech | Data looks like data. Coordinates, IDs, prices and dimensions are set in `mono` with tabular numerals; badges state what was checked and when. | `mono` family, `data-*` styles, Badge, SpecSheet |

## Content fundamentals

- Write in plain Indian English first; other editions follow the same rules in their language. Short sentences, active voice, specific nouns. "Front-lit 20 × 10 ft hoarding facing north-bound traffic", never "premium high-visibility outdoor asset".
- Use "you" for the person and "we" for OOHWORKS. Owners are "media owners" or "owners"; never "vendors" in the interface. Buyers are "advertisers" or "agencies". Never "users".
- Sentence case everywhere, including buttons and headings. Uppercase only in the `label` style.
- Every number carries its unit, its source and its date: "₹ 85,000 / month · owner rate · updated 3 Oct 2026". A figure with no source is not shown.
- Buttons name the outcome: "Send enquiry", "Mark as booked", "Verify location". Never "Submit", "OK" or "Click here".
- Prices show in the market's currency with its own grouping: ₹ 1,25,000 in India, AED 12,500 in the Gulf, $4,000 in the US. The currency symbol or code sits before the figure with a thin space.
- No emoji in the interface or in editorial. Icons come from the Icons group.
- The charter is quoted, never paraphrased, wherever neutrality is stated: "We never sell media or take a media margin."

## Visual foundations

### Colour
- Set `paper` on every page body and `ink` on text. `paper-raised` is for cards and inputs, `paper-sunken` for maps, tables heads and ID blocks.
- `navy` is the brand ink: primary buttons, the wordmark on light grounds, the storefront header band. Text on it is `on-navy`.
- `survey` is the only accent and it means "here": map pins, the enquiry button, the selected face, the dot in the mark. One survey element per view. It is a fill colour: never set text under 24px in it; small accent text uses `survey-text`.
- Semantic colours mean one thing each and always travel with a word or icon: `verified` (checked), `lit` (fresh, illuminated, pending), `critical` (error, removed), `booked` (taken, and not a problem). Never tell states apart by hue alone.
- One theme only: Day. There is no theme switch and no dark mode. Night photography is shown on `paper` with a `lit-tint` glow, never on a dark page.

### Type
- One family, Poppins (since 19 Oct 2026, the founder's choice), for titles and all interface and body text: titles at 600 and 700, text at 400, emphasis at 500 and 600. It is geometric and wide, so titles sit at open line heights and capitals take slightly less tracking. Poppins also draws Devanagari, so a Hindi edition stays in the same family.
- Served by `next/font` from the site itself (no Google Fonts request at run time): `Poppins:wght@400;500;600;700` and `IBM Plex Mono:wght@400;500`. IBM Plex Sans Arabic stays the fallback for an Arabic edition.
- `mono` (IBM Plex Mono) for anything measured or identified: coordinates, unit IDs, permit numbers, dimensions, prices, timestamps. Always `font-variant-numeric: tabular-nums`.
- Body measure stays between 60 and 70 characters. Headings use `text-wrap: balance`.
- Minimum sizes: 15px body, 13px small. Nothing smaller is read on a phone in sunlight.

### Spacing, radius, borders
- Everything sits on the 4px grid in `space-*`. Cards pad `space-4` on phones and `space-5` on desktop.
- Borders carry structure: a 1px `hairline` on every card, input and table. Shadows (`shadow-float`, `shadow-modal`) only lift menus, popovers and modals off the page.
- Radii: `radius-xs` for badges and chips (the registry feel), `radius-sm` for controls, `radius-md` for cards and photos, `radius-pill` for filters and pins.

### Imagery
- Every listing leads with a real photo of the face in its street. Shoot three: the approach view from the road at driver height, a day close view, and a night view. Approach first on cards.
- No stock images, no renders presented as photos, no artwork mocked onto faces without the "example creative" label.
- Photos are 3:2 on cards and 16:9 as listing heroes, cropped from the centre, never stretched. Placeholder for a missing photo is `paper-sunken` with the format icon and the words "No photo yet", never a grey box alone.
- Editorial imagery may be bolder: full-bleed night shots, anamorphic campaigns, aerials. Still real, still credited.

### Motion
- Fast and quiet: 120ms for hover and focus, 200ms for menus and toasts, 320ms for a map panning to a pin, all with `cubic-bezier(0.2, 0.8, 0.2, 1)`. Nothing bounces, nothing loops. Honour `prefers-reduced-motion` with instant changes.

### States and focus
- Every control shows a 2px solid `focus` ring offset 2px. It meets 3:1 on every surface.
- Hover darkens a navy fill to `navy-700` and tints a card border to `hairline-strong`. Disabled controls drop to 50% opacity and keep their label.
- Loading states keep layout: skeleton blocks in `paper-sunken` at the final size.

### Layout
- Page gutter `space-4` on phones, `space-10` on desktop. Content column maximum 1200px; article column maximum 680px.
- Listing and hub pages are two columns on desktop (content 7, map or summary 5) and one column on phones with the map collapsed to a 200px strip that expands on tap.
- RTL editions mirror the layout; icons that point (chevrons, arrows) flip, icons that depict (a hoarding, a bus shelter) do not.

## Iconography

Icons are the Icons asset group: single-ink SVGs on a 24px grid with a 1.75px stroke, round caps and joins, drawn as outlines. Two families: formats (hoarding, unipole, gantry, bus shelter, LED screen, transit) and states (verified check, permit, fresh, responsive, pin). Set them at 20px inline with text and 24px in cards, coloured through `currentColor` of the surrounding text. Never scale below 16px; never fill them.

## Components

Use the components exactly as their previews and guidelines describe. The marketplace set is ListingCard, SpecSheet, PriceBlock, Badge, MapPin, EnquiryForm, AvailabilityCalendar and OwnerCard; the interface set is Button, Input, Chip, Tabs, Table, Toast and EmptyState; the editorial set is ArticleCard and NavBar. Screen templates (ListingPage, HubPage, OwnerStorefront, OwnerDashboard, ArticlePage) show how they compose. Each component states what the consumer provides.


---

# Brand identity

OOHWORKS is written in capitals, one word, always: OOH for out-of-home, then WORKS (the founder's decision, 19 Oct 2026; it replaced "ohworks"). The web address is oohworks.co. Never "ohworks", "OOHworks" or "Oohworks".

## Purpose

To make every piece of out-of-home inventory in the world findable, verifiable and bookable directly from its owner.

## Values the design must show

1. **Open.** Nothing is hidden behind a login that a buyer needs to decide. Public pages, public specs, public verification.
2. **Owner-first.** The owner is always the seller of record. Their name, their price, their photo sits on every page about their site.
3. **Exact.** Dimensions in feet and metres, coordinates to five decimals, dates on every figure. The brand is a survey sheet, not a brochure.
4. **Warm.** Streets are alive. Photography, local language and night light keep the registry from feeling cold.
5. **Neutral.** No agency services, no media margin, no favourite owner. The design never ranks by who pays, and anything paid is labelled.

## The mark

The mark is a map pin whose head is a billboard face: a rounded rectangle (`radius-xs` corners) on a short post, with a `survey` dot at its centre. It says "a sign at a place". Use `ohworks-mark.svg` from the Logos group; never redraw it.

- Clear space: the height of the post on all sides.
- Minimum size: 20px on screen, 12mm in print. On a hoarding, 600mm.
- The mark is `navy` on paper and `on-navy` on a navy band or a photo; the dot is always `survey`.
- The wordmark is the name OOHWORKS alone, in Poppins 700, in capitals; the mark does not sit beside it (the founder's decision, 19 Oct 2026). On a phone the name scales with the screen (at most 22px, 4.6% of the width) and stays visible at every width. The mark is kept for physical site plates only; there is no favicon, and the share cards carry the name alone (the founder, 21 Oct 2026).
- Co-branding with an owner: owner logo left, a `hairline` divider, OOHWORKS wordmark right, both at the same cap height.
- On physical hoardings and site plates, use the mark alone with the unit ID in `mono` beneath it: this is how a buyer finds the page from the street.

## Tagline

"Every billboard, findable." Secondary lines, for campaigns: "The open map of out-of-home." and "Where OOH works."

## What the brand never does

- Never uses a gradient, a drop shadow on type, or a 3D effect.
- Never shows a billboard without saying where it is.
- Never uses stock photography.
- Never implies OOHWORKS runs campaigns or sells media.
- Never uses red and green as the only difference between two states.


---

# Voice and microcopy

OOHWORKS talks like a knowledgeable surveyor who likes people: precise, plain, never cold.

## Principles

- **Say the thing.** "This site is booked until 14 Nov 2026." Not "This inventory is currently unavailable."
- **Respect both sides.** An owner who keeps a price private gets "Price on request", never "No price listed". A buyer who has never bought OOH gets "Most hoardings in Bengaluru rent by the month" before any form.
- **Explain, then help.** Errors state what happened and the next step. "We couldn't find a site at these coordinates. Drag the pin to the face, or paste a Google Maps link."
- **Show the source.** Every figure: "4.2 lakh weekly impressions · RoadStar, Sep 2026".
- **No hype.** Never "premium", "iconic", "unmissable", "game-changing". The photo and the numbers do that work.

## Patterns

| Situation | Copy |
| --- | --- |
| Primary call to action on a listing | **Send enquiry** · helper: "Goes straight to Lakshmi Ads. OOHWORKS never sells media." |
| Price shown | `₹ 85,000 / month` · "owner rate · 3-month minimum" |
| Price hidden | "Price on request" · "Ask the owner; most reply within a day." |
| Verified owner badge | "Verified owner" · tooltip: "Company registration and contact checked on 2 Oct 2026." |
| Permit on file | "Permit on file" · tooltip: "BBMP licence 2026/AD/1182, valid to Mar 2027." |
| Fresh badge | "Updated 3 days ago" |
| Responsive badge | "Replies in under a day" |
| Stale listing | "Availability last confirmed 6 weeks ago. Ask the owner to confirm." |
| Booked | "Booked until 14 Nov 2026 · see similar sites nearby" |
| Empty search | "No sites match yet. Try a wider area, or follow Koramangala to hear when one is listed." |
| Empty owner dashboard | "Your storefront is live. Add your first site from a photo, a spreadsheet or your media kit; we'll do the typing." |
| Enquiry sent (toast) | "Sent to Lakshmi Ads. You'll get their reply here and by email." |
| Enquiry failed | "Your enquiry didn't send. Check your connection and try again; nothing was lost." |
| Report a listing | "Something wrong with this listing?" · "Tell us what you saw. We check every report within two working days." |
| Buyer verification | "Confirm it's you" · "A code is on its way to +91 98··· ··312. Owners only see verified enquiries." |
| Featured label | "Featured · paid placement" |
| Neutrality line in footer | "OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients." |

## Numbers and units

- Dimensions: "20 × 10 ft (6.1 × 3.0 m)" in India and the US; metres first in the UK, Gulf and Europe.
- Coordinates: five decimals, comma, space: "12.93421, 77.62156".
- Dates: "3 Oct 2026" in text; ISO "2026-10-03" in data cells.
- Large Indian numbers: lakh and crore in text ("₹ 1.2 lakh"), full figures in data ("₹ 1,20,000").
- Times: "replies in under a day", never "24h SLA".

## Localisation

- Hindi and Arabic editions translate meaning, not words. "Hoarding" stays "होर्डिंग" because that is what owners say.
- Keep unit IDs, permit numbers and coordinates in Latin digits in every language.
- Arabic edition mirrors layout; numbers stay left-to-right inside right-to-left text.


---

# Screens and templates

Five templates compose the components. Each is a live preview in the Components view (marked `page`); this section records the rules behind them.

## Listing page (`ListingPage`)

The page for one physical face. Its job: let a buyer decide in a minute and ask in one tap.

1. Breadcrumb in `small`: India › Bengaluru › Koramangala.
2. Title in `display-md`: format, size, road. Under it the badge row.
3. Hero gallery, 16:9, approach photo first; day and night thumbnails; photo dates in `data-sm`.
4. Two columns on desktop: left the SpecSheet, audience with source, static map, "campaigns that ran here"; right a sticky panel with PriceBlock, availability summary, OwnerCard and the EnquiryForm trigger. On phones the panel becomes a bottom bar: price left, "Send enquiry" right.
5. "Similar sites nearby" as ListingCards, then "Report a listing" in `small`.
6. The only `survey` fill on the page is the enquiry button and the map pin.

## Hub page (`HubPage`)

City, locality or format browse page. Opens with a dated fact in `body-lg` ("Koramangala has 42 listed hoardings. Median 20 × 10 ft rate ₹ 78,000 a month, OOHWORKS data, Oct 2026."), then filters as Chips, then a two-column grid of ListingCards beside a sticky map with clustered MapPins. Pagination is real links. The cost guide for the place links from the fact.

## Owner storefront (`OwnerStorefront`)

A free mini-site for an owner. A `navy` header band with the owner's name in `display-lg` in `on-navy`, their badges, cities covered and reply time; below, their sites as ListingCards and an "About" column. The owner's WhatsApp and phone show as selectable text with copy buttons.

## Owner dashboard (`OwnerDashboard`)

Operated, not read. Top row: four stat tiles in `data-lg` (views, enquiries, replies due, occupancy) each with a 30-day sparkline in `chart-1`. Then the leads inbox as a Table with a status Chip per row and a reply drawer. Sites list with Fresh and Permit badges and an "Update availability" quick action. Everything overdue carries the `lit` colour and the word "due".

## Article page (`ArticlePage`)

Editorial. Title in `display-lg`, standfirst in `body-lg`, author card with credentials, dated sources at the end. Guides embed live ListingCards in a "Sites in this area" strip. Measure 680px. Sponsored pieces carry a `lit-tint` band reading "Sponsored by …" above the title.

## Responsive rules

- Breakpoints: 640px (phone to tablet), 1024px (tablet to desktop).
- Map on phones: a 200px strip that expands full-screen on tap, with a "List" toggle.
- Sticky elements never cover more than 25% of a phone screen.
- Tap targets 44 × 44px minimum.

## Exports

- PDF site sheet: A4, one face per page, the same SpecSheet fields, photo top, map bottom, owner and OOHWORKS marks in the footer with the page URL.
- Newsletter: single column 600px, `sans` only, `navy` header, ListingCards rendered as table rows.


---

# Tokens

## Colour (Day)

| Token | Value | Usage |
| --- | --- | --- |
| `paper` | `#f6f5f2` | Page background. Every page sets it on body. |
| `paper-raised` | `#ffffff` | Cards, panels, inputs, dropdowns. Sits on paper with a hairline border, never a shadow. |
| `paper-sunken` | `#ecebe6` | Map canvas, table header rows, code and ID blocks, image placeholders. |
| `ink` | `#101c30` | Headings and body copy on paper, paper-raised and paper-sunken (14.6:1). |
| `ink-muted` | `#56606f` | Captions, labels, metadata, placeholder text on paper and paper-raised (5.9:1). |
| `ink-faint` | `#767f8d` | Disabled text and decorative numerals on paper and paper-raised (4.6:1). Not for information people must read. |
| `hairline` | `#d9d8d2` | Borders on cards, inputs, tables and dividers. The only line weight: 1px. |
| `hairline-strong` | `#aeb3bb` | Borders that carry meaning: input borders, selected tab underline base, control outlines (3:1 on paper). |
| `navy` | `#101c30` | The brand ink. Primary buttons, the wordmark on light grounds, the storefront header band. Pair with on-navy. |
| `navy-700` | `#1d3a66` | Hover state of navy fills, links on paper (8.6:1), map route lines. |
| `navy-200` | `#c9d6ea` | Selected rows, chip backgrounds, map pin halo. Ink reads on it. |
| `on-navy` | `#f6f5f2` | Text and icons on navy and navy-700 (13.9:1). |
| `survey` | `#e8561f` | The accent: map pins, the enquiry button, the active face in a diagram, the dot in the mark. Fills and graphics only, never text under 24px (3.4:1 on paper); small accent text uses survey-text. |
| `survey-text` | `#a83a0c` | Small accent text and links on paper (6.4:1). Price callouts, 'Enquire' text links. |
| `survey-tint` | `#fbe6dc` | Background of the enquiry panel, the featured-listing ribbon, hover of a map pin's halo. Ink and survey-text read on it. |
| `on-survey` | `#ffffff` | Text on a survey fill: 4.7:1 at 15px/600 or larger, so button labels on survey stay at least that size and weight. |
| `verified` | `#1c7a4c` | Verified owner, verified location and permit badges; success toasts; 'available' in the calendar. Always paired with the check icon or the word, never hue alone. |
| `verified-tint` | `#dcf2e6` | Background of verified badges and available calendar days. |
| `lit` | `#8a5d00` | The Fresh badge, 'illuminated' and 'digital' facts, warning toasts, pending states. Named for a lit billboard face. Text-safe (5.6:1 on paper). |
| `lit-tint` | `#fbeccb` | Background of Fresh and warning badges; glow behind night photos. |
| `critical` | `#b4321c` | Errors, removed or unpermitted listings, dismantled faces, destructive actions. Differs from verified by lightness as well as hue. |
| `critical-tint` | `#f9e0db` | Background of error banners and critical badges. |
| `booked` | `#56606f` | Booked calendar days and the 'booked until' chip. Deliberately neutral: a booked site is not a problem. |
| `focus` | `#1d3a66` | The 2px solid focus ring on every control, offset 2px, 3:1 on every surface. |
| `map-water` | `#d6e4ef` | Water on the static map tiles. |
| `map-road` | `#ffffff` | Roads on the static map tiles; major roads use hairline-strong. |
| `chart-1` | `#1d3a66` | First data series in price index and dashboard charts. |
| `chart-2` | `#e8561f` | Second series, or the one the title is about. |
| `chart-3` | `#8a5d00` | Third series. |
| `chart-muted` | `#aeb3bb` | Comparison and context series, gridlines at 40% opacity. |

## Type families

- `display`: "Poppins", system-ui, sans-serif
- `sans`: "Poppins", "IBM Plex Sans Arabic", system-ui, sans-serif
- `mono`: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace

## Type styles

| Style | Family | Size | Line height | Weight | Usage |
| --- | --- | --- | --- | --- | --- |
| `display-xl` | display | 64px (34 to 52px on phones) | 1.04 | 700 | Homepage and campaign heroes only. One per page. |
| `display-lg` | display | 44px (28 to 32px on phones) | 1.08 | 700 | Hub page titles, article titles, owner storefront names. |
| `display-md` | display | 30px (24px on phones) | 1.16 | 600 | Listing page title, section titles inside long pages, dashboard page titles. |
| `display-sm` | display | 22px (20px on phones) | 1.25 | 600 | Card titles, modal titles, subsection headings. |
| `body-lg` | sans | 18px | 28px | 400 | Article body copy and guide intros. Measure 60–70 characters. |
| `body` | sans | 15px | 23px | 400 | Default UI text, descriptions, table cells, form help. |
| `body-strong` | sans | 15px | 23px | 600 | Button labels, emphasised values, table header cells. |
| `title` | sans | 16px | 22px | 600 | The title of a card or a row: a site, a piece, an owner. |
| `small` | sans | 13px | 19px | 400 | Metadata, captions, badge labels, timestamps. Never below 13px. |
| `label` | sans | 12px | 16px | 600 | Uppercase eyebrow labels above values and section groups. Always uppercase with this tracking. |
| `data-lg` | mono | 28px | 32px | 500 | Prices on listing pages, headline figures on dashboards. Tabular numerals. |
| `price` | mono | 18px | 24px | 500 | A price on a card, a row or a bar. Tabular numerals. |
| `data` | mono | 14px | 20px | 400 | Coordinates, unit IDs, permit numbers, dimensions in spec sheets, chart axis labels. |
| `data-sm` | mono | 12px | 16px | 400 | Timestamps in tables, map coordinates under pins, code samples. |

## Spacing

A 4px grid. Components use steps 1–6; page layout uses 8–16. Never a value off the grid.

| Token | Value | Usage |
| --- | --- | --- |
| `space-1` | `4px` | Gap between an icon and its label; badge inner padding (vertical). |
| `space-2` | `8px` | Gap between chips, inline controls; badge inner padding (horizontal); table cell vertical padding. |
| `space-3` | `12px` | Input and button inner padding (vertical 10px, horizontal 12px); gap inside a form row. |
| `space-4` | `16px` | Card padding on phones; gap between stacked fields; page gutter on phones. |
| `space-5` | `20px` | Card padding on desktop; gap between cards in a grid. |
| `space-6` | `24px` | Section padding inside panels; gap between a heading and its content. |
| `space-8` | `32px` | Gap between page sections on phones. |
| `space-10` | `40px` | Page gutter on desktop. |
| `space-12` | `48px` | Gap between page sections on desktop. |
| `space-16` | `64px` | Space above and below a hero or a hub's map. |

## Radius

Square where things are precise, round where they are touched.

| Token | Value | Usage |
| --- | --- | --- |
| `radius-xs` | `2px` | Badges, chips, table cells with a fill, map pin label boxes. The registry feel. |
| `radius-sm` | `6px` | Buttons, inputs, selects, toasts. |
| `radius-md` | `12px` | Cards, photos, panels, modals. |
| `radius-pill` | `999px` | Filter chips, avatars, the Responsive badge timer, map pin heads. |

## Shadow

Borders carry structure; shadows only lift something off the page (menus, the map pin card, a dragged item).

| Token | Value | Usage |
| --- | --- | --- |
| `shadow-float` | `0 8px 24px rgba(16, 28, 48, 0.14)` | Dropdown menus, map pin popovers, toasts. |
| `shadow-modal` | `0 24px 64px rgba(16, 28, 48, 0.24)` | Modals and the enquiry drawer. |

## Motion

120ms hover and focus · 200ms menus and toasts · 320ms map pan · easing cubic-bezier(0.2, 0.8, 0.2, 1). Nothing bounces; honour prefers-reduced-motion.

---

# Assets

# Logos

The mark is a map pin whose head is a billboard face with a survey dot. Use the files as they are; never redraw.

- `ohworks-mark.svg`: navy mark with survey dot, for light grounds (`paper`, `paper-raised`).
- `ohworks-mark-on-dark.svg`: paper mark with a lighter survey dot, for the `navy` storefront band and dark photographs.
- `ohworks-wordmark.svg` and `ohworks-wordmark-on-dark.svg`: horizontal lock-up. The name is live text in Poppins 700; embed the font or convert to outlines before print.
- Clear space equals the post height (14 units on the 64 grid). Minimum 20px on screen.


# Icons

Single-ink outlines on a 24px grid, 1.75px stroke, round caps and joins. The ink in the files is `#101c30` (`navy`); when a picture must read on a dark ground, use the `on-dark` logo rule and set the icon's colour through the surrounding text where you inline it. Formats: hoarding, unipole, gantry, bus-shelter, led-screen, transit. States: verified, permit, fresh, responsive, pin, enquiry. Use at 20px inline and 24px in cards; never below 16px; never filled.


---

# Components

# ArticleCard

Editorial lists: a square thumbnail, an `eyebrow` for the pillar and place, a `display-sm` title and a `small` meta line with author, date and reading time.

- Pillars: News, Analysis, Price index, Guide, Showcase, Owner academy. Sponsored pieces add "Sponsored" to the eyebrow.
- The consumer provides pillar, place, title, author, date, reading time, thumbnail and URL.

# ArticlePage

Screen template. The rules behind it are in the Screens section of the brand book; the preview shows the components composed with real example content.

# AvailabilityCalendar

Month view of one face. Free days are `verified-tint`, booked days `paper-sunken` with a strike, holds `lit-tint`. A legend always accompanies it: the colours alone never carry the meaning.

- The header shows when the owner last confirmed availability. Older than 30 days: a `lit` note "Ask the owner to confirm".
- Owners edit by dragging a range; buyers only read.
- The consumer provides the month, day states, the confirmation date and, for owners, the edit handler.

# Badge

Badges state what OOHWORKS checked and when. Each kind means one thing and always carries its word and, for the five verification badges, its icon.

| Kind | Meaning | Colour |
| --- | --- | --- |
| `verified` | Verified owner: company documents and contact checked | `verified` on `verified-tint` |
| `permit` | Permit on file: number, authority and expiry recorded | `verified` on `verified-tint` |
| `fresh` | Availability or photos updated in the last 30 days | `lit` on `lit-tint` |
| `responsive` | Owner's median reply under 24 hours | `ink` on `navy-200` |
| `booked` | Taken, with the date it frees up | `booked` on `paper-sunken` |
| `critical` | Expired, removed or reported | `critical` on `critical-tint` |
| `featured` | Paid placement, always with the words "paid placement" | `survey-text` on `survey-tint` |
| `neutral` | Facts: format, digital specs, environment | `ink-muted` on `paper-sunken` |

- A tooltip or the SpecSheet gives the check date and the reference ("BBMP licence 2026/AD/1182").
- Never invent a badge. New states are added here first.
- The consumer provides the kind and the text; the icon comes from the Icons group.

# Button

A button names the outcome it causes. Use the `accent` (survey) button for exactly one action per view: on a listing page that action is "Send enquiry".

- `primary` (navy) for the main step in forms and dashboards: "Save changes", "Mark as booked".
- `accent` (survey) for the buyer's one move toward an owner. Never two on one screen.
- `secondary` for exports, filters and alternatives; `ghost` for cancel and inline actions; `danger` for destructive ones, always followed by an in-page confirmation step.
- Minimum height 44px (`sm` 36px, for cards and table rows only). Labels in sentence case, `body-strong`.
- The consumer provides the label and the handler. Icons are optional and sit left of the label at 20px.
- Never: "Submit", "OK", "Click here", all caps, or a button that opens a browser dialog.

# Chip

Filter chips on hub and search pages. A pressed chip fills `navy`; counts sit in `mono` and update as filters combine.

- Use `aria-pressed`. Chips are buttons, never links; the URL updates with the fixed facet order the SEO rules set.
- Group related chips in one row that wraps; never more than two rows before a "More filters" drawer.
- The consumer provides the label, the optional count and the pressed state.

# EmptyState

Every empty view says what would fill it and offers the next step. Dashed `hairline-strong` border, the relevant format or state icon, a `display-sm` title, one sentence and one or two buttons.

- Owner dashboard: "Your storefront is live. Add your first site from a photo, a spreadsheet or your media kit; we'll do the typing."
- The consumer provides icon, title, sentence and actions.

# EnquiryForm

The drawer that opens from PriceBlock or from a plan. It asks only what an owner needs to quote: dates, brand and category, optional budget, a message, and a verified phone.

- Title names the site. The neutrality line sits under it.
- Dates default to the next month start and a 3-month flight; digital faces default to 4 weeks.
- A plan with several owners becomes one form and several requests; the summary lists the owners it will reach.
- On submit: a `success` Toast "Sent to Lakshmi Ads"; on failure, an `error` Toast that says nothing was lost.
- The consumer provides site or plan, defaults, the verification step and the submit handler.

# HubPage

Screen template. The rules behind it are in the Screens section of the brand book; the preview shows the components composed with real example content.

# Input

Inputs look like a form on a survey sheet: a plain box, a strong border, a label that says what goes in and help that says why.

- Label above, in 14px/600. Help text below in `small`, `ink-muted`. An error replaces the help, in `critical`, and says the fix.
- Use `.data` for anything measured or identified (dimensions, coordinates, IDs, prices): it switches to `mono` with tabular numerals.
- Units go in an affix (`oh-input-group`), never inside the value.
- Every control has a stable `id` and a `<label for>`. Placeholders are examples, never instructions.
- The consumer provides label, value, help, and error text. Validation runs on blur, not on every keystroke.

# ListingCard

One card per physical face. The photo comes first because a site is something you can see; the facts come next because a buyer is comparing.

- Photo: approach view, 3:2, with its date in `small`. Missing photo: `paper-sunken`, the format icon and "No photo yet", never a blank box.
- Title in 16px/600: format, size, road. Meta in `small`: locality, city, lighting, facing.
- Badge row shows only badges the site has earned. A featured listing carries the ribbon on the photo and the words "paid placement".
- Price in `mono` with the period in `small`; "Price on request" in the same slot when hidden. The `accent` small button reads "Enquire".
- The consumer provides: title, meta, photo URL and date, badges, price or null, the enquiry handler, and the page URL for the whole card.
- Cards sit in a grid of `minmax(280px, 1fr)` with `space-5` gaps.

# ListingPage

Screen template. The rules behind it are in the Screens section of the brand book; the preview shows the components composed with real example content.

# MapPin

The pin's head is a billboard face, like the mark. The selected or hovered pin is `survey`; every other pin is `navy` (`quiet`); groups collapse to a `cluster` with a count in `mono`.

- One survey pin at a time. Selecting a pin pans the map over 320ms and opens its label: price and size, or the title when the price is hidden.
- Clusters split on zoom; never show more than 60 individual pins.
- The map is a static image on first load; the interactive map loads on tap or scroll.
- The consumer provides pins with coordinates, state and label, and the selection handler.

# NavBar

The wordmark left, four destinations, then sign-in and the owner call to action. The same bar on every page; country and language sit in the footer, not the bar.

- On phones the four links collapse behind a "Menu" button; "List your sites" stays visible.
- The consumer provides the active destination and the signed-in state.

# OwnerCard

The owner is the seller of record, so their card sits on every listing page and in every enquiry thread.

- Avatar is the owner's logo, or their initial in `display` on `navy` when none is uploaded.
- Name in `body-strong`; one line of facts in `small`: role, site count and cities, member since.
- Badges the owner has earned. Contact details are revealed on tap and shown as selectable text with a copy action; never a `tel:` link alone.
- The consumer provides: name, logo URL or initial, facts line, badges, masked contact, reveal handler, storefront URL.

# OwnerDashboard

Screen template. The rules behind it are in the Screens section of the brand book; the preview shows the components composed with real example content.

# OwnerStorefront

Screen template. The rules behind it are in the Screens section of the brand book; the preview shows the components composed with real example content.

# PriceBlock

The sticky panel on a listing page. Three display modes the owner chooses: exact rate, a "from" rate, or price on request. All three look equally finished.

- Amount in `data-lg`, period in `body` muted. Terms in `small`: minimum period, production costs, the date the rate was updated.
- The `accent` button is the page's one survey fill. Its label changes with the mode: "Send enquiry" or "Ask for a quote".
- The neutrality line names the owner and quotes the charter. It is not optional.
- On phones the block collapses to a bottom bar: amount left, button right.
- The consumer provides mode, amount, currency, period, terms, update date, owner name and the handler.

# SpecSheet

A grid of facts about one face, laid out like a survey sheet. Keys in `label`, values in `data`, sources in `small` under the value.

- Always in this order: format, size, lighting, facing, coordinates, height, audience, permit, unit ID, last verified. Digital faces add resolution, spot and loop length, slots and exchanges after lighting.
- A value without a source is not shown; "Audience: not measured" is an honest row.
- Both unit systems on size: the market's first, the other in the source line.
- The consumer provides the key-value-source rows; the component never computes or converts.

# StatTile

The top row of the owner dashboard. Figure in `data-lg`, label in `eyebrow`, a 30-day sparkline in `chart-1` where there is a series.

- Anything overdue uses `lit` and the word "due"; nothing else on the dashboard uses that colour.
- Four tiles maximum in a row; they wrap to two on phones.
- The consumer provides label, value, optional series and optional note.

# Table

Dense, bordered, with uppercase `label` headers on `paper-sunken`. Dates, IDs and money use `td.data` for `mono` and tabular numerals.

- A status column uses Badge, never coloured text.
- Rows are 40px tall; the selected row fills `navy-200`.
- On phones the table scrolls inside its own container; the first column stays visible.
- The consumer provides columns and rows; sorting and pagination are real links or buttons, never infinite scroll on indexable pages.

# Tabs

Underline tabs for sections of one object (a listing, an owner, a dashboard). The selected tab carries a 2px `navy` underline and `ink` text; others are `ink-muted`.

- Tabs never hide the enquiry panel or the price.
- Deep-link each tab with a plain `#anchor`.
- The consumer provides labels and the selected index.

# Toast

A short confirmation or problem, bottom-left on desktop and bottom-centre on phones, that leaves on its own after 6 seconds unless it is an error.

- Title says what happened; the second line says what next. Errors never apologise and never blame.
- Kinds: `success` (verified dot), `warning` (lit dot), `error` (critical dot). The word carries the meaning; the dot only helps.
- The consumer provides kind, title, detail and an optional action.
