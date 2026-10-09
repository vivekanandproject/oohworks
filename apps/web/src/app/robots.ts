import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Filtered, sorted and search views are never indexed; hubs and unit pages are.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*?*", "/search/", "/sign-in/", "/api/", "/admin/", "/owner/", "/buyer/"],
      },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/search/", "/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/search/", "/api/"] },
    ],
    sitemap: absolute("/sitemap.xml"),
  };
}
