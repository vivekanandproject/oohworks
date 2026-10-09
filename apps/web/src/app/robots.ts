import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      // Filtered and sorted views are never indexed.
      { userAgent: "*", allow: "/", disallow: ["/*?*", "/api/", "/admin/", "/owner/", "/buyer/"] },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
    ],
    sitemap: `${base}/sitemap-index.xml`,
  };
}
