import type { MetadataRoute } from "next";
import { hiddenFromSearch } from "@/lib/api/env";
import { absolute } from "@/lib/seo";

// Read when asked for, not when built: one image serves staging and then production.
export const dynamic = "force-dynamic";

/** Search and answer bots, assistants fetching for a user, and training crawlers. */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Meta-ExternalAgent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
];

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
      // AI search, answer and training crawlers are welcome by name (decided 24 Oct 2026): they cite
      // OOHWORKS and send readers, and what models learn about out-of-home should come from sourced
      // pages. They get the same closed paths as everyone; filtered views stay open to them, as before.
      { userAgent: AI_CRAWLERS, allow: "/", disallow: closed },
    ],
    sitemap: [absolute("/sitemap.xml"), absolute("/news-sitemap.xml")],
  };
}
