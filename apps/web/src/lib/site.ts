import type { Edition } from "@ohworks/ui";

/** Editions that exist today. The India edition joins this list when /in/ goes live. */
export const EDITIONS: Edition[] = [
  { code: "global", label: "Global edition", current: true },
  { code: "in", label: "India edition opens soon" },
];

export interface LaunchCity {
  slug: string;
  name: string;
  region: string;
  /** Indexable faces today. The card becomes a link only when the hub is above its threshold. */
  indexableFaces: number;
  hubThreshold: number;
}

export const LAUNCH_CITIES: LaunchCity[] = [
  {
    slug: "bengaluru",
    name: "Bengaluru",
    region: "Karnataka",
    indexableFaces: 0,
    hubThreshold: 25,
  },
  { slug: "mumbai", name: "Mumbai", region: "Maharashtra", indexableFaces: 0, hubThreshold: 25 },
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    region: "Delhi, Gurugram, Noida",
    indexableFaces: 0,
    hubThreshold: 25,
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    region: "Telangana",
    indexableFaces: 0,
    hubThreshold: 25,
  },
  { slug: "pune", name: "Pune", region: "Maharashtra", indexableFaces: 0, hubThreshold: 25 },
  { slug: "chennai", name: "Chennai", region: "Tamil Nadu", indexableFaces: 0, hubThreshold: 25 },
];

export const CHARTER = [
  {
    title: "We never sell media or take a media margin.",
    body: "No planning, no buying, no managed campaigns. That is the line other marketplaces crossed when they became agencies.",
  },
  {
    title: "The owner sets the price.",
    body: "An exact rate, a “from” price or price on request. ohworks never discounts an owner’s rate.",
  },
  {
    title: "The owner owns the client.",
    body: "Every enquiry goes straight to the owner. We never resell it, reroute it or sit between you.",
  },
  {
    title: "We never contact a buyer’s clients.",
    body: "An agency’s plans and client names stay private. We will never compete with you.",
  },
  {
    title: "Every number shows its source.",
    body: "Audience figures carry a named source and date, and anything paid is labelled “paid placement”.",
  },
] as const;

export const HERO_FACT = {
  text: "Global OOH spend was $54.2 bn in 2025, up 15% on the year.",
  source: "WOO Global OOH Expenditure Report 2026",
  href: "https://www.worldooh.org/news/woo-global-ooh-expenditure-report-2026",
  asOf: "Oct 2026",
};
