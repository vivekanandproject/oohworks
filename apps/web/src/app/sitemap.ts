import type { MetadataRoute } from "next";
import { PILLARS, PILLAR_KEYS } from "@/lib/editorial/pillars";
import { allPieces, authorsOf, pillarCounts } from "@/lib/editorial/queries";
import { absolute } from "@/lib/seo";
import { indexableOwnerUrls, indexableSiteUrls, publishedHubs } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

/**
 * Static pages and everything the newsroom has published. Section indexes join only when they hold
 * something. Site pages join once they meet the content bar; a sample listing never does. An owner's page
 * joins once they are verified and have such a site. Shards by city come with the indexing job (M2).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = new Date("2026-10-10");
  const pages: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: fixed, changeFrequency: "daily", priority: 1 },
    { url: absolute("/charter/"), lastModified: fixed, changeFrequency: "yearly", priority: 0.6 },
    {
      url: absolute("/for-owners/"),
      lastModified: fixed,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
  pages.push({
    url: absolute("/list-your-sites/"),
    lastModified: fixed,
    changeFrequency: "monthly",
    priority: 0.8,
  });
  pages.push({
    url: absolute("/how-results-are-ordered/"),
    lastModified: fixed,
    changeFrequency: "yearly",
    priority: 0.4,
  });
  const [pieces, counts, sites, hubs, owners] = await Promise.all([
    allPieces(),
    pillarCounts(),
    indexableSiteUrls(),
    publishedHubs(),
    indexableOwnerUrls(),
  ]);
  for (const o of owners) {
    pages.push({
      url: absolute(o.url),
      lastModified: new Date(o.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  for (const h of hubs) {
    pages.push({
      url: absolute(h.url),
      lastModified: new Date(h.updatedAt),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }
  for (const s of sites) {
    pages.push({
      url: absolute(s.url),
      lastModified: new Date(s.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  if (pieces.length === 0) return pages;

  const newest = new Date(pieces[0]?.updatedAt ?? fixed);
  pages.push({
    url: absolute("/newsroom/"),
    lastModified: newest,
    changeFrequency: "daily",
    priority: 0.9,
  });
  pages.push({
    url: absolute("/newsroom/all/"),
    lastModified: newest,
    changeFrequency: "daily",
    priority: 0.5,
  });
  pages.push({
    url: absolute("/newsroom/corrections/"),
    lastModified: fixed,
    changeFrequency: "monthly",
    priority: 0.3,
  });
  for (const key of PILLAR_KEYS) {
    if (counts[key] === 0) continue;
    const latest = pieces.find((p) => p.pillar === key);
    pages.push({
      url: absolute(`${PILLARS[key].path}/`),
      lastModified: new Date(latest?.updatedAt ?? newest),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }
  for (const p of pieces) {
    if (p.noIndex) continue;
    pages.push({
      url: absolute(p.url),
      lastModified: new Date(p.updatedAt),
      changeFrequency: p.pillar === "news" ? "never" : "monthly",
      priority: p.pillar === "news" ? 0.6 : 0.8,
    });
  }
  for (const a of authorsOf(pieces)) {
    pages.push({
      url: absolute(`/authors/${a.slug}/`),
      lastModified: newest,
      changeFrequency: "weekly",
      priority: 0.4,
    });
  }
  return pages;
}
