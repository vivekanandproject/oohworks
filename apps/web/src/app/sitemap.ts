import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

/**
 * Static pages. Unit, hub and owner sitemaps are generated as shards by the indexing job
 * and served from object storage; they join this index in M2.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-09");
  return [
    { url: absolute("/"), lastModified, changeFrequency: "daily", priority: 1 },
    { url: absolute("/charter/"), lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: absolute("/for-owners/"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absolute("/guides/"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: absolute("/news/"), lastModified, changeFrequency: "daily", priority: 0.7 },
  ];
}
