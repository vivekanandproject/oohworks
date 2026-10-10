# ohworks List your sites: plan

Date: 11 Oct 2026. Status: plan and wireframes written; step 1 is being built on the defaults in section 10. Builds on the strategy report (owner onboarding, verification badges), `ohworks-architecture.md`, milestone M3 of `ohworks-build-plan.md`, and Find sites, which is complete on sample sites.

## 1. What this must achieve

Find sites works, but it runs on samples. Nothing a buyer sees is real, no page can reach a search engine, and no enquiry can reach a real owner, until owners can put their own sites on ohworks. "List your sites" is that door.

| Target (Gate 1 in the strategy) | What List your sites contributes |
| --- | --- |
| 300 verified owners | An owner can start alone, in minutes, with only a work email |
| 5,000 indexable faces | A spreadsheet of sites becomes listings in one upload; each listing is pushed towards the content bar |
| 500 enquiries a month | Enquiries need real sites to land on, and a real address to reach |
| Median owner reply under 24 hours | The owner's contact address is confirmed before any site goes live |

**The promise to an owner:** it is free, you set the price and how it shows, every enquiry comes straight to you, and nothing about your site is published until you have seen it and we have checked it.

**The test this must pass** (from the build plan): someone lists 20 sites from an Excel file in under an hour, and sees each one live or correctly held back with the reason.

## 2. Who uses it, and what each needs

| Who | Arrives with | Needs |
| --- | --- | --- |
| An independent owner with 5 to 50 sites, often on a phone | Photos on the phone, rates in their head | One site at a time, in plain words, with a pin on a map; no account to set up |
| A larger owner with hundreds of sites | A spreadsheet or an inventory system | A template to fill and upload, with every problem named by row and column |
| An owner who has only a PDF media kit | The PDF | To hand it over and have ohworks enter it, then approve the result |
| The ohworks team | A queue of new owners and sites | To see what is waiting, check it, publish it or send it back with a reason |

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

| Way | For | How it works |
| --- | --- | --- |
| **One at a time** | Up to a few dozen sites | A form in five parts: what it is, where it is, price and terms, availability, audience and permit. Then photographs |
| **A spreadsheet** | Many sites | Download the template, fill one row a site, upload. Rows that are right become draft listings. Rows that are not are listed with the row, the column and what to fix |
| **Send us your media kit** | Owners with a PDF or their own sheet | Upload the file with a note. The team enters the sites; the owner approves them before they go live |

**Location** is a pin on a map, or coordinates or a Google Maps link pasted in. The site says which way the face points as a compass bearing. A new site within 25 metres of another, facing within 30 degrees of it, is flagged as a possible duplicate, to the owner and to the team.

**Photographs** are real photographs of the face in its street: approach, day and night. Each carries the date it was taken. No stock images and no renders.

## 5. What is checked, by whom, and when

| State | Meaning | Who moves it on |
| --- | --- | --- |
| Draft | The owner is still working on it. Only they can see it | The owner sends it for review |
| In review | Waiting for the ohworks team | The team publishes it, or returns it |
| Needs changes | Returned with a written reason | The owner fixes it and sends it again |
| Live | Published on ohworks | The owner can update price and availability; the team can take it down |

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

| Service | Adds |
| --- | --- |
| Email service | Real emails for codes and notices; today they are written to the Outbox |
| WhatsApp Business | A code by WhatsApp or SMS, which many owners will prefer to email |
| Google Maps | A street-level picture beside the pin, to check the location |
| Object storage | Photographs and documents off the local disk |
| Anthropic | Reading a PDF media kit into draft listings for the team to check |

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
