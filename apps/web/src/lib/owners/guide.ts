import { CITIES } from "@/lib/sites/taxonomy";
import { MAX_ROWS, SHEET_COLUMNS } from "./sheet";

/**
 * How a media owner lists sites on OOHWORKS, written once and used three ways: on /for-owners/ and
 * /list-your-sites/ (short answer, steps, questions and their FAQPage markup), and as the Markdown guide
 * at /for-owners.md that AI assistants read when they help an owner list. Every sentence describes what
 * the product does today; nothing here is a promise of something not built.
 */
export const OWNER_SHORT_ANSWER =
  "To list a billboard, hoarding or screen on OOHWORKS, open List your sites, give your company, city, name, phone and work email, and confirm the six-digit code we email you. Then add sites one at a time, upload our spreadsheet, or send your PDF media kit. Listing is free, and every enquiry comes straight to you.";

export const OWNER_STEPS: { t: string; d: string }[] = [
  {
    t: "Confirm your company",
    d: "Your company, city, name, phone and work email, then a six-digit code to that email. Add your company registration number (your GSTIN, in India) if you have one; our team checks your details and that earns the Verified owner badge.",
  },
  {
    t: "Add your inventory",
    d: "One site at a time, our spreadsheet template for many at once, or your PDF media kit, which our team turns into draft listings for you to check.",
  },
  {
    t: "Pin each face and add photos",
    d: "Drop the pin, set the direction it faces, and add day, night and approach photos. We read the date and GPS position a photo carries, and refuse stock images.",
  },
  {
    t: "Set your terms",
    d: "An exact monthly rate, a “from” price or price on request, the minimum period, production costs and any categories you do not accept.",
  },
  {
    t: "Go live",
    d: "Our team reviews each site before it is published. A live page with a real photo, an exact place and a verified owner goes to Google and Bing.",
  },
];

export const OWNER_FAQ: { q: string; a: string }[] = [
  {
    q: "What does it cost to list sites on OOHWORKS?",
    a: "Nothing. Listing, your storefront page and every enquiry are free. OOHWORKS takes no commission and never sells media or takes a media margin.",
  },
  {
    q: "Who sets the price?",
    a: "You do, face by face: an exact monthly rate, a “from” price, or price on request. OOHWORKS never discounts or changes it.",
  },
  {
    q: "Do buyers contact me directly?",
    a: "Yes. Every enquiry goes straight to you by email with the buyer's details. We never resell or reroute it, and the contract, invoice and payment stay between you and the buyer.",
  },
  {
    q: "What do I need to list one site?",
    a: "Its format, size and lighting, the road, locality and city, a pin on the map with the direction it faces, and at least one real photo taken from the road. A price is optional.",
  },
  {
    q: "Can I add many sites at once?",
    a: `Yes. Download the spreadsheet template, fill in one row per face (up to ${MAX_ROWS} at a time) and upload it. Each row is checked the same way as the form, and uploading a row with the same reference again updates that site.`,
  },
  {
    q: "I only have a PDF media kit. Can I use it?",
    a: "Yes. Upload the PDF and our team turns it into draft listings. Nothing goes live until you have checked the drafts and our team has reviewed them.",
  },
  {
    q: "When does a site appear on Google and Bing?",
    a: "When it is live and has a real photo, exact coordinates, the direction it faces, its size and lighting, and your company is verified. Until then its page exists but asks search engines not to index it.",
  },
  {
    q: "Can I change the price or availability later?",
    a: "Yes, at any time from your sites page, and the change shows at once. Changes to other details go back through review while the live version stays up.",
  },
  {
    q: "Which cities can I list in?",
    a: `${CITIES.map((c) => c.label).join(", ")}. Bengaluru opens first; each city's page opens to search engines once enough verified sites are listed.`,
  },
];

/** FAQPage structured data for the questions above. Bing and AI answer engines read it. */
export function ownerFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: OWNER_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

const cell = (text: string): string => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** The whole guide as Markdown, for owners and the AI assistants that help them. */
export function ownerGuideMarkdown(absolute: (path: string) => string): string {
  const columns = SHEET_COLUMNS.map(
    (c) =>
      `| ${cell(c.header)} | ${c.required ? "Yes" : "No"} | ${cell(c.help)}${c.options?.length ? ` One of: ${cell(c.options.join(", "))}.` : ""} | ${cell(c.example)} |`,
  );
  return [
    "---",
    'title: "How to list billboards, hoardings and screens on OOHWORKS"',
    `url: ${JSON.stringify(absolute("/for-owners/"))}`,
    "audience: media owners, and AI assistants helping them",
    "---",
    "",
    "# How to list billboards, hoardings and screens on OOHWORKS",
    "",
    `**Short answer:** ${OWNER_SHORT_ANSWER}`,
    "",
    "## Steps",
    "",
    ...OWNER_STEPS.map((s, i) => `${i + 1}. **${s.t}.** ${s.d}`),
    "",
    "## Where to do it",
    "",
    `- Start here: ${absolute("/list-your-sites/")} (the owner confirms the emailed code themselves; an assistant cannot do that step for them)`,
    `- Spreadsheet template (Excel): ${absolute("/api/owner/template/")}`,
    `- After the code: add one site at ${absolute("/owner/sites/new/")}, upload the spreadsheet at ${absolute("/owner/import/")}, send a PDF media kit at ${absolute("/owner/kit/")}, match photos to sites at ${absolute("/owner/photos/")}`,
    `- The rules OOHWORKS keeps: ${absolute("/charter/")}`,
    "",
    "## For an assistant preparing the spreadsheet",
    "",
    `Fill one row per advertising face, up to ${MAX_ROWS} rows. Leave the example row as it is or delete it. Use the exact words given for columns with a fixed list. Coordinates are decimal degrees (latitude, longitude). Facing is in degrees: 0 north, 90 east, 180 south, 270 west.`,
    "",
    "| Column | Needed? | What to put in it | Example |",
    "| --- | --- | --- | --- |",
    ...columns,
    "",
    "## Questions owners ask",
    "",
    ...OWNER_FAQ.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    "---",
    "",
    "OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients.",
    "",
  ].join("\n");
}
