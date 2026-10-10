import { PILLARS } from "@/lib/editorial/pillars";
import { allPieces } from "@/lib/editorial/queries";
import { xml } from "@/lib/editorial/xml";
import { absolute, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** RSS 2.0 of the newest pieces across every section. */
export async function GET() {
  const pieces = await allPieces(50);
  const items = pieces
    .map(
      (p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${xml(absolute(p.url))}</link>
      <guid isPermaLink="true">${xml(absolute(p.url))}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${xml(p.standfirst)}</description>
      <category>${xml(PILLARS[p.pillar].label)}</category>
${p.authors.map((a) => `      <dc:creator>${xml(a.name)}</dc:creator>`).join("\n")}
    </item>`,
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ohworks newsroom</title>
    <link>${xml(absolute("/newsroom/"))}</link>
    <atom:link href="${xml(absolute("/feed.xml"))}" rel="self" type="application/rss+xml" />
    <description>Independent news, analysis and data on out-of-home advertising.</description>
    <language>en</language>
    <lastBuildDate>${new Date(pieces[0]?.publishedAt ?? Date.now()).toUTCString()}</lastBuildDate>
    <generator>${xml(siteUrl())}</generator>
${items}
  </channel>
</rss>
`;
  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
