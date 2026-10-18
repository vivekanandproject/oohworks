import { kitName, type KitReport } from "@/lib/owners/kit-reading";
import { ownerByEmail, ownerEmail, ownerFile } from "@/lib/owners/server";
import { sitesBook } from "@/lib/owners/sheet-book";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });

/**
 * The sites Claude read from one of the owner's media kits that could not become drafts, as a filled-in
 * template with each gap marked. The owner completes it and uploads it on /owner/import/. Only the owner
 * who sent the kit can download it.
 */
export async function GET(req: Request) {
  const email = await ownerEmail();
  const owner = email ? await ownerByEmail(email) : null;
  const id = Number(new URL(req.url).searchParams.get("file"));
  if (!owner || !Number.isInteger(id) || id <= 0) return notFound();
  const file = await ownerFile(owner.id, id);
  const report =
    file?.kind === "media_kit" && file.reading === "read"
      ? (file.report as KitReport | null)
      : null;
  if (!report?.needs?.length) return notFound();
  const data = await sitesBook(
    report.needs.map((r) => ({
      raw: r.raw,
      problems: r.problems,
      from: r.page ? `Page ${r.page} of your media kit` : undefined,
    })),
  );
  const base = kitName(file?.filename)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-");
  return new Response(data, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ohworks-sites-from-${base || "media-kit"}.xlsx"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
