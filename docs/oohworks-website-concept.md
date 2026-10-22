# OOHWORKS website concept: the landing page and the site around it

Date: 23 Oct 2026. Status: direction approved 23 Oct 2026 with the decisions in section 10. Landing page built 23 Oct 2026 (section 12 lists where the build differs from this plan). Builds on the strategy report (9 Oct 2026), the landing page SEO contract (`ohworks-landing-page.md`), the design system and the product roadmap. Where this proposal changes an earlier decision, it says so.

## 1. The idea in one paragraph

OOHWORKS should feel like the most advanced company in out-of-home without ever saying so. Visitors should work it out for themselves from what the site does in front of them. You type a brief in plain words and the page shows how it read it. An owner drops in a PDF media kit and gets draft listings back. A photograph is checked before it is trusted. Every number names its source. The words "AI-powered", "revolutionary" and "world's first" never appear. The product shows its intelligence instead. Companies that claim leadership in a headline sound like everyone else; companies that are visibly ahead get believed.

## 2. What "the best" means here

Five tests every page must pass:

1. **One promise in five seconds.** A visitor knows what OOHWORKS is and what to do next before they scroll.
2. **Show the product working, not a picture of it.** The hero is a live tool, not an illustration.
3. **Every claim carries proof.** A source and date on every number; a real photo or a real map, never a stock image or a render.
4. **Each visitor finds their own path.** Owner, agency, brand, digital planner and trade reader each get their own "how it works" in under two clicks.
5. **Empty is honest and still persuasive.** While cities are opening, the page says so plainly and turns the wait into a reason to act now (section 5).

What it must never do (from the charter and design system): claim to sell media, show an unsourced figure, use stock photos, invent counts or testimonials, hide paid placement, or use more than one accent (`survey`) element per view.

## 3. How we signal "AI-first" indirectly

Each signal is a real feature the visitor can see or try. Most already exist in the code; the rest are on the roadmap.

| Signal on the page | What the visitor sees | Built? |
| --- | --- | --- |
| **The search understands** | Type "LED screens near Silk Board under 2 lakh"; chips appear as you type: *LED screen · near Silk Board · up to ₹2,00,000*. | Built-in rules (place, format, size, budget, lighting, "near X"). Claude reading of free-form briefs is built but stays off (decision, section 10) |
| **Send a media kit, get listings back** | "Send your PDF media kit. Your sites come back as drafts for you to check." | Built; without the Anthropic key the team enters kits by hand, so no time is promised |
| **Photos are checked** | "Every photo is checked for stock images, reuse and where and when it was taken." | Stock and reuse checks built; GPS and date reading on the roadmap |
| **Locations are verified** | Coordinates to five decimals, facing in degrees, a "Verified location" badge with its date | Built |
| **A brief becomes a plan** | Shortlist, compare and one enquiry split per owner; export to PDF, Excel or slides | Shortlist, compare and split enquiry built; slides on the roadmap |
| **Digital and programmatic ready** | Digital faces show resolution, loop, spot and "Available programmatically via …" | Data model ready; exchange flags on the roadmap |
| **Machine-readable by design** | A Developers page: public API, OpenAPI spec, and later an MCP server so AI assistants can search OOHWORKS | API and Swagger built; MCP on the roadmap |
| **Numbers computed, not guessed** | "Median 20 × 10 ft rate in Bengaluru: ₹X a month (OOHWORKS listings, Oct 2026)" | Price index on the roadmap; shown only once there is enough data |

The vocabulary does the rest. We use verbs that describe machine work done well: *reads, checks, matches, drafts, verifies, understands, updates*. We don't use *AI-powered, smart, magic, revolutionary, cutting-edge*. One quiet line in the footer can say it once: "Built with machine reading and human checks."

## 4. The landing page, section by section

Order matters: promise, proof, paths, trust, action. Each section lists its job, its content, what it shows while the city is empty, and its one accent element (if any).

### 4.1 Hero: the live brief box

- **Job:** promise plus the first "this is different" moment.
- **Eyebrow:** The open map of out-of-home
- **H1 (kept for SEO):** Every billboard, findable.
- **Standfirst:** Search any hoarding, screen or transit site by what you need, see who owns it, and ask the owner in one step. Free for advertisers; the owner is always the seller.
- **The box:** a large search field that reads as you type and shows the "Understood as" chips under it, before you press Enter. Example briefs rotate in the placeholder:
  - "Hoardings on Outer Ring Road, Bengaluru"
  - "Lit LED screens in Mumbai"
  - "20 × 10 near Silk Board under 1 lakh"
  (The built-in rules read place, format, size, budget, lighting and "near X"; dates are left to the filters.)
