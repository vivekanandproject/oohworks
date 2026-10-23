# The newsroom desk: structuring article writing in the CMS

Date: 23 Oct 2026. Status: proposal for approval; nothing built yet. Builds on the editorial plan (`ohworks-editorial-plan.md`, sections 3 and 7) and the super admin plan (roles).

## 1. What exists today

Payload's admin at `/admin`, with:

- **Articles** (news, analysis, owner academy, showcase), **Guides**, **Reports**, **Corrections**, **Sources**, **People**, **Companies**, **Tags**, **Media**, **Issues** (newsletter).
- **A workflow field:** Draft → In review → Fact-checked → Scheduled → Published. Publishing is refused until the piece is Fact-checked and every Fact is ticked (`hooks/index.ts`).
- **Four body blocks:** Fact (inline figure with source and date), Figure, Quote, Callout.
- **Roles:** super admin, admin, editor (publishes), writer (drafts and submits), contributor (drafts only), ops (media and tags).
- **Autosave, versions** (50 per piece), and a sponsor label kept out of News.

## 2. What a writer meets today, and what goes wrong

Measured on the local admin, 23 Oct 2026 (article 22, at 1440 px):

| Problem | Effect |
| --- | --- |
| **One long form.** Title, body, sponsor, related sites and SEO are stacked in one column; pillar, lead story, layout, slug, authors, tags, places, workflow and date are mixed together in the sidebar. | A writer cannot tell what they must fill in from what an editor decides. |
| **A blank page.** Every piece starts with an empty body, whatever its kind. | News, analysis, how-to and showcase pieces come out shaped differently each time. |
| **Facts show as "Fact".** Inline Fact chips say only "Fact", not the figure. | The writer reads "reached [Fact] in 2025" and has to open each chip to check it. |
| **No count of unchecked facts.** The editor only learns that facts are unticked when publishing fails. | Late surprises at the last step. |
| **No brief or assignment.** No field for who is writing it, who edits it, the deadline or the angle. | Pieces are agreed in chat and lost. |
| **No desk view.** The dashboard lists collections, not work: nothing shows "waiting for your review" or "due today". | Editors must open the list and filter by hand. |
| **The workflow is a free dropdown.** Anyone who can edit can pick any state. | A writer can mark their own piece "Fact-checked"; publishing still stops it, but the state is wrong in the meantime. |
| **Stray empty drafts.** Opening "Create new" autosaves an untitled draft (two exist locally: 30 and 32). | The list fills with blanks. |
| **The style guide lives in a doc**, not beside the editor. | Rules on numbers, units and local terms are not where writing happens. |

## 3. The proposal: a newsroom desk in four parts

### 3.1 Story types with a ready structure

When a writer starts a piece they choose a **story type**. The body is pre-filled with an outline of headings and prompts in grey, which the writer replaces. Each type also sets the pillar and the checks it needs.

| Story type | Pillar | Outline the body starts with |
| --- | --- | --- |
| **News** | News | What happened (who, what, where, when, one Fact) · Why it matters for owners or buyers · The numbers (Facts) · What happens next |
| **Analysis** | Analysis | The question · What the data shows (Facts, with sources) · What it means for owners · What it means for buyers · What we do not know yet |
| **Explainer / how-to** | Owner academy | Who this is for · Steps, numbered · Costs and timings (Facts) · Mistakes to avoid · Where to get help |
| **Showcase** | Showcase | The campaign in one line · The sites used (related sites) · Why it worked · Credits |
| **Interview** | Analysis | Who and why now · Questions and answers (Quote blocks) · What we take from it |

Short news (under 300 words) keeps a single column; the outline only suggests sections.

### 3.2 A clearer editor: tabs and a desk panel

The edit screen splits into tabs, so a writer sees writing first:

1. **Write:** story type, title, standfirst, hero photo, body. The things a writer fills in.
2. **Facts and sources:** a list of every Fact in the body, showing its figure, source, date and a tick box, plus the extra sources. The editor checks facts here in one place instead of opening each chip.
3. **Placement:** pillar, lead story, layout, tags, places, series, related sites.
4. **Sponsor and search:** sponsor label, SEO title and description, noindex.

