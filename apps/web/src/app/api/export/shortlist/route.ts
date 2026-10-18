import ExcelJS from "exceljs";
import { rateLimited } from "@/lib/forms";
import { absolute } from "@/lib/seo";
import { indiaDate } from "@/lib/sites/calendar";
import { isDay } from "@/lib/sites/enquiry-form";
import { exportTable, plainCell, toCsv } from "@/lib/sites/export";
import { LISTS, parseIds } from "@/lib/sites/lists";
import { readLists } from "@/lib/sites/lists-server";
import { cardsFor } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

const NOTE =
  "Every figure is the owner's own. OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients.";

/**
 * A shortlist as a standard site sheet: one row a site, the same columns every time. Excel by default,
 * CSV on request. The sites come from the address, or from the buyer's own shortlist.
 */
export async function GET(req: Request) {
  if (rateLimited(req, "export", 20))
    return new Response("Too many downloads in a short time. Try again in a minute.", {
      status: 429,
    });
  const url = new URL(req.url);
  const asked = parseIds(url.searchParams.get("sites"), LISTS.saved.max);
  const ids = asked.length ? asked : (await readLists()).saved;
  const cards = await cardsFor(ids);
  if (cards.length === 0) return new Response("There are no sites to export.", { status: 404 });

  const from = isDay(url.searchParams.get("from") ?? "")
    ? (url.searchParams.get("from") as string)
    : undefined;
  const now = Date.now();
  const today = indiaDate(now);
  const { columns, rows } = exportTable(cards, now, absolute, from);
  const common = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

  if (url.searchParams.get("format") === "csv") {
    return new Response(toCsv(columns, rows), {
      headers: {
        ...common,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="oohworks-shortlist-${today}.csv"`,
      },
    });
  }

  const book = new ExcelJS.Workbook();
  book.creator = "OOHWORKS";
  book.created = new Date(now);
  const sheet = book.addWorksheet("Sites", { views: [{ state: "frozen", xSplit: 2, ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({
    header: c.header,
    width: c.width,
    ...(c.money ? { style: { numFmt: "#,##,##0" } } : {}),
  }));
  // Text is written as text. A cell that begins with "=" stays a word, never a formula.
  for (const row of rows) sheet.addRow(row.map((v) => (typeof v === "string" ? plainCell(v) : v)));
  const head = sheet.getRow(1);
  head.font = { bold: true, color: { argb: "FF101C30" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECEBE6" } };
  head.alignment = { vertical: "middle", wrapText: true };
  head.height = 30;
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const about = book.addWorksheet("About this sheet");
  about.columns = [{ width: 110 }];
  for (const line of [
    `Exported from OOHWORKS on ${today}. ${cards.length} ${cards.length === 1 ? "site" : "sites"}.`,
    "A blank cell means the owner has not given that fact. Ask them.",
    "Rates are a month, before taxes, printing and mounting. A “from” price is a floor, not the rate.",
    "An audience figure is shown only with its named source and the date it was measured.",
    NOTE,
  ])
    about.addRow([line]);

  const data = await book.xlsx.writeBuffer();
  return new Response(data as ArrayBuffer, {
    headers: {
      ...common,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="oohworks-shortlist-${today}.xlsx"`,
    },
  });
}
