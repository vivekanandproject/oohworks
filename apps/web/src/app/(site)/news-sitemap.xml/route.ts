import { listPillar } from "@/lib/editorial/queries";
import { xml } from "@/lib/editorial/xml";
import { absolute } from "@/lib/seo";

export const dynamic = "force-dynamic";

const TWO_DAYS = 48 * 3600 * 1000;

/** Google News sitemap: news pieces from the last 48 hours. Sponsored pieces never appear in it. */
export async function GET() {
  const { items } = await listPillar("news", 1, 100);
  const recent = items.filter(
    (p) => !p.sponsor && !p.noIndex && Date.now() - new Date(p.publishedAt).getTime() < TWO_DAYS,
  );
  const urls = recent
    .map(
      (p) => `  <url>
    <loc>${xml(absolute(p.url))}</loc>
    <news:news>
      <news:publication>
        <news:name>ohworks</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${xml(p.publishedAt)}</news:publication_date>
      <news:title>${xml(p.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
