/**
 * Sample pieces for local development and automated tests, so every template has something to render.
 * Figures come from the sources named in the strategy report; each piece says it is a sample and that
 * its figures need re-checking before publication. Never run against production.
 * Re-runnable: removes its own pieces by slug, then recreates them.
 */
import { getPayload, type Payload } from "payload";
import sharp from "sharp";
import config from "../payload.config";
import { countWords } from "../lib/editorial/lexical";

const RETRIEVED = "2026-10-09";
const END_2025 = "2025-12-31";
const SAMPLE =
  "Sample piece for development. Figures come from the sources listed and must be re-checked before this is published.";

let seq = 0;
const uid = () => `demo${++seq}`;
type Node = Record<string, unknown>;
const t = (text: string): Node => ({
  type: "text",
  version: 1,
  text,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
});
const el = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  children,
  ...extra,
});
const inline = (parts: (string | Node)[]): Node[] =>
  parts.map((c) => (typeof c === "string" ? t(c) : c));
const p = (...parts: (string | Node)[]): Node => el("paragraph", inline(parts), { textFormat: 0 });
const h2 = (text: string): Node => el("heading", [t(text)], { tag: "h2" });
const list = (tag: "ul" | "ol", items: string[]): Node =>
  el(
    "list",
    items.map((it, i) => el("listitem", [t(it)], { value: i + 1 })),
    { listType: tag === "ol" ? "number" : "bullet", tag, start: 1 },
  );
const callout = (kind: "note" | "charter" | "warning", body: string): Node => ({
  type: "block",
  version: 2,
  format: "",
  fields: { id: uid(), blockType: "callout", blockName: "", kind, body },
});
const doc = (...children: Node[]) => ({ root: el("root", children) });

