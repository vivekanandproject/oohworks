import { rateLimited } from "@/lib/forms";
import { sitesBook } from "@/lib/owners/sheet-book";

export const dynamic = "force-dynamic";

/** The template never changes while the site runs, so it is built once and handed out from memory. */
let built: Promise<ArrayBuffer> | null = null;

/**
 * The blank spreadsheet an owner fills in (sitesBook): a heading for each fact, drop-downs, an example
 * row, and a second sheet that says what goes in each column.
 */
export async function GET(req: Request) {
  if (rateLimited(req, "owner-template", 30))
    return new Response("Too many downloads in a short time. Try again in a minute.", {
      status: 429,
    });
  built ??= sitesBook(null);
  let data: ArrayBuffer;
  try {
    data = await built;
  } catch (error) {
    built = null;
    throw error;
  }
  return new Response(data.slice(0), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="oohworks-sites-template.xlsx"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