- **Accent:** the "Find sites" button (the page's one `survey` element in this view).
- **Right side (desktop):** the site sheet, an animated, precise drawing of one face being surveyed: a pin dropped, coordinates written in mono, the size measured, a badge stamped "Verified location · 23 Oct 2026". It is labelled "How every site is recorded", so it never poses as a real listing.
- **Empty:** works the same; the results page handles the empty answer (section 5).

### 4.2 Proof strip: dropped

Decided 23 Oct 2026: no proof strip until our own numbers pass the floors in section 5.3. Market facts from other sources are not shown on the home page.

### 4.3 How it works, for you (persona switcher)

- **Job:** every visitor sees their own path. This is the section you asked for.
- **Form:** five tabs, or chips on phones. The page remembers the choice and the address carries it (`/?for=owners`), so links can open the right tab.
- Each tab has three or four steps. Each step names what the visitor does and what OOHWORKS does for them, which is where the machine work shows. Full copy is in section 6.

| Tab | Who | Promise |
| --- | --- | --- |
| Media owners | Independent owners, 5–500 faces | Your sites, found by every buyer, at no cost. Enquiries come straight to you. |
| Owner networks | Large owners, DOOH networks | A neutral shop window no rival owns, with full control of what is shown. |
| Agencies | OOH specialists, media agencies | The fastest way to find and check any site, including independents. We will never compete with you. |
| Brands and businesses | Marketing teams, small businesses | See real sites, real owners and real prices, then ask in one step. |
| Digital and programmatic | DOOH and pDOOH planners, DSP teams | Screen specs you can plan against, and where each screen is bought programmatically. |

Each tab ends with one action: List your sites · Talk to us about bulk import · Start a plan · Find sites · Browse digital screens.

### 4.4 Inside a site page: the anatomy

- **Job:** show the depth of data that no rival has, on one annotated example.
- **Content:** a labelled, anatomised site sheet: approach photo slot, coordinates, facing, size in ft and m, lighting, audience with source, permit, price mode, availability calendar, owner card with "Replies in under a day". Callouts explain why each matters ("Facing: so you know which traffic sees it").
- **Honesty:** labelled "Example layout. Real pages show real, dated photos." Once a real site clears the content bar, it replaces the example.

### 4.5 Trust: how we verify

- **Job:** answer the Indian market's real fears: inflated traffic, one structure sold twice, swapped locations, fake proof photos, illegal hoardings.
- **Content:** five badges (Verified owner, Verified location, Permit on file, Fresh, Responsive), each with what earns it and how we check it. One line on photo checks. A link to a full "How we verify" page.

### 4.6 Cities opening (replaces "New sites" while empty)

- **Job:** turn the empty period into momentum.
- **Content:** a board of the six launch cities. Each card shows an honest status in words: *Owners joining*, *Opening soon* or *Open: 142 sites*. It shows a real number only when there is one. Each card offers "Tell me when Bengaluru opens" (email follow) and "Own sites here? List them free".
- Once a city passes the index threshold (25+ indexable faces), its card links to the city hub and the "New sites this week" grid returns above it.

### 4.7 For media owners (navy band)

- **Job:** supply first: this is where the marketplace is won.
- **Content:** the free listing, assisted onboarding ("Send your media kit; your sites come back as drafts"), and the no-commission promise. No founding-owner offer on the page (decision, section 10). A small FAQ: Do I lose my clients? Who sets the price? What does it cost?
- **Accent:** none in this band; the action is a navy-on-paper primary button, "List your sites free".

### 4.8 Newsroom and guides

- Three newest pieces, or nothing when there are none (no placeholders). Below them, a newsletter sign-up for the daily trade briefing.

### 4.9 For builders and AI assistants: later

Decided 23 Oct 2026: no Developers band until the connection for AI assistants exists.

### 4.10 The charter, and the close

- The five charter rules in display type, then one final action pair: **Find sites** · **List your sites free**.
- **Footer:** product, owners, company, local terms (hoarding, vía pública, mídia exterior, 48-sheet, bulletin), the neutrality line, and "Built with machine reading and human checks."

## 5. The empty tone

The marketplace is new, so the site will be empty in most places for months. How it handles that decides whether it feels premium or broken.

### 5.1 Principles

1. **Say it plainly, once.** "Bengaluru opens first. Owners are listing now." Never "Coming soon!!", never fake activity.
2. **Every empty place offers two next steps:** one for the buyer (follow, or read a guide) and one for the owner (list free).
3. **Show the machinery, not the absence.** When there are no results, show what we understood and what we will do: "We read: LED screens · Mumbai. No verified sites match yet. We'll email you the day the first one does."
4. **Use the founding period as status.** "Founding owners" and "founding cities" are a privilege, not an apology.
5. **No numbers until they are real and worth showing.** We show a count only when it passes a floor, e.g. 25 sites in a city or 10 verified owners. Below that we use words.

### 5.2 Empty-state copy by place

| Place | Copy |
| --- | --- |
| Search, no matches | **We read your brief.** *LED screens · Mumbai.* No verified sites match yet: Mumbai opens after Bengaluru. **Tell me when they're listed** · Own screens in Mumbai? List them free. |
| City hub not open | **Bengaluru is opening.** Owners are verifying their first sites now. Every site here will have a real photo, an exact location and a named owner. |
| Newsroom with no pieces | The section stays hidden. No "no articles" box on the home page. |
| Shortlist empty | **Your shortlist is empty.** Save sites from search; they stay on this device until you sign in. |
| Owner dashboard, no leads | **No enquiries yet.** Sites with three photos and a price get asked about first. *Add photos to 4 sites →* |

### 5.3 When numbers switch on

| Number | Shown when |
| --- | --- |
| Sites in a city | 25+ indexable faces (the hub index threshold) |
| Verified owners overall | 10+ |
| Median reply time | 30+ enquiries answered |
| Price index line | 20+ priced faces of one format in one city |

## 6. "How it works" copy for each persona

**Media owners**
1. **List free.** Add sites one by one, upload your spreadsheet, or send your PDF media kit. *We read the kit and send your sites back as drafts to check.*
2. **Get verified.** Company documents and one site photo from the road. *We check each photo's location and date, and flag stock or reused images before a buyer sees them.*
3. **Be found.** Each site gets its own page on Google and in every buyer's search. *Pages update themselves when you change availability or price.*
4. **Hear from buyers directly.** Enquiries come to you by email and WhatsApp, with the buyer verified. You set the price, you keep the client, we take no commission.

**Owner networks**
1. **Import in bulk.** Spreadsheet, API, or a feed from Broadsign and other systems.
2. **Control what shows.** Choose which faces, which prices (exact, "from" or on request) and which details are public.
3. **A neutral shop window.** No rival owns OOHWORKS, and we never sell media against you.
4. **Measure demand.** See views, saves and enquiries for every face.

**Agencies**
1. **Describe the brief.** *Search understands place, format, size, dates and budget in plain words.*
2. **Check every site.** Coordinates, facing, real dated photos, permits, and audience with a named source.
3. **Plan and ask once.** Shortlist, compare, then one enquiry is split into one request per owner. *Replies come back into one thread.*
4. **We never compete with you.** No media sales, no contact with your clients, no sharing of your plans.

**Brands and businesses**
1. **Say where and when.** "Near our new store in Indiranagar, for March."
2. **See real sites and real prices.** Photos from the street, "from" prices, and the owner's name.
3. **Ask in one step.** The owner replies directly; most reply within a day.
4. **Learn as you go.** Cost guides for each city and format, with live sites under them.

**Digital and programmatic**
1. **Plan against specs.** Resolution, spot and loop length, slots, hours, audio and motion.
2. **See how each screen is bought.** "Available programmatically via …", with the exchanges named. Exchanges are our partners, not rivals.
3. **Mix static and digital.** One plan, one comparison, one enquiry.
4. **Built on the standards.** Venues classified on the OpenOOH taxonomy; screen data aligned to OpenRTB 2.6.

## 7. The whole website

New pages are marked *new*; the rest exist today and get the same treatment.

| Page | Job | Notes |
| --- | --- | --- |
| Home | Promise, proof, paths | Section 4 |
| Find sites `/search/` | The working tool | Live "understood as", map, follow when empty |
| Site page | The deepest data in OOH | Content bar, sticky price block, owner card |
| City and format hubs `/in/bengaluru/` | Rank and convert | Open with a dated OOHWORKS fact; indexed only above threshold |
| Owner storefront `/owners/{name}/` | The owner's free website | Navy band, sites grid, contact |
| For owners | Supply conversion | Persona page: steps, founding offer, FAQ, kit upload |
| How we verify *new* | Trust | Badges, photo checks, reporting a listing |
| Charter | Neutrality | Exists |
| Newsroom, guides, analysis, data | Authority and search traffic | Exist; filled once pieces are published |
| Price index *new, later* | The data moat | Only once there is enough priced data |
| Developers *later* | The strongest AI signal | Only once the AI-assistant connection exists (decision, section 10) |
| Pricing *new* | Remove doubt | "Free for buyers. Free for owners. Pro later, for owners who want more." |
| About and masthead *new* | Who we are | Company details, editors, contact |
| Terms, privacy, cookies *new* | Required before real sign-ups | Wait on company details |

**Navigation:** Find sites · How it works ▾ (the five personas, each opening its tab on the home page) · Newsroom · For owners · Sign in · **List your sites**. Persona content lives only in the home page tabs (decision, section 10).

## 8. Look and feel

- Day theme only; the paper, ink and navy palette. One `survey` accent per view: the search button on the home page.
- Poppins for all type (decided 19 Oct 2026, replacing the Bricolage, IBM Plex and Archivo pairing in the design-system skill). Mono numerals for data; check Poppins' tabular figures, or keep a mono face for data only.
- The visual motif is **the survey sheet**: thin hairlines, coordinates in mono, measured dimensions, small stamps. It reads as precise and engineered, which is the "tech" cue, without robots, glows or gradients.
- Motion: one drawing animation in the hero (the site being surveyed), chips that appear as the brief is read, reveals on scroll. 120–320 ms; nothing loops; reduced motion respected.
- Photos: none until we have real ones. Static maps and the survey drawing carry the page. No stock photos, no renders.

## 9. How we'll know it works

| Measure | Target for the first 90 days |
| --- | --- |
| Hero search used | 30% of home visits |
| Persona tab opened | 40% of home visits |
| Owner sign-ups started from home | 3% of owner-tab visitors |
| "Tell me when" follows | 10% of empty searches |
| Largest Contentful Paint, phone | under 2.0 s |
| Lighthouse SEO and accessibility | 100 and 100 (already a CI gate) |

## 10. Decisions (23 Oct 2026)

| Question | Decision | What changes in this proposal |
| --- | --- | --- |
| Headline | **Keep "Every billboard, findable."** | None |
| Persona tabs plus persona pages, or tabs only | **Tabs only** | No For agencies, For brands or Digital and programmatic pages. The nav's "How it works" opens the home page tabs (`/?for=agencies#how-it-works`). For owners stays, as it already exists. |
| Founding-owner offer on the home page | **No** | Section 4.7 drops the offer. The owners band sells the free listing, media-kit onboarding and no commission only. |
| Proof strip | **None until our own numbers are real** | Section 4.2 is removed. Our own counts appear only once they pass the floors in 5.3, and in the sections that own them (cities board, hubs), not as a strip. |
| Developers band | **No** | Section 4.9 is removed. The Developers page waits until the AI-assistant connection exists; the existing API docs stay where they are. |
| Claude reading on the live search | **No key on Vercel** | The hero's "Understood as" chips use the built-in rules only (city, format, size, dates, budget, "near X"). Copy must not promise free-form reading: example briefs stick to what the rules read. Media-kit copy promises drafts to check, not a time ("usually within minutes" is dropped), because without the key kits are entered by the team. |

The landing page order therefore becomes: hero with the brief box, how it works for you (five tabs), inside a site page, how we verify, cities opening, for media owners, newsroom, the charter and the close.

## 11. Build order, once approved

1. Hero brief box with live "understood as" chips (built-in rules, read as you type).
2. Persona tabs with the copy above; empty-state copy across search, hubs and dashboard.
3. Cities-opening board, verification section, site anatomy, owners band without the offer.
4. How we verify and Pricing pages.
5. About and legal pages once company details are in.

Each step ships behind the existing gates: Playwright, Lighthouse CI, the design-rules test (one accent per view, 44 px targets), and a check on phone, tablet and desktop.

## 12. As built (23 Oct 2026)

Built: the hero brief box with "Understood as" chips read by the search's own rules (`components/home/BriefField.tsx`, `lib/sites/brief.ts`); the five persona tabs (`components/home/PersonaTabs.tsx`, copy in `components/home/personas.ts`), which work without JavaScript through `:target` and open from `/#for-owners`, `/#for-networks`, `/#for-agencies`, `/#for-brands`, `/#for-digital`; inside a site page; how we verify; the cities board (`cityBoard()` in `lib/sites/queries.ts`, sample sites never count); the owners band; the newsroom; the charter and the close. The empty search now says "No verified … yet" and "We read your brief" when it understood the query.

Where the build differs from sections 4 and 7:

- **The hero stays centred.** The survey drawing sits beside "Inside a site page" instead of the hero, so the hero loads with text only (the H1 stays the largest paint) and the drawing explains the data it illustrates.
- **"How it works" is a plain link** in the top bar and the footer (`/#how-it-works`), not a menu of five. The tabs are one scroll away and each has its own address for sharing.
- **Example briefs** are "hoardings in Bengaluru", "LED screens in Mumbai" and "20 × 10 near Silk Board under 1 lakh". "Lit" is not a lighting filter the search has, so "Lit LED screens" was dropped.
- **The cities board** gives each city one link ("Tell me when it opens", or the city's sites once listed) and one shared line for owners, so six cards fit one row on desktop and two columns on a phone.
- **Not built yet:** the How we verify and Pricing pages (section 11, step 4) and the About and legal pages (step 5).
