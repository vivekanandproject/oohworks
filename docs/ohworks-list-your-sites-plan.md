# ohworks List your sites: plan

Date: 11 Oct 2026. Status: step 1 is built (section 12), on the defaults in section 10, after the founder said to go ahead. Steps 2 and 3 are planned and not started. Builds on the strategy report (owner onboarding, verification badges), `ohworks-architecture.md`, milestone M3 of `ohworks-build-plan.md`, and Find sites, which is complete on sample sites.

## 1. What this must achieve

Find sites works, but it runs on samples. Nothing a buyer sees is real, no page can reach a search engine, and no enquiry can reach a real owner, until owners can put their own sites on ohworks. "List your sites" is that door.

| Target (Gate 1 in the strategy)   | What List your sites contributes                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 300 verified owners               | An owner can start alone, in minutes, with only a work email                                          |
| 5,000 indexable faces             | A spreadsheet of sites becomes listings in one upload; each listing is pushed towards the content bar |
| 500 enquiries a month             | Enquiries need real sites to land on, and a real address to reach                                     |
| Median owner reply under 24 hours | The owner's contact address is confirmed before any site goes live                                    |

**The promise to an owner:** it is free, you set the price and how it shows, every enquiry comes straight to you, and nothing about your site is published until you have seen it and we have checked it.

**The test this must pass** (from the build plan): someone lists 20 sites from an Excel file in under an hour, and sees each one live or correctly held back with the reason.

## 2. Who uses it, and what each needs

| Who                                                       | Arrives with                             | Needs                                                                         |
| --------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| An independent owner with 5 to 50 sites, often on a phone | Photos on the phone, rates in their head | One site at a time, in plain words, with a pin on a map; no account to set up |
| A larger owner with hundreds of sites                     | A spreadsheet or an inventory system     | A template to fill and upload, with every problem named by row and column     |
| An owner who has only a PDF media kit                     | The PDF                                  | To hand it over and have ohworks enter it, then approve the result            |
| The ohworks team                                          | A queue of new owners and sites          | To see what is waiting, check it, publish it or send it back with a reason    |

What owners fear, from the strategy: losing clients, rates being undercut, and being listed wrongly. The flow answers each: the owner is always the named seller, the owner chooses whether a price shows at all, and the owner sees every listing before anyone else does.

## 3. The flow

1. **Start.** One page says what listing is, what it costs (nothing) and what is needed. The owner gives a work email.
2. **Confirm.** A six-digit code goes to that email. This is the address enquiries will come to, so it is proved first. The browser is then remembered for 30 days.
3. **Company.** Company name, city, contact person and phone. A GSTIN and a document are optional here, and are what earn "Verified owner".
4. **Add sites**, in any of three ways (section 4).
5. **Your sites.** One page lists every site with its state, how complete it is, and what would improve it.
6. **Send for review.** The owner sends the sites that are ready. The team checks each one and it goes live, or comes back with a reason.
7. **After it is live.** The owner can change the price, how it shows, and availability at once. Other changes are checked again.

There is no password and no account to create. The owner's email is the key, proved by a code, the same way a buyer's is.

## 4. Three ways to add sites

| Way                        | For                                  | How it works                                                                                                                                                         |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One at a time**          | Up to a few dozen sites              | A form in five parts: what it is, where it is, price and terms, availability, audience and permit. Then photographs                                                  |
| **A spreadsheet**          | Many sites                           | Download the template, fill one row a site, upload. Rows that are right become draft listings. Rows that are not are listed with the row, the column and what to fix |
| **Send us your media kit** | Owners with a PDF or their own sheet | Upload the file with a note. The team enters the sites; the owner approves them before they go live                                                                  |

**Location** is a pin on a map, or coordinates or a Google Maps link pasted in. The site says which way the face points as a compass bearing. A new site within 25 metres of another, facing within 30 degrees of it, is flagged as a possible duplicate, to the owner and to the team.

**Photographs** are real photographs of the face in its street: approach, day and night. Each carries the date it was taken. No stock images and no renders.

## 5. What is checked, by whom, and when

| State         | Meaning                                                | Who moves it on                                                        |
| ------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| Draft         | The owner is still working on it. Only they can see it | The owner sends it for review                                          |
| In review     | Waiting for the ohworks team                           | The team publishes it, or returns it                                   |
| Needs changes | Returned with a written reason                         | The owner fixes it and sends it again                                  |
| Live          | Published on ohworks                                   | The owner can update price and availability; the team can take it down |

Before a site goes live the team checks that the owner is who they say, that the pin is where the site is, and that the photographs are of that site. What was checked becomes the badges a buyer sees: Verified owner, Verified location, Permit on file. A site can go live without every badge; it earns them as each check is done. A site below the content bar is live for buyers but held back from search engines, as the SEO rules say.

