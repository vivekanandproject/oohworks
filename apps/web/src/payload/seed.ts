/**
 * Local and staging seed: users, people, tags, companies and the source registry.
 * Idempotent: finds by slug or title before creating. Run with `pnpm --filter @ohworks/web seed`.
 */
import { getPayload, type Payload } from "payload";
import config from "../payload.config";

const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ohworks-admin-local";
const RETRIEVED = "2026-10-09";

async function ensure<T extends Record<string, unknown>>(
  payload: Payload,
  collection: string,
  where: Record<string, unknown>,
  data: T,
) {
  const found = await payload.find({
    collection: collection as never,
    where: where as never,
    limit: 1,
    overrideAccess: true,
  });
  if (found.docs[0]) return found.docs[0] as T & { id: number | string };
  return (await payload.create({
    collection: collection as never,
    data: data as never,
    overrideAccess: true,
  })) as T & { id: number | string };
}

async function main() {
  const payload = await getPayload({ config });

  for (const u of [
    { email: "admin@ohworks.local", name: "Local admin", role: "admin" },
    { email: "editor@ohworks.local", name: "Local editor", role: "editor" },
    { email: "writer@ohworks.local", name: "Local writer", role: "writer" },
  ]) {
    await ensure(payload, "users", { email: { equals: u.email } }, { ...u, password: PASSWORD });
  }

  const places = [
    "India",
    "Bengaluru",
    "Mumbai",
    "Delhi NCR",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Koramangala",
  ];
  const formats = ["Hoarding", "Unipole", "Gantry", "Bus shelter", "LED screen", "Transit"];
  const themes = [
    "Regulation",
    "Pricing",
    "Programmatic",
    "Measurement",
    "Contracts",
    "People moves",
    "Permits",
    "Trust and verification",
  ];
  for (const [kind, names] of [
    ["place", places],
    ["format", formats],
    ["theme", themes],
  ] as const) {
    for (const name of names)
      await ensure(payload, "tags", { name: { equals: name } }, { name, kind });
  }

  for (const c of [
    { name: "World Out of Home Organization", type: "association" },
    { name: "OAAA", type: "association" },
    { name: "Indian Outdoor Advertising Association", type: "association" },
    { name: "BBMP", type: "authority" },
    { name: "Brihanmumbai Municipal Corporation", type: "authority" },
    { name: "Pitch Madison", type: "publisher" },
    { name: "invidis", type: "publisher" },
  ]) {
    await ensure(payload, "companies", { name: { equals: c.name } }, c);
  }

  await ensure(
    payload,
    "people",
    { slug: { equals: "editorial-desk" } },
    {
      name: "ohworks editorial desk",
      slug: "editorial-desk",
      role: "Editorial desk",
      bio: "Pieces without a single author: data reports, briefings and corrections. Every figure carries its source and date.",
      credentials: [{ item: "Publishes the ohworks price index" }],
    },
  );

  const sources = [
    {
      title: "WOO Global Out of Home Expenditure Report 2026",
      publisher: "World Out of Home Organization",
      url: "https://www.worldooh.org/news/woo-global-ooh-expenditure-report-2026",
      type: "report",
      publishedOn: "2026-06-01",
    },
    {
      title: "Global OOH spend jumps 15%",
      publisher: "AdNews",
      url: "https://www.adnews.com.au/news/global-ooh-spend-jumps-15",
      type: "article",
    },
    {
      title: "2025 OOH Ad Spend Performance Facts and Figures",
      publisher: "OAAA",
      url: "https://oaaa.org/wp-content/uploads/2026/04/2025-OOH-Ad-Spend-Performance-Facts-and-Figures-FINAL.pdf",
      type: "report",
      publishedOn: "2026-04-01",
    },
    {
      title: "Pitch Madison report: OOH expected to grow at 12% in 2025",
      publisher: "exchange4media",
      url: "https://www.exchange4media.com/out-of-home-news/pmar-ooh-expected-to-grow-at-12-in-2025-140840.html",
      type: "article",
    },
    {
      title: "PwC forecast for India OOH",
      publisher: "media4growth",
      url: "https://www.media4growth.com/?p=81251",
      type: "article",
    },
    {
      title: "India's OOH trust deficit: five challenges holding back the market",
      publisher: "invidis",
      url: "https://invidis.com/news/2026/08/indias-ooh-trust-deficit-five-challenges-holding-back-the-market/",
      type: "article",
      publishedOn: "2026-08-01",
    },
    {
      title: "Karnataka unveils draft 2025 rules to reset Bengaluru's outdoor advertising",
      publisher: "exchange4media",
      url: "https://www.exchange4media.com/out-of-home-news/karnataka-unveils-draft-2025-rules-to-reset-bengalurus-outdoor-advertising-149472.html",
      type: "article",
    },
    {
      title: "Broadsign 2026 programmatic report",
      publisher: "Billboard Insider",
      url: "https://billboardinsider.com/broadsign-issues-2026-programmatic-report/",
      type: "report",
    },
    {
      title: "VIOOH State of the Nation 2026",
      publisher: "PPC Land",
      url: "https://ppc.land/pdooh-investment-set-to-surge-44-as-programmatic-takes-over-half-of-campaigns/",
      type: "report",
    },
    {
      title: "OpenOOH venue taxonomy 1.2",
      publisher: "OpenOOH",
      url: "https://github.com/openooh/venue-taxonomy/blob/main/specification-1.2.md",
      type: "report",
    },
    {
      title: "Google Search spam policies",
      publisher: "Google",
      url: "https://developers.google.com/search/docs/essentials/spam-policies",
      type: "filing",
      publishedOn: "2026-08-28",
    },
    {
      title: "ohworks listing data",
      publisher: "ohworks",
      type: "ohworks",
      notes: "Computed from live listings. Each report states its method, sample and period.",
    },
  ];
  for (const s of sources)
    await ensure(
      payload,
      "sources",
      { title: { equals: s.title } },
      { ...s, retrievedOn: RETRIEVED },
    );

  const counts: Record<string, number> = {};
  for (const c of ["users", "tags", "companies", "people", "sources"]) {
    counts[c] = (await payload.count({ collection: c as never, overrideAccess: true })).totalDocs;
  }
  console.log("seeded:", JSON.stringify(counts));
  console.log(`admin login: admin@ohworks.local / ${PASSWORD} (local only)`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
