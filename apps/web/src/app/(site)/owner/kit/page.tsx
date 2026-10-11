import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { Aside, Card, FORM_GRID, FormSection, PageHead } from "@/components/owners/Frame";
import { formatDate } from "@/lib/editorial/format";
import { ownerFiles, requireOwner } from "@/lib/owners/server";
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

export default async function KitPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const kits = await ownerFiles(owner.id, "media_kit");

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
                  Our team will enter the sites as drafts in your list, and email you when they are
                  ready to check.
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
                <ul className="t-body text-ink space-y-1" data-section="kits">
                  {kits.map((k) => (
                    <li key={k.id}>
                      <span className="font-mono text-[13px]">{formatDate(k.createdAt)}</span> ·{" "}
                      {k.filename?.replace(/^.*?-\d{13}-/, "")} ·{" "}
                      {k.handled ? "Entered" : "With our team"}
                    </li>
                  ))}
                </ul>
              </FormSection>
            ) : null}
          </div>

          <Aside label="What happens to your file">
            <Card title="What happens to it">
              <ol className="t-body text-ink list-decimal space-y-1 pl-5">
                <li>Our team reads it and enters each site as a draft in your list.</li>
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