The owner is emailed when a site goes live, and when one is returned with the reason.

## 6. What an owner controls

- **The price**, and whether it shows as an exact rate, a "from" price, or price on request. A private price is never a penalty.
- **Availability**: booked until a date, or confirmed free today. Confirming keeps the "Updated" badge and the listing's place in results.
- **Where enquiries go**: the confirmed email, which they can change to a sales address.
- **Whether a site stays listed.** An owner can withdraw a site at any time.

These take effect at once. A change to what the site is or where it is goes back through review, because that is what the badges vouch for.

## 7. Rules that keep it honest

- Listing is free, with no commission. ohworks never sells media or takes a media margin.
- The owner is the named seller on every listing. ohworks is never shown as one.
- An audience figure is accepted only with its source and the date it was measured. Otherwise the field stays empty.
- Real photographs only. A site with none says "No photo yet"; it is never given a stock image.
- Nothing is published that the owner has not seen. The team's own entries from a media kit wait for the owner's approval.
- Company documents are for verification only. They are never shown, and only staff can open them.

## 8. What must exist to build it

**Data.** Owners gain a sign-in email, a contact person, a GSTIN and a submitted date. Sites gain a review state, a note from the reviewer, the owner's own reference and a duplicate flag. Two new stores: emailed codes for owners, and private owner files for documents and media kits.

**No new keys are needed for step 1.** What each missing service would add:

| Service           | Adds                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| Email service     | Real emails for codes and notices; today they are written to the Outbox |
| WhatsApp Business | A code by WhatsApp or SMS, which many owners will prefer to email       |
| Google Maps       | A street-level picture beside the pin, to check the location            |
| Object storage    | Photographs and documents off the local disk                            |
| Anthropic         | Reading a PDF media kit into draft listings for the team to check       |

## 9. Build order

Each step ends in something you can open and judge.

1. **The door.** Start, confirm, company, the three ways to add sites, the owner's page of sites, send for review, the team's check in the admin, and the owner's quick changes to price and availability on a live site.
2. **Trust and reach.** The public owner page at `/owners/{name}`, edits to a live site with re-review, duplicate review side by side, photographs matched to sites in bulk with the date and position read from each file, a code by WhatsApp.
3. **The owner's desk.** A leads inbox across web, email and WhatsApp, per-site figures, an availability calendar, team seats. This is the start of Owner Pro.

## 10. Decisions taken by default (11 Oct 2026)

These are the recommended options. Each can be changed.

1. **No account.** An email and a code, remembered for 30 days. Sign-in with roles and team seats comes with the owner's desk.
2. **All three ways to add sites** are in step 1.
3. **Nothing goes live without a check by the team.** Speed comes from a short queue, not from skipping the check.
4. **A GSTIN is optional to list, and required for "Verified owner".** An owner can start with ten minutes and a phone.
5. **Price and availability change at once** on a live site. Everything else is checked again.
6. **The nav button "List your sites" opens the start page.** "For owners" stays as the page that explains why.

## 11. Wireframes

`docs/wireframes/list-your-sites.html` holds eight views: the start page, confirm and company, the owner's sites, add one site, the spreadsheet, the media kit, the states of a site, and what the team sees. Open the file in a browser; the bar at the top switches view and width.

## 12. What step 1 built (10 Oct 2026)

Step 1 of the build order is done: the door. An owner can now put their own sites on ohworks, and the team can check and publish them.

### Pages

| Address                        | What it is                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `/list-your-sites/`            | The start: one form for who is listing, beside what happens next. The "List your sites" button opens it            |
| `/list-your-sites/confirm/`    | Enter the emailed code                                                                                             |
| `/sign-in/`                    | The way back in for an owner: the same email and code, with no password. It also tells buyers they need no account |
| `/owner/`                      | Your sites: every site with its state, how complete it is, and what to do next                                     |
| `/owner/company/`              | The company, where enquiries go, and the GSTIN and document for the Verified owner badge                           |
| `/owner/sites/new/`            | Add one site, in five parts, with a pin on a map                                                                   |
| `/owner/sites/{unit id}/`      | One site: its state, photographs, what buyers will see, and quick changes once live                                |
| `/owner/sites/{unit id}/edit/` | Change a site that is not yet live                                                                                 |
| `/owner/import/`               | The spreadsheet template, the upload, and the report                                                               |
| `/owner/kit/`                  | Send a media kit for the team to enter                                                                             |

The start page is offered to search engines, because an owner searching how to list should find it. Everything under `/owner/` is `noindex` and closed in robots.

### Signing in without an account

An owner's work email is sent a six-digit code, good for ten minutes and five tries. A right code remembers the browser for 30 days. Coming back is the same step. Only the code's hash is stored, one address can ask for five codes an hour, and the owner's note is separate from a buyer's, so one cannot stand in for the other.

### The start is one form

