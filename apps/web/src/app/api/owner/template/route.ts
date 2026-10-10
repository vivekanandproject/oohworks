import ExcelJS from "exceljs";
import { rateLimited } from "@/lib/forms";
import { MAX_ROWS, SHEET_COLUMNS } from "@/lib/owners/sheet";

export const dynamic = "force-dynamic";

/** Column letters: A, B … Z, AA, AB. */
const letter = (n: number): string =>
  (n > 26 ? letter(Math.floor((n - 1) / 26)) : "") + String.fromCharCode(65 + ((n - 1) % 26));

/** The template never changes while the site runs, so it is built once and handed out from memory. */
let built: Promise<ArrayBuffer> | null = null;

async function build(): Promise<ArrayBuffer> {
  const book = new ExcelJS.Workbook();
  book.creator = "ohworks";
  const sheet = book.addWorksheet("Sites", { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  sheet.columns = SHEET_COLUMNS.map((c) => ({ header: c.header, width: c.width }));
  const head = sheet.getRow(1);
  head.height = 32;
  head.alignment = { vertical: "middle", wrapText: true };
  SHEET_COLUMNS.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.font = { bold: true, color: { argb: c.required ? "FFF6F5F2" : "FF101C30" } };
    // Needed columns are navy; optional ones are pale. The second sheet says the same in words.
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: c.required ? "FF101C30" : "FFECEBE6" },
    };
    cell.note = `${c.required ? "Needed. " : "Optional. "}${c.help}`;
  });
  const example = sheet.addRow(SHEET_COLUMNS.map((c) => c.example));
  example.font = { italic: true, color: { argb: "FF56606F" } };
  example.getCell(1).note =
    "This row is an example. It is left out when you upload. Add your sites from the next row down.";
  // A drop-down is one rule over the whole column, not one a cell, which keeps the file small and quick to read back.
  const rules = (
    sheet as unknown as {
      dataValidations: { add: (range: string, rule: ExcelJS.DataValidation) => void };
    }
  ).dataValidations;
  SHEET_COLUMNS.forEach((c, i) => {
    if (!c.options) return;
    rules.add(`${letter(i + 1)}2:${letter(i + 1)}${MAX_ROWS + 2}`, {
      type: "list",
      allowBlank: !c.required,
      formulae: [`"${c.options.join(",")}"`],
      showErrorMessage: true,
      errorTitle: c.header,
      error: `Choose one of: ${c.options.join(", ")}`,
    });
  });

  const guide = book.addWorksheet("How to fill it in");
  guide.columns = [
    { header: "Column", width: 26 },
    { header: "Needed?", width: 10 },
    { header: "What to put in it", width: 96 },
    { header: "Example", width: 30 },
  ];
  guide.getRow(1).font = { bold: true };
  guide.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECEBE6" } };
  for (const c of SHEET_COLUMNS)
    guide.addRow([
      c.header,
      c.required ? "Yes" : "No",
      c.help,
      c.example === "EXAMPLE" ? "KRM-014" : c.example,
    ]).alignment = { vertical: "top", wrapText: true };
  for (const line of [
    "",
    "One row for each site. Up to 500 sites in one file.",
    "Leave a cell empty if you do not know it. An empty cell is better than a guess: every figure a buyer sees must be yours.",
    "An audience figure is accepted only with its source and the date it was measured.",
    "Listing is free. ohworks never sells media or takes a media margin. You set the price and keep the client.",
  ])
    guide.addRow([line]);
  return (await book.xlsx.writeBuffer()) as ArrayBuffer;
}

/**
 * The spreadsheet an owner fills in: one row a site, a heading for each fact, drop-downs where there
 * is a fixed choice, an example row, and a second sheet that says what goes in each column.
 */
export async function GET(req: Request) {
  if (rateLimited(req, "owner-template", 30))
    return new Response("Too many downloads in a short time. Try again in a minute.", {
      status: 429,
    });
  built ??= build();
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
      "Content-Disposition": 'attachment; filename="ohworks-sites-template.xlsx"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
