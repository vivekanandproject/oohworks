import { permanentIdFromSlug } from "@ohworks/core";
import { absolute } from "@/lib/seo";
import { siteMarkdown } from "@/lib/sites/markdown";
import { getSite, photoUrls } from "@/lib/sites/queries";
import { isIndexable, siteUrl } from "@/lib/sites/view";

export const dynamic = "force-dynamic";

/**
 * The Markdown copy of a site page, at the page's own address with ".md" for the closing slash
 * (/in/{city}/{locality}/{slug}.md, rewritten here by the middleware). Only pages search engines may
 * index have one; search engines are pointed back at the page itself.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ unit: string }> }) {
  const id = permanentIdFromSlug((await params).unit);
  const found = id ? await getSite(id) : null;
  if (!found || !isIndexable(found.site, found.owner)) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const { site, owner } = found;
  return new Response(siteMarkdown(site, owner, photoUrls(site), Date.now()), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${absolute(siteUrl(site))}>; rel="canonical"`,
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