Changed on 10 Oct 2026 at the founder's direction. The first build asked for an email alone and for everything else after the code, which read as a sign-up box, not as onboarding, and did not match the enquiry page.

- **One form, then the code.** The start page asks for the company name and city, the person's name and phone, and the work email. The GSTIN is the only optional answer. The code step comes second, and the owner then lands on their sites with the company already made.
- **Nothing is made for an unconfirmed address.** The answers wait beside the code and become an owner only when the code is confirmed. If the address already belongs to an owner, they are signed in and their details are left as they are.
- **The same layout as the enquiry page.** The form is on the left. On the right, and staying in view on a wide screen, are the four steps and what to have ready for each site. On a phone the form comes first.
- **The four steps** are a panel beside the form on the start, the code page and the first site, with the current one marked "You are here". The label above each title says the step in words, as the enquiry pages do.
- **A mistake** returns to the form with everything that was typed, names the problem, and marks the field.
- **A company outside the six launch cities** chooses "Another city".
- **Sign in is unchanged.** A returning owner gives the email alone. A new address that comes in through Sign in is asked for the company after the code, as before.

One set of checks, in `src/lib/owners/company-input.ts`, serves the form whichever way it arrives.

### One design for every owner page

Done on 11 Oct 2026, after the pages were found to disagree with each other and with the rest of the site. Measured side by side they had six column widths, three title sizes, form sections boxed on some pages and plain on others, and box titles on the border in some places and inside in others.

The owner's area now uses the two frames the site already had, and nothing else. They live in `src/components/owners/Frame.tsx`.

| Frame | Columns | Used by | Same as |
| --- | --- | --- | --- |
| Form | 560 for the form, 380 for help | Start, code, Sign in, company, add a site, edit a site, spreadsheet, media kit | The enquiry page |
| Content | Seven parts for content, four for a panel | The owner's sites, one site | The shortlist and the public site page |

The rules inside them:

- **The top of a page** is a small plain label, a title at 34 px, and a line or two at 15 px. The label is never a link.
- **Fields sit on the page**, as on the enquiry form. A long form is split by a rule and a heading, never by boxes.
- **Boxes** are for the panels beside a form and for a tool that sits among other content. A box's title is inside it, at 23 px.
- **The same fields look the same.** The start page and the company page ask for the company in one arrangement.
- **The main action of a page** is the large navy button. Actions inside a box are the standard size.
- **Rows of fields** share one 16 px gap.

A browser test measures the enquiry page and the shortlist, then holds seven owner pages to the same top space, title size, form width and panel position, and fails if a boxed field group or an odd heading size returns.

### The ways in, and knowing you are signed in

Added on 10 Oct 2026, after the first build proved hard to find one's way around.

- **Sign in is real.** It had been a holding page that said accounts were not open. It is now the owner's way back in. A signed-in owner who opens it goes straight to their sites.
- **The bar shows where you stand.** Signed out it reads "Sign in" and "List your sites". Signed in it reads "Your sites", on every page, and the footer follows. Both sets of links are in every page, and a small script in the head chooses one before anything is drawn, from a marker cookie (`oh_bar`) set and cleared with the real one. So pages stay the same for everyone and can be cached. The marker proves nothing: the owner's pages still ask for the signed cookie.
- **"List your sites" answers on its own page.** There it points at the form's first box, so pressing it puts the cursor there and keeps the headline in view. Before, it reloaded the page and looked like nothing had happened.
- **Every "List your sites" leads to the start.** The buttons on the home page and under thin search results went to the page about listing.
- **A way out before the company exists.** The company step shows the confirmed address with "Not you? Sign out".

### The company

Company name, city, contact person, phone and the address enquiries go to. A GSTIN is optional. When given, it is checked for its shape and its check character, which catches a mistyped number; the team still checks it against the document. The document is stored privately: only staff can open it, and it is never shown.

### Three ways to add sites

- **One at a time.** Five parts: what it is, where it is, price and terms, availability, then audience, permit and artwork. A mistake comes back beside its field with everything else kept. The position can be pressed on a map, pasted as coordinates or a Google Maps link, or typed.
- **A spreadsheet.** The template has 37 columns, of which ten are needed. It has drop-downs where there is a fixed choice, an example row, and a second sheet that explains every column. A row that is right becomes a draft. A row that is not is reported with its row, its column and what to fix, and creates nothing. A row whose "Your reference" matches a site the owner already has updates it, so uploading twice never doubles a site.
- **A media kit.** The file goes to the team with the owner's note. The team enters the sites as drafts under that owner, who checks them before sending them for review.

Up to six photographs a site, each with the view it shows and the date it was taken.

### What is refused, and why

- A price set to show with no rate.
- An audience figure with no source or no date.
- A position outside India, which is almost always latitude and longitude swapped.
- A file of the wrong kind or size, and a PDF that is damaged.
- A second listing of what looks like the same face: within 25 metres and facing within 30 degrees. This is a warning to the owner and a flag to the team, not a refusal, because two faces back to back are two sites.

