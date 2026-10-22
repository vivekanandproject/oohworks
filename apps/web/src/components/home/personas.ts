/**
 * "How it works, for you" on the home page: one tab per kind of visitor. Each step says what the
 * visitor does and, where OOHWORKS does work for them, what that work is (`we`). Only what the product
 * does today is promised here; see docs/oohworks-website-concept.md section 6.
 */
export interface PersonaStep {
  title: string;
  body: string;
  we?: string;
}

export interface Persona {
  key: "owners" | "networks" | "agencies" | "brands" | "digital";
  tab: string;
  promise: string;
  steps: PersonaStep[];
  action: { label: string; href: string };
}

export const PERSONAS: Persona[] = [
  {
    key: "owners",
    tab: "Media owners",
    promise: "Your sites, found by every buyer, at no cost. Enquiries come straight to you.",
    steps: [
      {
        title: "List free",
        body: "Add sites one by one, upload your spreadsheet, or send your PDF media kit.",
        we: "We turn a media kit into draft listings for you to check.",
      },
      {
        title: "Get verified",
        body: "Your company details and a photo of each site from the road.",
        we: "We check every photo for stock images and for pictures already used on another site.",
      },
      {
        title: "Be found",
        body: "Each site gets its own page, in every buyer's search and on Google.",
        we: "The page updates itself when you change a price or mark a site booked.",
      },
      {
        title: "Hear from buyers directly",
        body: "Enquiries come to you by email, with the buyer's details. You set the price and keep the client. No commission.",
      },
    ],
    action: { label: "List your sites free", href: "/list-your-sites/" },
  },
  {
    key: "networks",
    tab: "Owner networks",
    promise: "A neutral shop window that no rival owns, with full control of what is shown.",
    steps: [
      {
        title: "Bring the whole inventory",
        body: "One spreadsheet for every face, or send us what you have.",
        we: "We check every row the way we check a single site, and flag likely duplicates.",
      },
      {
        title: "Choose what shows",
        body: "An exact rate, a “from” price or price on request, face by face.",
      },
      {
        title: "Stay neutral",
        body: "No other owner runs OOHWORKS, and we never sell media against you.",
      },
      {
        title: "One storefront",
        body: "A public page for your company with every site, and every enquiry for every face in one place.",
      },
    ],
    action: { label: "How listing works", href: "/for-owners/" },
  },
  {
    key: "agencies",
    tab: "Agencies",
    promise:
      "The fastest way to find and check any site, including the independents no exchange carries. We will never compete with you.",
    steps: [
      {
        title: "Describe the brief",
        body: "Place, road, format, size and budget, in plain words.",
        we: "The search reads the brief into filters you can see and change.",
      },
      {
        title: "Check every site",
        body: "Coordinates and facing, dated photos, permits, and audience figures with a named source.",
      },
      {
        title: "Plan and ask once",
        body: "Shortlist, compare and export. One enquiry for a whole plan reaches each owner on its own.",
        we: "Replies from every owner come back into one thread.",
      },
      {
        title: "Your clients stay yours",
        body: "No media sales, no contact with your clients, and your plans are never shared.",
      },
    ],
    action: { label: "Read what we never do", href: "/charter/" },
  },
  {
    key: "brands",
    tab: "Brands and businesses",
    promise: "See real sites, real owners and real prices, then ask in one step.",
    steps: [
      {
        title: "Say where",
        body: "“Hoardings near Silk Board under 1 lakh”, or pick a city and a format.",
      },
      {
        title: "See what you would get",
        body: "Photos from the street, the size, the lighting, a “from” price and the owner's name.",
      },
      {
        title: "Ask in one step",
        body: "Your enquiry goes straight to the owner, who replies to you directly.",
      },
      {
        title: "Learn as you go",
        body: "Guides on what outdoor advertising costs and how to choose a site.",
      },
    ],
    action: { label: "Search sites", href: "/search/" },
  },
  {
    key: "digital",
    tab: "Digital and programmatic",
    promise: "Screens you can plan against, with the specs a digital planner expects.",
    steps: [
      {
        title: "Plan against specs",
        body: "Resolution, spot length, loop length and hours for every screen.",
      },
      {
        title: "See how a screen is bought",
        body: "Where an owner sells a screen through an exchange, its page names the exchange. Exchanges are partners, not rivals.",
      },
      {
        title: "Mix static and digital",
        body: "Screens and hoardings in one shortlist, one comparison and one enquiry.",
      },
      {
        title: "Exact places",
        body: "Coordinates to five decimals and the direction each screen faces.",
      },
    ],
    action: { label: "Browse LED screens", href: "/search/?format=led-screen" },
  },
];
