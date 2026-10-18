import type { Metadata } from "next";
import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { Aside, Card, FORM_GRID, FormSection, PageHead } from "@/components/owners/Frame";
import { formatDate } from "@/lib/editorial/format";
import { kitName, kitReadingOn, type KitReport } from "@/lib/owners/kit-reading";
import { ownerFiles, requireOwner } from "@/lib/owners/server";
import type { OwnerFile } from "@/payload-types";
import { maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Send us your media kit",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  missing: "Choose your file first.",
  big: "That file is over 25 MB. Send a smaller one, or split it in two.",
  type: "Send a PDF, an Excel, PowerPoint or Word file, a CSV, or images.",
  read: "We could not read that file. It may be damaged. Save it again and send it once more.",
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** Where a kit stands, in the owner's words, and the spreadsheet of what is left when there is one. */
function kitState(k: OwnerFile): { words: string; left: number } {
  const report = k.reading === "read" ? (k.report as KitReport | null) : null;
  if (k.handled) return { words: "Entered", left: 0 };
  if (k.reading === "waiting" || k.reading === "reading") return { words: "Being read", left: 0 };
  if (!report) return { words: "With our team", left: 0 };
  const d = report.drafts?.length ?? 0;
  const n = report.needs?.length ?? 0;
  return {
    words: [
      d === 1 ? "1 draft in your list" : `${d} drafts in your list`,
      n ? (n === 1 ? "1 needs details from you" : `${n} need details from you`) : "",
    ]
      .filter(Boolean)
      .join(", "),
    left: n,
  };
}

export default async function KitPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const kits = await ownerFiles(owner.id, "media_kit");
  const byClaude = kitReadingOn();

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="kit" />
        <div className={`mt-6 ${FORM_GRID}`}>
          <div className="min-w-0">
            <PageHead eyebrow="Your sites" title="Send us your media kit">
              A PDF, a presentation or your own spreadsheet. Our team enters the sites for you, at
              no charge.
            </PageHead>
            {one(q.sent) === "1" ? (
              <div className="mt-5">
                <Notice tone="success" title="We have your file." section="kit-sent">
                  {byClaude
                    ? "A PDF is read into drafts in your list within the hour. We email you when they are ready to check."
                    : "Our team will enter the sites as drafts in your list, and email you when they are ready to check."}
                </Notice>
              </div>
            ) : null}
            {ERRORS[one(q.error)] ? (
              <div className="mt-5">
                <Notice tone="error" title={ERRORS[one(q.error)] ?? ""} section="kit-error" />
              </div>
            ) : null}

            <form
              method="post"
              action="/api/owner/kit/"
              encType="multipart/form-data"
              className="mt-6 flex flex-col gap-5"
              data-section="kit-form"
            >
              <div>
                <label htmlFor="kit-file" className="oh-label block">
                  Your file
                </label>
                <input
                  id="kit-file"
                  name="kit"
                  type="file"
                  required
                  accept=".pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,image/jpeg,image/png,image/webp"
                  aria-describedby="kit-file-help"
                  className="oh-input mt-1"
                />
                <p id="kit-file-help" className="t-small text-ink-muted mt-1">
                  PDF, Excel, PowerPoint, Word, CSV or images, up to 25 MB.
                </p>
              </div>
              <div>
                <label htmlFor="kit-note" className="oh-label block">
                  Anything we should know, optional
                </label>
                <textarea
                  id="kit-note"
                  name="note"
                  rows={4}
                  maxLength={1000}
                  placeholder="e.g. The rates are for the festival season. The last page is sites we no longer own."
                  className="oh-input mt-1 block"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="oh-btn primary lg w-full sm:w-auto"
                  data-action="send-kit"
                >
                  Send it to the ohworks team
                </button>
              </div>
            </form>

            {kits.length ? (
              <FormSection title="What you have sent" part="kits">
                <ul className="t-body text-ink space-y-3" data-section="kits">
                  {kits.map((k) => {
                    const state = kitState(k);
                    return (
                      <li key={k.id} data-kit={k.id}>
                        <span className="font-mono text-[13px]">{formatDate(k.createdAt)}</span> ·{" "}
                        {kitName(k.filename)} · <span data-kit-state>{state.words}</span>
                        {state.left ? (
                          <div className="mt-2">
                            <Button
                              href={`/api/owner/kit/sheet/?file=${k.id}`}
                              variant="secondary"
                              data-action="kit-sheet"
                            >
                              {state.left === 1
                                ? "Download the site to finish"
                                : `Download the ${state.left} sites to finish`}
                            </Button>
                            <p className="t-small text-ink-muted mt-1">
                              A spreadsheet filled in from your kit. Add what is marked in amber,
                              most often the exact position, then{" "}
                              <a href="/owner/import/" className="oh-link">
                                upload it
                              </a>
                              .
                            </p>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </FormSection>
            ) : null}
          </div>

          <Aside label="What happens to your file">
            <Card title="What happens to it">
              <ol className="t-body text-ink list-decimal space-y-1 pl-5">
                <li>
                  {byClaude
                    ? "Claude, an AI, reads a PDF and enters each site as a draft in your list. Our team enters any other file."
                    : "Our team reads it and enters each site as a draft in your list."}
                </li>
                <li>You get an email when they are ready.</li>
                <li>You check each one, correct anything, and send them for review.</li>
              </ol>
              <p className="t-small bg-lit-tint text-ink mt-4 rounded-sm px-3 py-2">
                Nothing from your file is published until you have seen it. Only our team can open
                the file.
              </p>
            </Card>
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