### States and the team's check

A site is a draft, in review, needs changes, or live. The owner sends drafts for review in one step. In the admin, the Sites list shows the review state and the date sent; filter it by "In review" to see what is waiting.

- **Publishing a site approves it** and emails the owner that it is live, with its address.
- **Returning a site needs a written reason**, and the admin refuses to save without one. The owner reads those exact words by email and on the site's page.
- Ticking "Verified owner" on the owner, and "Verified location" on the site, is what puts those badges in front of buyers.

A site published for an owner who is not yet verified is live for buyers and held back from search engines, as the content bar says.

### After it is live

The owner can change the price, how it shows, and availability at once, with no review. Saving also confirms availability as of that day. What the site is and where it is cannot be edited once live, because that is what the badges vouch for. The owner can withdraw a site at any time, and it comes off ohworks at once.

### What the owner sees about quality

Each site has a completeness score out of 100, and a list of what would raise it with the points each adds: a photograph, an audience figure with its source, a shown price, a permit number, the owner's verification, the artwork size, a landmark. The list uses the same weights as the score. Paying is not on it.

### Emails

| When                     | To        | What                                                                             |
| ------------------------ | --------- | -------------------------------------------------------------------------------- |
| Starting, or coming back | The owner | The code                                                                         |
| Sites sent for review    | The team  | How many, from whom, any flagged as possible duplicates, and a link to the queue |
| Sites sent for review    | The owner | That they are with the team                                                      |
| A media kit arrives      | The team  | The file and the owner's note                                                    |
| A site is published      | The owner | That it is live, with its address                                                |
| A site is returned       | The owner | The reviewer's reason                                                            |

Without an email service these are written to the Outbox in the admin. On a development machine the confirm page also shows the code.

### Checks

Unit tests cover the GSTIN check, reading a pasted position, the duplicate rule, every refusal in the site checks, dates as written in India, the spreadsheet reader, the states and the improvement list. Browser tests on three engines walk the whole journey: code, company, a site with a mistake then right, a photograph, review, a return with a reason, publishing, the public page, a quick change, and withdrawal. Further tests cover one owner being unable to see or change another's site, the spreadsheet with its report and its no-doubling rule, the media kit and its privacy, and every endpoint refusing a stranger.

### Three faults found while testing, all site-wide

None was particular to the owner's pages. The first two showed only on a busy machine or a slow connection.

1. **Typed text could be lost.** The copy of React inside Next.js 15.5 has a hydration bug. When a page's data arrived in pieces, React could report error 418 and draw the page again from scratch, which emptied anything typed into a form in the meantime. An owner's corrected GSTIN was lost this way in one test run. React 19.3 fixes it in seven lines, and those lines are now applied to the bundled copy by `patches/next@15.5.27.patch`. `patches/README.md` says what it does and when to remove it. Before the patch 13 of about 60 loaded runs hit the error. After it, none of 96 did.
2. **The page crossfade could be dropped with a console error.** A browser decides whether to crossfade before it reads the body, which can be before the stylesheet has arrived. The request for the crossfade is now also in the head of every page, so it no longer depends on the stylesheet's timing.
3. **The title, description, canonical link and robots tag could arrive in the body.** Next.js 15 sends these after the page for any visitor it does not list as a simple crawler, and Googlebot is not on that list. It happens when a page is ready before its metadata, so the quick pages were the ones affected, and `/list-your-sites/` was the first indexable one. A canonical link or a noindex outside the head can be ignored, which would undo the indexing rules. `htmlLimitedBots: /.*/` in `next.config.ts` now sends them in the head to everyone. Lighthouse found it: the page scored 91 for search until the fix.

The owner tests now fail on any script error on a page, and a test reads the raw HTML of five pages as a browser and as Googlebot and requires the tags in the head, so none of the three can return unseen.

### A demonstration owner on this machine

To look around without listing anything, start at `/list-your-sites/` with `demo-owner@example.com`. The code is shown on the confirm page. It has one live site, one returned with a reason, and a media kit. It is labelled as a sample and is not part of the seeds.

### Not in step 1

- A code by WhatsApp or SMS: needs WhatsApp Business access.
- A street-level picture beside the pin: needs a Google Maps key.
- Reading the date and position from a photograph, and matching many photographs to sites at once: step 2.
- The public owner page at `/owners/{name}`: step 2.
- Editing a live site with a second review: step 2. Today the owner writes to the team.
- Reading a PDF media kit into drafts automatically: needs an Anthropic key. Today the team enters them.
- A leads inbox, figures per site, an availability calendar, team seats: step 3.
- Cities beyond the six launch cities. A site elsewhere is refused with the list of cities that are open.
