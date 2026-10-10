import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const closed = [
    "/search/",
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
