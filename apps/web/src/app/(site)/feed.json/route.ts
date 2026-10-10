import { PILLARS } from "@/lib/editorial/pillars";
import { allPieces } from "@/lib/editorial/queries";
import { absolute } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** JSON Feed 1.1 of the newest pieces across every section. */
export async function GET() {
  const pieces = await allPieces(50);
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "ohworks newsroom",
    home_page_url: absolute("/newsroom/"),
    feed_url: absolute("/feed.json"),
    description: "Independent news, analysis and data on out-of-home advertising.",
    language: "en",
    items: pieces.map((p) => ({
      id: absolute(p.url),
      url: absolute(p.url),
      title: p.title,
      summary: p.standfirst,
      date_published: p.publishedAt,
      date_modified: p.updatedAt,
      authors: p.authors.map((a) => ({
        name: a.name,
        ...(a.slug ? { url: absolute(`/authors/${a.slug}/`) } : {}),
      })),
      tags: [PILLARS[p.pillar].label, ...p.places.map((t) => t.name), ...p.tags.map((t) => t.name)],
    })),
  };
  return Response.json(feed, {
    headers: {
      "content-type": "application/feed+json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
