import { ownerGuideMarkdown } from "@/lib/owners/guide";
import { absolute } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * How to list sites, as Markdown: served at /for-owners.md and /list-your-sites.md through the
 * middleware, for owners and the AI assistants that help them list. The spreadsheet columns come
 * from the template itself, so the guide never disagrees with it.
 */
export function GET() {
  return new Response(ownerGuideMarkdown(absolute), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${absolute("/for-owners/")}>; rel="canonical"`,
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