The sidebar becomes a **desk panel**:

- **Stage** and the one next step the user's role allows ("Send for review", "Mark fact-checked", "Schedule", "Publish").
- **Writer, editor, due date and publish time.**
- **A readiness checklist** that updates as you type, each line with its state in words:
  - title under 90 characters;
  - standfirst present, with the key fact or its date;
  - hero photo with alt text and credit (required for Immersive);
  - every Fact has a source and is ticked;
  - at least one place or tag;
  - authors set;
  - SEO description under 160 characters.
- **Unchecked facts: N**, always visible.

Fact chips in the body show the figure and its state, e.g. "$54.2 bn ✓" or "15% · not checked", instead of "Fact".

### 3.3 A brief before the writing, and stages that follow roles

Two stages go before Draft:

**Idea → Assigned → Draft → In review → Fact-checked → Scheduled → Published**

- **Idea:** anyone on the team can pitch one: a working title, the angle, the sources to use, and why now. Ideas live in the same Articles list, filtered to their own view.
- **Assigned:** an editor gives it a writer, an editor and a due date. The writer sees it in "My assignments".
- **Who may move a piece:**
  - writers and contributors: Idea, Draft and In review only;
  - editors and above: Fact-checked, Scheduled and Published;
  - sending a piece back from review needs a note.
- **Desk notes:** a short running log on each piece (who, when, what), for editor and writer to talk without chat. Nothing in it is ever published.

### 3.4 The desk dashboard

The admin home opens on the newsroom desk, above the existing collection tiles:

| Panel | Shows |
| --- | --- |
| **New story** | One button per story type |
| **My assignments** | Pieces assigned to me, by due date; overdue ones marked "due" |
| **Waiting for review** | Pieces In review (editors only) |
| **Facts to check** | Pieces with unchecked facts, with the count |
| **Scheduled** | What publishes in the next 7 days, and when |
| **Published this week** | With a link to each live page |
| **Ideas** | The newest pitches |

### 3.5 Smaller fixes in the same pass

- **No untitled drafts.** Autosave starts only after a title is typed. The existing blanks (30, 32) are removed.
- **The style guide inside the CMS:** a "Style guide" page in the admin, linked from the desk panel. It holds the voice rules, numbers and units ("₹ 85,000 / month", "20 × 10 ft (6.1 × 3.0 m)", lakh and crore in text), local terms and banned words, taken from the design system's copy rules.
- **Preview:** a "Preview" button that opens the piece as it will look on the site, drafts included, for staff only.

## 4. Later, not in this pass

- The remaining blocks from the editorial plan: listing strip ("Sites in this area"), comparison table, timeline, map, glossary term, price chart. Listing strips wait for real sites; price charts wait for the price index.
- Guides and Reports get the same desk panel once Articles is right.
- **Publishing at a set time on its own** needs a job that runs every few minutes. On Cloud Run this is Cloud Scheduler (already in the Terraform). On Vercel's free plan, scheduled jobs run at most once a day, so until then "Scheduled" means an editor publishes at the time.

## 5. Decisions for you

1. **Story types:** the five above (News, Analysis, Explainer, Showcase, Interview)? Or a different set?
2. **Idea and Assigned stages with a brief:** add them, or keep the workflow starting at Draft?
3. **Stages locked to roles** (writers cannot mark fact-checked or publish): yes or no?
4. **The desk dashboard as the admin home page** for editorial roles, with the marketplace tiles below, or the desk on its own page?
5. **Desk notes on each piece:** yes or no?

## 6. Build order once approved

1. Story types with outlines; the tabbed editor; Fact chips that show the figure; no untitled drafts.
2. Desk panel: stages by role, readiness checklist, unchecked-fact count, writer, editor and due date, desk notes.
3. Idea and Assigned stages, and the desk dashboard.
4. Style guide page and preview.

Every collection change ships with a Payload migration (the release runs them on Vercel and Cloud Run), and each step is checked in the admin at desktop width with the existing role tests.
