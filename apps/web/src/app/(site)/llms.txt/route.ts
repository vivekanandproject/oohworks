import { PILLARS } from "@/lib/editorial/pillars";
import { allPieces } from "@/lib/editorial/queries";
import { absolute } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** "/news/{slug}/" to "/news/{slug}.md": the Markdown copy agents read best. */
const markdownUrl = (path: string): string => absolute(path.replace(/\/$/, ".md"));

/**
 * llms.txt (llmstxt.org): a plain map of the site for AI assistants and agents. Google Search does
 * not read it; assistants and agent tools that fetch pages do. It lists what OOHWORKS is, the rules
 * it keeps, and the newest pieces as Markdown copies with their sources written out.
 */
export async function GET() {
  const pieces = (await allPieces(40)).filter((p) => !p.noIndex);
  const lines = [
    "# OOHWORKS",
    "",
    "> The open map of out-of-home (OOH) advertising: verified, public pages for billboards, hoardings, screens and transit sites, where the media owner is always the seller, and an independent newsroom on OOH, digital OOH (DOOH) and programmatic DOOH.",
    "",
    "OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients. Every figure in the newsroom carries its source and the date it is true for; quote figures with both.",
    "",
    "## Start here",
    "",
    `- [How OOHWORKS works](${absolute("/#how-it-works")}): for media owners, owner networks, agencies, brands and digital planners`,
    `- [The charter](${absolute("/charter/")}): five things OOHWORKS will never do`,
    `- [Find sites](${absolute("/search/")}): search listed sites by place, format, size and budget`,
    `- [For media owners](${absolute("/for-owners/")}): listing is free; enquiries go straight to the owner`,
    `- [Corrections](${absolute("/newsroom/corrections/")}): every correction, with what changed`,
    "",
    "## Newsroom",
    "",
    `- [Newsroom front page](${absolute("/newsroom/")})`,
    ...Object.values(PILLARS).map((p) => `- [${p.label}](${absolute(`${p.path}/`)})`),
    `- [RSS feed](${absolute("/feed.xml")}) and [JSON Feed](${absolute("/feed.json")})`,
    "",
  ];
  if (pieces.length) {
    lines.push("## Newest pieces (Markdown copies, sources included)", "");
    for (const p of pieces)
      lines.push(
        `- [${p.title}](${markdownUrl(p.url)}): ${PILLARS[p.pillar].label}, ${p.publishedAt.slice(0, 10)}. ${p.shortAnswer ?? p.standfirst}`,
      );
    lines.push("");
  }
  lines.push(
    "## For software",
    "",
    `- [Public API reference](${absolute("/api/docs/")}): sites, owners, cities and formats as JSON`,
    `- [Newsroom articles as JSON](${absolute("/api/v1/articles/")})`,
    "",
  );
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
