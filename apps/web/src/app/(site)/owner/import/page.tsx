import type { Metadata } from "next";
import { Button, Container, Note } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { Aside, Card, FORM_GRID, FormSection, PageHead } from "@/components/owners/Frame";
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
        <div className={`mt-4 ${FORM_GRID}`}>
          <div className="min-w-0">
            <PageHead eyebrow="Your sites" title="Upload a spreadsheet">
              For many sites at once. Each row that is right becomes a draft that only you can see.
              Each row that is not is listed with what to fix, and creates nothing.
            </PageHead>

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
                      Nothing was created for those rows. Correct them in your file and upload it
                      again. Give each site &ldquo;Your reference&rdquo; and uploading again will
                      update it, not double it.
                    </Notice>
                    <div
                      className="border-hairline relative overflow-x-auto rounded-md border"
                      tabIndex={0}
                      role="region"
                      aria-label="Rows that need fixing"
                    >
                      <table
                        className="oh-table w-full min-w-[560px]"
                        data-section="import-problems"
                      >
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

            <div className="mt-6 flex flex-col gap-6">
              <FormSection title="Get the template" n={1} part="template">
                <p className="t-body text-ink-muted" data-section="template">
                  An Excel file with a heading for each fact, drop-downs where there is a fixed
                  choice, an example row, and a second sheet that explains every column. The ten
                  navy headings are needed; the rest are optional.
                </p>
                <div>
                  <Button
                    variant="secondary"
                    href="/api/owner/template/"

                    data-action="template"
                  >
                    Download the template
                  </Button>
                </div>
              </FormSection>
              <FormSection title="Upload it" n={2} part="upload">
                <form
                  method="post"
                  action="/api/owner/import/"
                  encType="multipart/form-data"
                  className="flex flex-col gap-5"
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
                      aria-describedby="sheet-file-help"
                      className="oh-input mt-1"
                    />
                    <p id="sheet-file-help" className="t-small text-ink-muted mt-1">
                      An Excel workbook, up to {MAX_ROWS} sites at a time.
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto"
                      type="submit"

                      data-action="import"
                    >
                      Upload and check
                    </Button>
                  </div>
                </form>
              </FormSection>
            </div>
          </div>

          <Aside label="How the spreadsheet works">
            <Card title="How it works">
              <ul className="t-body text-ink list-disc space-y-1 pl-5">
                <li>One row is one site.</li>
                <li>A right row becomes a draft that only you can see.</li>
                <li>A wrong row is named by its row and column, and creates nothing.</li>
                <li>
                  Give each site &ldquo;Your reference&rdquo; and uploading again updates it, not
                  doubles it.
                </li>
              </ul>
              <Note className="mt-4">
                Nothing is published from a spreadsheet. You add photographs and send each site for
                review yourself.
              </Note>
            </Card>
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