async function ensure(
  payload: Payload,
  collection: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<{ id: number }> {
  const found = await payload.find({
    collection: collection as never,
    where: where as never,
    limit: 1,
    overrideAccess: true,
    depth: 0,
  });
  const existing = found.docs[0] as { id: number } | undefined;
  if (existing) {
    // The sample pieces are dated a few hours back from when the seed runs. Running it again moves
    // the dates forward, so a sample newsroom never looks a week old and its news sitemap, which
    // holds only the last two days, is never empty.
    const dates = Object.fromEntries(
      (["publishedAt", "lastRefreshedAt"] as const)
        .filter((key) => typeof data[key] === "string")
        .map((key) => [key, data[key]]),
    );
    if (Object.keys(dates).length)
      await payload.update({
        collection: collection as never,
        id: existing.id,
        data: dates as never,
        overrideAccess: true,
      });
    return existing;
  }
  return (await payload.create({
    collection: collection as never,
    data: data as never,
    overrideAccess: true,
  })) as { id: number };
}

async function main() {
  // Sample pieces never go to a real site. A preview host says so itself with SAMPLE_DATA=allow.
  if (process.env.NODE_ENV === "production" && process.env.SAMPLE_DATA !== "allow")
    throw new Error("seed-demo is for development, tests and previews only");
  const payload = await getPayload({ config });
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

  const admin = (
    await payload.find({
      collection: "users",
      where: { email: { equals: "admin@ohworks.local" } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  const desk = (
    await payload.find({
      collection: "people",
      where: { slug: { equals: "editorial-desk" } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (!admin || !desk) throw new Error("Run the base seed first: pnpm --filter @ohworks/web seed");

  const source = async (
    title: string,
    publisher: string,
    type: string,
    url?: string,
    publishedOn?: string,
  ) =>
    (
      await ensure(
        payload,
        "sources",
        { title: { equals: title } },
        {
          title,
          publisher,
          type,
          retrievedOn: RETRIEVED,
          ...(url ? { url } : {}),
          ...(publishedOn ? { publishedOn } : {}),
        },
      )
    ).id;
  const tag = async (name: string) => {
    const found = (
      await payload.find({
        collection: "tags",
        where: { name: { equals: name } },
        limit: 1,
        overrideAccess: true,
        depth: 0,
      })
    ).docs[0];
    if (!found) throw new Error(`Missing tag ${name}; run the base seed`);
    return found.id;
  };

  const S = {
    woo: await source(
      "WOO Global Out of Home Expenditure Report 2026",
      "World Out of Home Organization",
      "report",
      "https://www.worldooh.org/news/woo-global-ooh-expenditure-report-2026",
      "2026-06-01",
    ),
    wooProg: await source(
      "Global programmatic DOOH market was $1.3 billion in 2025",
      "Billboard Insider",
      "article",
      "https://billboardinsider.com/global-programmatic-dooh-market-was-1-3-billion-in-2025/",
    ),
    broadsign: await source(
      "Broadsign 2026 programmatic report",
      "Billboard Insider",
      "report",
      "https://billboardinsider.com/broadsign-issues-2026-programmatic-report/",
    ),
    pwc: await source(
      "PwC forecast for India OOH",
      "media4growth",
      "article",
      "https://www.media4growth.com/?p=81251",
    ),
    invidis: await source(
      "India's OOH trust deficit: five challenges holding back the market",
      "invidis",
      "article",
      "https://invidis.com/news/2026/08/indias-ooh-trust-deficit-five-challenges-holding-back-the-market/",
      "2026-08-01",
    ),
    draft: await source(
      "Karnataka unveils draft 2025 rules to reset Bengaluru's outdoor advertising",
      "exchange4media",
      "article",
      "https://www.exchange4media.com/out-of-home-news/karnataka-unveils-draft-2025-rules-to-reset-bengalurus-outdoor-advertising-149472.html",
    ),
    bbmp: await source(
      "BBMP chief commissioner directs officials to take strict action against unauthorised ads",
      "Storyboard18",
      "article",
      "https://www.storyboard18.com/advertising/bbmp-chief-commissioner-directs-officials-to-take-strict-action-against-unauthorised-ads-53278.htm",
    ),
    formatMix: await source(
      "2025 US format mix",
      "BigBoards, from OAAA figures",
      "report",
      "https://bigboards.io/market/format-mix/",
    ),
    occupancy: await source(
      "Readers say a digital takes months to rent up, and what counts as full occupancy",
      "Billboard Insider",
      "article",
      "https://billboardinsider.com/readers-say-a-digital-takes-xx-mos-to-rent-up-and-xx-is-full-occupancy/",
    ),
    leadTime: await source(
      "How long is the minimum lead time for DOOH formats and creative",
      "AdQuick",
      "article",
      "https://www.adquick.com/answers/billboard-costs/how-long-is-the-minimum-lead-time-for-dooh-formats-and-creative",
    ),
    agencies: await source(
      "Advice from OOH specialist agencies",
      "OAAA",
      "article",
      "https://oaaa.org/blog-posts/agencyinsights/",
      "2018-01-01",
    ),
    drum: await source(
      "Why does out-of-home still hide its prices",
      "The Drum",
      "article",
      "https://www.thedrum.com/industry-insight/why-does-out-of-home-still-hide-its-prices",
    ),
    searches: await source(
      "Lack of knowledge still a barrier for OOH",
      "Billboard Insider, on 75Media's analysis",
      "article",
      "https://billboardinsider.com/lack-of-knowledge-still-a-barrier-for-ooh/",
      "2023-01-01",
    ),
  };
  const T = {
    india: await tag("India"),
    bengaluru: await tag("Bengaluru"),
    regulation: await tag("Regulation"),
    permits: await tag("Permits"),
    trust: await tag("Trust and verification"),
    programmatic: await tag("Programmatic"),
    pricing: await tag("Pricing"),
    led: await tag("LED screen"),
  };

  /** An inline Fact, already ticked: these figures were checked against the strategy report's sources. */
  const fact = (
    value: string,
    src: number,
    asOf: string,
    opts: { unit?: string; label?: string } = {},
  ): Node => ({
    type: "inlineBlock",
    version: 1,
    fields: { id: uid(), blockType: "fact", value, source: src, asOf, checked: true, ...opts },
  });

  // A plain placeholder so the immersive layout can be seen. It says what it is; it is not presented as a photograph.
  const placeholderAlt = "Development placeholder, not a photograph";
  let placeholder = (
    await payload.find({
      collection: "media",
      where: { alt: { equals: placeholderAlt } },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })
  ).docs[0];
  if (!placeholder) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#ecebe6"/><rect x="40" y="40" width="1520" height="820" fill="none" stroke="#aeb3bb" stroke-width="2" stroke-dasharray="12 12"/><text x="800" y="440" text-anchor="middle" font-family="Menlo, monospace" font-size="34" fill="#56606f">Development placeholder</text><text x="800" y="492" text-anchor="middle" font-family="Menlo, monospace" font-size="24" fill="#56606f">A real, credited photograph goes here</text></svg>`;
    const data = await sharp(Buffer.from(svg)).png().toBuffer();
    placeholder = await payload.create({
      collection: "media",
      data: { alt: placeholderAlt, credit: "ohworks, placeholder", licence: "owned" },
      file: { data, mimetype: "image/png", name: "dev-placeholder.png", size: data.length },
      overrideAccess: true,
    });
  }

  type Demo = { collection: "articles" | "guides"; slug: string; data: Record<string, unknown> };
  const base = { authors: [desk.id], workflow: "fact_checked", _status: "published" };

  const pieces: Demo[] = [
    {
      collection: "articles",
      slug: "most-billboards-cannot-be-found-online",
      data: {
        ...base,
        pillar: "analysis",
        lead: true,
        layout: "standard",
        title: "Most billboards still cannot be found or booked online",
        standfirst:
          "Billboards earn 71.1% of US out-of-home revenue, yet only 8.4% of digital spend trades programmatically and printed boards have no online route at all.",
        tags: [T.programmatic, T.pricing],
        sources: [S.agencies],
        publishedAt: hoursAgo(3),
        body: doc(
          p(
            "Out-of-home advertising grew ",
            fact("15%", S.woo, END_2025, { label: "Growth in global out-of-home spend, 2025" }),
            " in 2025. Yet most of its inventory is still found through phone calls, emails and personal networks.",
          ),
          h2("The money is in static"),
          p(
            "In the United States, billboards earn ",
            fact("71.1%", S.formatMix, END_2025, {
              label: "Billboards' share of US out-of-home revenue",
            }),
            " of out-of-home revenue. In Latin America digital screens take only ",
            fact("27.7%", S.woo, END_2025),
            " of spend, and in Africa ",
            fact("18.0%", S.woo, END_2025),
            ", which leaves the rest to printed faces.",
          ),
          p(
            "A printed face cannot be sold through a programmatic exchange. Unless its owner publishes it somewhere a buyer can search, it is invisible to anyone who does not already know it is there. That is the position of most independent owners, who sell by phone, email and WhatsApp and track their bookings in spreadsheets.",
          ),
          h2("Programmatic reaches a small part of it"),
          p(
            "Even among digital screens, programmatic trading is a minority. It accounted for ",
            fact("8.4%", S.woo, END_2025, {
              label: "Programmatic share of digital out-of-home spend",
            }),
            " of digital out-of-home spend in 2025. In India, PwC puts it at ",
            fact("1 to 2%", S.pwc, END_2025),
            ".",
          ),
          p(
            "About ",
            fact("two-thirds", S.broadsign, "2026-06-30"),
            " of that spend runs through custom private deals, which still depend on a buyer and a seller knowing each other first. The platforms that drew investment in recent years were built for this slice. They serve it well, and they leave the larger part of the market where it was.",
          ),
          h2("What sits unsold"),
          p(
            "The cost shows up as empty faces. The benchmark for a healthy US operator is ",
            fact("80%", S.occupancy, "2026-10-01"),
            " occupancy, but independent owners often run at ",
            fact("60 to 70%", S.occupancy, "2026-10-01", {
              label: "Typical occupancy for independent owners",
            }),
            ". A new digital board takes ",
            fact("six months or more", S.occupancy, "2026-10-01"),
            " to fill. Every empty month on a face is revenue that cannot be recovered later.",
          ),
          h2("What buyers ask for"),
          p(
            "Buyers, meanwhile, work to short deadlines. The median booking is made ",
            fact("25 days", S.leadTime, "2026-10-01"),
            " before a campaign starts: ",
            fact("36 days", S.leadTime, "2026-10-01"),
            " ahead for static sites and ",
            fact("14 days", S.leadTime, "2026-10-01"),
            " for digital.",
          ),
          p(
            "Specialist agencies have said for years what they want from owners: a short, accurate sheet for each site with its location, size, lighting, a street-level photograph, audience and price, and a fast reply. Small businesses ask a simpler question. ",
            fact("Six of the ten", S.searches, "2023-12-31"),
            " most common searches about out-of-home were about cost, an analysis by 75Media found in 2023.",
          ),
          h2("Where a listing fits"),
          p(
            "A public page for every face, with its owner named as the seller, closes that gap without changing who sells. The owner sets the price and keeps the client. It also gives a first-time advertiser what they searched for: a real site, a real owner, and a price or an invitation to ask.",
          ),
          callout(
            "charter",
            "ohworks never sells media or takes a media margin. Owners set prices and keep their clients.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "articles",
      slug: "global-out-of-home-spend-2025-woo",
      data: {
        ...base,
        pillar: "news",
        layout: "standard",
        title: "Global out-of-home spend reached $54.2 bn in 2025, WOO reports",
        standfirst:
          "The World Out of Home Organization puts growth at 15% on the year. Digital screens took 47% of the total.",
        publishedAt: hoursAgo(1),
        body: doc(
          p(
            "Global spending on out-of-home advertising reached ",
            fact("$54.2 bn", S.woo, END_2025),
            " in 2025, up ",
            fact("15%", S.woo, END_2025),
            " on the year, according to the World Out of Home Organization's 2026 expenditure report.",
          ),
          p(
            "Asia-Pacific is the largest region at ",
            fact("$29.7 bn", S.woo, END_2025),
            ". North America follows at ",
            fact("$10.3 bn", S.woo, END_2025),
            " and Europe at ",
            fact("$10.2 bn", S.woo, END_2025),
            ".",
          ),
          p(
            "Digital screens took ",
            fact("47%", S.woo, END_2025),
            " of spending in 2025. The organization forecasts ",
            fact("49%", S.woo, "2026-12-31"),
            " of a ",
            fact("$56.4 bn", S.woo, "2026-12-31"),
            " market in 2026, which would bring digital close to half of all spending for the first time.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "articles",
      slug: "karnataka-draft-rules-bengaluru-outdoor-advertising",
      data: {
        ...base,
        pillar: "news",
        layout: "standard",
        title:
          "Karnataka's draft rules would auction Bengaluru's outdoor advertising by road stretch",
        standfirst:
          "The draft rules would hand each stretch of road to a licensed bidder. Their final status is not yet confirmed.",
        places: [T.bengaluru],
        tags: [T.regulation, T.permits],
        sources: [S.draft],
        publishedAt: hoursAgo(5),
        body: doc(
          p(
            "Karnataka has published draft rules that would reset how outdoor advertising is licensed in Bengaluru. Under the draft, stretches of road would be auctioned to licensed bidders, in place of licences granted site by site.",
          ),
          p(
            "For independent media owners the change matters. An auction by stretch could concentrate supply in fewer, larger hands.",
          ),
          p(
            "The city has a long record of unlicensed sites. A 2016 count found about ",
            fact("4,000", S.bbmp, "2016-12-31"),
            " of ",
            fact("6,000", S.bbmp, "2016-12-31"),
            " hoardings in Bengaluru were illegal.",
          ),
          p(
            "The final status of the rules had not been confirmed when this was written. We will update this piece when it is.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "articles",
      slug: "invidis-india-out-of-home-trust-problems",
      data: {
        ...base,
        pillar: "news",
        layout: "standard",
        title:
          "Fake proof photos and double-sold sites hold back India's out-of-home market, invidis reports",
        standfirst:
          "The trade title lists inflated traffic data, sites sold to several clients at once, swapped locations and edited proof-of-posting photos among the problems buyers face.",
        places: [T.india],
        tags: [T.trust],
        sources: [S.invidis],
        publishedAt: hoursAgo(26),
        body: doc(
          p(
            "Buyers of out-of-home advertising in India face a trust problem, the trade title invidis reported in August 2026.",
          ),
          p(
            "Among the practices it lists are inflated traffic figures, one structure sold to several clients for the same period, sites swapped for others after booking, and proof-of-posting photographs that have been faked or edited with AI tools.",
          ),
          p(
            "Verification is the answer the report points towards: a checked owner, a permit reference, and dated, geotagged photographs for every site.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "articles",
      slug: "programmatic-share-of-digital-out-of-home-2025",
      data: {
        ...base,
        pillar: "news",
        layout: "standard",
        title:
          "Programmatic is 8.4% of digital out-of-home spend, and most of it runs through private deals",
        standfirst:
          "WOO's member survey puts programmatic at $2.1 bn in 2025. Its separate exchange-data study counts $1.34 bn.",
        tags: [T.programmatic],
        publishedAt: hoursAgo(30),
        body: doc(
          p(
            "Programmatic trading accounted for ",
            fact("8.4%", S.woo, END_2025),
            " of digital out-of-home spend in 2025, or ",
            fact("$2.1 bn", S.woo, END_2025),
            ", in the World Out of Home Organization's member survey.",
          ),
          p(
            "The organization's separate study, built from exchange data, counts ",
            fact("$1.34 bn", S.wooProg, END_2025),
            " for the same year. The two figures measure different things and should not be added or averaged.",
          ),
          p(
            "About ",
            fact("two-thirds", S.broadsign, "2026-06-30"),
            " of programmatic spend runs through custom private deals, according to Broadsign's 2026 programmatic report. In India the share of programmatic is smaller still, at ",
            fact("1 to 2%", S.pwc, END_2025),
            " of digital spend, PwC estimates.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "articles",
      slug: "hidden-prices-cost-out-of-home-small-advertisers",
      data: {
        ...base,
        pillar: "analysis",
        layout: "standard",
        title: "Hidden prices cost out-of-home its small advertisers",
        standfirst:
          "A UK business was quoted £650 for a poster site an agency lists at £325. Most first-time buyers never get as far as a quote.",
        tags: [T.pricing],
        publishedAt: hoursAgo(50),
        body: doc(
          p(
            "Ask a search engine what a billboard costs and the answer is usually a contact form. For a small business, that is often where the enquiry ends.",
          ),
          h2("The same site, two prices"),
          p(
            "The Drum reported the case of a UK business quoted ",
            fact("£650", S.drum, "2026-10-01"),
            " for a 48-sheet poster site in Leeds that an agency publishes at ",
            fact("£325", S.drum, "2026-10-01"),
            ". With no public price, the buyer had no way to know.",
          ),
          h2("Cost is the first question"),
          p(
            "Cost is what people ask about first. ",
            fact("Six of the ten", S.searches, "2023-12-31"),
            " most common searches about out-of-home were about cost in a 2023 analysis by 75Media.",
          ),
          p(
            "Publishing a price is the owner's decision, and some have good reasons to keep theirs private. A “from” price, or a plain “price on request” with a fast reply, still tells a buyer the site is real and within reach.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "guides",
      slug: "what-is-digital-out-of-home",
      data: {
        ...base,
        kind: "explainer",
        title: "What is digital out-of-home? A plain guide for first-time advertisers",
        standfirst:
          "Digital out-of-home is advertising on screens in public places. It took 47% of out-of-home spend in 2025.",
        format: T.led,
        tags: [T.programmatic],
        lastRefreshedAt: hoursAgo(72),
        publishedAt: hoursAgo(72),
        body: doc(
          p(
            "Digital out-of-home, often shortened to DOOH, is advertising shown on screens in public places: roadside LED billboards, screens in malls and airports, and panels at bus shelters and metro stations.",
          ),
          h2("How big it is"),
          p(
            "Digital screens took ",
            fact("47%", S.woo, END_2025, { label: "Digital share of global out-of-home spend" }),
            " of global out-of-home spend in 2025. The share varies widely by market. Saudi Arabia leads at ",
            fact("87%", S.woo, END_2025, { label: "Digital share in Saudi Arabia" }),
            ", while across Asia-Pacific it is ",
            fact("55.7%", S.woo, END_2025),
            ".",
          ),
          h2("How it is sold"),
          p(
            "Most digital screens are still booked directly with the media owner, for a number of slots over a period. A screen usually shares its time between several advertisers, each shown for a few seconds in a repeating loop.",
          ),
          p(
            "A smaller part is bought programmatically through exchanges, which accounted for ",
            fact("8.4%", S.woo, END_2025),
            " of digital spend in 2025.",
          ),
          h2("How far ahead to book"),
          p(
            "Digital needs less notice than print, because nothing has to be printed or mounted. The median digital booking is made ",
            fact("14 days", S.leadTime, "2026-10-01", { label: "Median lead time, digital" }),
            " before launch, against ",
            fact("36 days", S.leadTime, "2026-10-01", { label: "Median lead time, static" }),
            " for static sites.",
          ),
          h2("What to ask the owner"),
          list("ul", [
            "Where exactly the screen is, and which way it faces.",
            "The spot length, the loop length and how many advertisers share it.",
            "Its operating hours, and whether it runs at night.",
            "The audience figure, with its source and its date.",
            "The price for the period you want, and the minimum booking.",
          ]),
          p(
            "An owner who answers these quickly and plainly is usually one worth booking with. If a figure comes without a source, ask for it. If a photograph looks like a rendering, ask for one taken from the road. None of these questions is unusual, and a good owner will have the answers ready before you ask. Compare two or three screens on the same road before you decide, because position and facing change what a screen is worth more than its size does. A screen that faces traffic waiting at a junction holds attention longer than one passed at speed, and the price should reflect that difference.",
          ),
          callout("note", SAMPLE),
        ),
      },
    },
    {
      collection: "articles",
      slug: "how-to-list-your-sites-on-ohworks",
      data: {
        ...base,
        pillar: "academy",
        layout: "standard",
        title: "How to list your sites on ohworks, and what each badge checks",
        standfirst:
          "Listing is free. Five steps take a site from your media kit to a public page, and five badges show buyers what has been checked.",
        tags: [T.permits, T.trust],
        publishedAt: hoursAgo(96),
        body: doc(
          h2("Five steps"),
          list("ol", [
            "Verify your company with its registration documents and a phone or WhatsApp code.",
            "Send your inventory as a spreadsheet, a set of photos or your PDF media kit.",
            "Pin each face on the map and check it against street-level imagery.",
            "Add day, night and approach photos. Photos taken in the ohworks app carry GPS and time stamps.",
            "Set your terms: an exact rate, a “from” price or price on request, with your minimum period.",
          ]),
          h2("What each badge checks"),
          list("ul", [
            "Verified owner: company documents and contact details.",
            "Verified location: coordinates match street-level imagery or a GPS-stamped photo.",
            "Permit on file: the permit or licence number, the issuing authority and the expiry date.",
            "Fresh: availability or photos updated within the last 30 days.",
            "Responsive: a median reply time under 24 hours.",
          ]),
          h2("What happens to enquiries"),
          p(
            "Every enquiry goes straight to you. ohworks does not resell it, reroute it or sit between you and the buyer.",
          ),
          callout(
            "charter",
            "ohworks never sells media or takes a media margin. Owners set prices and keep their clients.",
          ),
        ),
      },
    },
    {
      collection: "articles",
      slug: "how-ohworks-shows-a-campaign",
      data: {
        ...base,
        pillar: "showcase",
        layout: "immersive",
        hero: placeholder.id,
        title: "How ohworks will show a campaign",
        standfirst:
          "Every showcase piece names the sites a campaign ran on, with real, credited photographs. This sample shows the layout.",
        publishedAt: hoursAgo(120),
        body: doc(
          p(
            "A showcase piece opens on one photograph of the campaign in its street. The photograph is real, and it carries the name of the person who took it.",
          ),
          p(
            "Below the story, each site the campaign ran on links to its own page, so a reader who likes what they see can find out who owns it.",
          ),
          p(
            "Artwork mocked up on a face is always labelled as an example. A picture that is not a photograph is never presented as one.",
          ),
          callout(
            "note",
            "Sample piece for development. The image above is a placeholder, not a photograph.",
          ),
        ),
      },
    },
  ];

  for (const piece of pieces) {
    await payload.delete({
      collection: piece.collection,
      where: { slug: { equals: piece.slug } },
      overrideAccess: true,
    });
    const created = await payload.create({
      collection: piece.collection,
      data: { ...piece.data, slug: piece.slug } as never,
      user: admin,
      overrideAccess: true,
    });
    const words = countWords((piece.data as { body: unknown }).body);
    console.log(`published ${piece.collection}/${piece.slug} (${words} words, id ${created.id})`);
  }
  console.log(`demo content ready: ${pieces.length} pieces`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
