import type { MetadataRoute } from "next";
import { hiddenFromSearch } from "@/lib/api/env";
import { absolute } from "@/lib/seo";

// Read when asked for, not when built: one image serves staging and then production.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // A preview or staging copy of the site is closed to every crawler.
  if (hiddenFromSearch()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const closed = [
    "/search/",
    "/enquire/",
    "/enquiries/",
    "/reply/",
    "/shortlist/",
    "/compare/",
    "/quick/",
    "/sign-in/",
    "/newsroom/subscribed/",
    "/api/",
    "/admin/",
    "/og/",
    "/owner/",
    "/buyer/",
  ];
  return {
    rules: [
      // Filtered, sorted and search views are never indexed; hubs, unit pages and articles are.
      { userAgent: "*", allow: "/", disallow: ["/*?*", ...closed] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: closed },
      { userAgent: "PerplexityBot", allow: "/", disallow: closed },
    ],
    sitemap: [absolute("/sitemap.xml"), absolute("/news-sitemap.xml")],
  };
}
