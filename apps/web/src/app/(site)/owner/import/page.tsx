import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import type { ImportReport } from "@/app/api/owner/import/route";
import { ownerFile, requireOwner } from "@/lib/owners/server";
import { MAX_ROWS } from "@/lib/owners/sheet";
import { maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Upload a spreadsheet of sites",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  missing: "Choose your spreadsheet first.",
  big: "That file is over 5 MB. A spreadsheet of sites is far smaller; remove any pictures from it.",
  type: "Upload an Excel workbook: a file ending in .xlsx.",
  read: "We could not open that file. Save it as an Excel workbook (.xlsx) and upload it again.",
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function ImportPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const fileId = Number(one(q.file));
  const file = Number.isInteger(fileId) && fileId > 0 ? await ownerFile(owner.id, fileId) : null;
  const report = file?.kind === "sheet" ? (file.report as ImportReport | null) : null;
  const added = (report?.created.length ?? 0) + (report?.updated.length ?? 0);

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="import" />
        <div className="mt-6">
          <p className="t-label text-ink-muted">
            <a href="/owner/" className="oh-link">
              Your sites
            </a>
          </p>
          <h1 className="t-display-md mt-2">Upload a spreadsheet</h1>
          <p className="t-body text-ink-muted mt-2 max-w-[68ch]">
            For many sites at once. Each row that is right becomes a draft that only you can see.
            Each row that is not is listed with what to fix, and creates nothing.
          </p>
        </div>

        {ERRORS[one(q.error)] ? (
          <div className="mt-5">
            <Notice tone="error" title={ERRORS[one(q.error)] ?? ""} section="import-error" />
          </div>
        ) : null}

        {report ? (
          <section className="mt-6 space-y-3" data-section="import-report">
            <h2 className="t-display-sm">
              What we found in <span className="font-mono text-[18px]">{report.name}</span>
            </h2>
            {report.refused ? (
              <Notice tone="error" title="Nothing was added." section="import-refused">
                {report.refused}
              </Notice>
            ) : null}
            {added ? (
              <Notice
                tone="success"
                title={
                  [
                    report.created.length
                      ? `${report.created.length === 1 ? "1 site" : `${report.created.length} sites`} added as ${report.created.length === 1 ? "a draft" : "drafts"}`
                      : null,
                    report.updated.length
                      ? `${report.updated.length === 1 ? "1 site" : `${report.updated.length} sites`} updated`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(", ") + "."
                }
                section="import-added"
              >
                Add photographs to them, then{" "}
                <a href="/owner/" className="oh-link">
                  send them for review from your sites
                </a>
                .
              </Notice>
            ) : null}
            {report.problems.length ? (
              <>
                <Notice
                  tone="warning"
                  title={
                    report.problems.length === 1
                      ? "1 thing needs fixing."
                      : `${report.problems.length} things need fixing.`
                  }
                  section="import-problems-note"
                >
                  Nothing was created for those rows. Correct them in your file and upload it again.
                  Give each site &ldquo;Your reference&rdquo; and uploading again will update it,
                  not double it.
                </Notice>
                <div
                  className="border-hairline relative overflow-x-auto rounded-md border"
                  tabIndex={0}
                  role="region"
                  aria-label="Rows that need fixing"
                >
                  <table className="oh-table w-full min-w-[560px]" data-section="import-problems">
                    <thead>
                      <tr>
                        <th scope="col">Row</th>
                        <th scope="col">Column</th>
                        <th scope="col">What to fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.problems.map((p, i) => (
                        <tr key={`${p.row}-${p.column}-${i}`}>
                          <td className="data">{p.row}</td>
                          <td>{p.column}</td>
                          <td>{p.problem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
            {report.unknown.length ? (
              <p className="t-small text-ink-muted" data-section="import-unknown">
                {report.unknown.length === 1
                  ? "One column was"
                  : `${report.unknown.length} columns were`}{" "}
                not read, because the template has no such heading:{" "}
                {report.unknown.map((u) => `“${u}”`).join(", ")}.
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section
            className="border-hairline bg-paper-raised rounded-md border p-5"
            data-section="template"
          >
            <span className="oh-badge neutral">1 · Get the template</span>
            <h2 className="mt-3 text-[18px] leading-6 font-semibold">One row a site</h2>
            <p className="t-body text-ink-muted mt-2">
              An Excel file with a heading for each fact, drop-downs where there is a fixed choice,
              an example row, and a second sheet that explains every column. The ten navy headings
              are needed; the rest are optional.
            </p>
            <a href="/api/owner/template/" className="oh-btn secondary mt-4" data-action="template">
              Download the template
            </a>
          </section>
          <section className="border-hairline bg-paper-raised rounded-md border p-5">
            <span className="oh-badge neutral">2 · Upload it</span>
            <h2 className="mt-3 text-[18px] leading-6 font-semibold">
              Up to {MAX_ROWS} sites at a time
            </h2>
            <form
              method="post"
              action="/api/owner/import/"
              encType="multipart/form-data"
              className="mt-3 flex flex-col gap-3"
              data-section="import-form"
            >
              <div>
                <label htmlFor="sheet-file" className="oh-label block">
                  Your filled-in template
                </label>
                <input
                  id="sheet-file"
                  name="sheet"
                  type="file"
                  required
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="oh-input mt-1"
                />
              </div>
              <div>
                <button type="submit" className="oh-btn primary" data-action="import">
                  Upload and check
                </button>
              </div>
            </form>
          </section>
        </div>
      </Container>
    </Shell>
  );
}
