import ExcelJS from "exceljs";
import { fileOf, go, ownerGate } from "@/lib/owners/request";
import { stateOf } from "@/lib/owners/progress";
import { saveOwnerFile, saveSite, siteByRef } from "@/lib/owners/server";
import { readSheet, type RowProblem } from "@/lib/owners/sheet";
import { indiaDate } from "@/lib/sites/calendar";

export const dynamic = "force-dynamic";

export interface ImportReport {
  name: string;
  created: { row: number; id: string; title: string }[];
  updated: { row: number; id: string; title: string }[];
  problems: RowProblem[];
  unknown: string[];
  refused: string | null;
}

/**
 * Reads an owner's filled-in template. Each row that is right becomes a draft site, or updates the
 * site with the same reference. Each row that is not is reported, and creates nothing.
 */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "import", 10);
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  if (!owner) return go("/owner/company/");
  const picked = fileOf(form, "sheet", "sheet");
  if ("problem" in picked) return go(`/owner/import/?error=${picked.problem}`);

  const report: ImportReport = {
    name: picked.file.name.slice(0, 120),
    created: [],
    updated: [],
    problems: [],
    unknown: [],
    refused: null,
  };
  try {
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await picked.file.arrayBuffer());
    const sheet = book.getWorksheet("Sites") ?? book.worksheets[0];
    if (!sheet) throw new Error("no sheet");
    const cells = (n: number): unknown[] => {
      const values = sheet.getRow(n).values;
      return Array.isArray(values) ? values.slice(1) : [];
    };
    const last = Math.min(sheet.rowCount, 2500);
    const rows: unknown[][] = [];
    for (let n = 2; n <= last; n += 1) rows.push(cells(n));
    const read = readSheet(cells(1), rows, indiaDate(Date.now()));
    report.problems = read.problems;
    report.unknown = read.unknown;
    report.refused = read.refused;
    for (const { row, site } of read.sites) {
      try {
        const existing = site.ownerRef ? await siteByRef(owner.id, site.ownerRef) : null;
        if (existing && stateOf(existing) === "live") {
          report.problems.push({
            row,
            column: "Your reference",
            problem: `“${site.ownerRef}” is already live. Change its price or availability on its own page; write to us to change anything else.`,
          });
          continue;
        }
        const saved = await saveSite(owner, site, "sheet", existing);
        (existing ? report.updated : report.created).push({
          row,
          id: saved.permanentId ?? "",
          title: saved.title ?? "",
        });
      } catch (error) {
        report.problems.push({
          row,
          column: "The whole row",
          problem: error instanceof Error ? error.message : "This row could not be saved.",
        });
      }
    }
  } catch {
    report.refused =
      "We could not open that file. Save it as an Excel workbook (.xlsx) and upload it again.";
  }
  report.problems.sort((a, b) => a.row - b.row);
  try {
    const file = await saveOwnerFile(owner, picked.file, "sheet", null, report);
    return go(`/owner/import/?file=${file.id}`);
  } catch {
    return go("/owner/import/?error=read");
  }
}
