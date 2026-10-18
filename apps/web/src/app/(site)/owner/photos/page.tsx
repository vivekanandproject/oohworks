import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { Aside, Card, FORM_GRID, FormSection, PageHead } from "@/components/owners/Frame";
import { MAX_BATCH, REASON, decodeBatch } from "@/lib/owners/photo-batch";
import { GPS_MATCH_METRES } from "@/lib/owners/photo-facts";
import { MAX_PHOTOS, ownerSites, requireOwner } from "@/lib/owners/server";
import { indiaDate } from "@/lib/sites/calendar";
import { maskEmail } from "@/lib/sites/enquiry";
import { PhotoBatchForm } from "./PhotoBatchForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Add photographs of your sites",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  missing: "Choose your photographs first.",
  many: `Send up to ${MAX_BATCH} photographs at a time.`,
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function PhotosPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const sites = (await ownerSites(owner.id))
    .filter((s) => s.permanentId && !s.removed)
    .map((s) => ({ unit: s.permanentId!, title: s.title ?? s.permanentId! }));
  const done = one(q.r) ? decodeBatch(one(q.r)) : [];
  const titleOf = (unit?: string) => sites.find((s) => s.unit === unit)?.title ?? unit ?? "";
  const added = done.filter((r) => r.added).length;

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="import" />
        <div className={`mt-4 ${FORM_GRID}`}>
          <div className="min-w-0">
            <PageHead eyebrow="Your sites" title="Add photographs">
              Photographs of many sites at once. Each one taken at a site, with your phone&rsquo;s
              location on, goes to that site by itself. You place the rest.
            </PageHead>

            {ERRORS[one(q.error)] ? (
              <div className="mt-5">
                <Notice tone="error" title={ERRORS[one(q.error)] ?? ""} section="photos-error" />
              </div>
            ) : null}

            {sites.length === 0 ? (
              <div className="mt-5">
                <Notice tone="warning" title="Add a site first." section="photos-no-sites">
                  Photographs go to your sites, and you have none yet.{" "}
                  <a href="/owner/sites/new/" className="oh-link">
                    Add a site
                  </a>
                  .
                </Notice>
              </div>
            ) : (
              <PhotoBatchForm sites={sites} today={indiaDate(Date.now())} />
            )}

            {done.length ? (
              <FormSection title="What happened" part="photos-done">
                <p className="t-body text-ink">
                  {added === 1 ? "1 photograph was added" : `${added} photographs were added`} of{" "}
                  {done.length}.
                  {done.length > added
                    ? " Add the others from each site's own page, where you can choose the site and the date."
                    : ""}
                </p>
                <ul className="t-body text-ink mt-3 space-y-2" data-section="photos-done">
                  {done.map((r, i) => (
                    <li key={`${r.name}-${i}`} data-photo-state={r.added ? "added" : "left"}>
                      <span className="font-mono text-[13px] [overflow-wrap:anywhere]">
                        {r.name}
                      </span>{" "}
                      ·{" "}
                      {r.added ? (
                        <>
                          Added to{" "}
                          <a href={`/owner/sites/${r.unit}/`} className="oh-link">
                            {titleOf(r.unit)}
                          </a>
                          .
                          {r.twin
                            ? " It is also on another listing, so our team will check it."
                            : ""}
                        </>
                      ) : (
                        <>
                          Not added. {REASON[r.reason ?? "read"]}
                          {r.unit ? (
                            <>
                              {" "}
                              <a href={`/owner/sites/${r.unit}/#photos`} className="oh-link">
                                Open {titleOf(r.unit)}
                              </a>
                              .
                            </>
                          ) : null}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </FormSection>
            ) : null}
          </div>

          <Aside label="How a photograph finds its site">
            <Card title="How a photograph finds its site">
              <ul className="t-body text-ink list-disc space-y-1 pl-5">
                <li>
                  Your phone records where each photograph was taken. One taken within{" "}
                  {GPS_MATCH_METRES} m of a site&rsquo;s pin goes to that site, and buyers see it as
                  taken at the site.
                </li>
                <li>
                  Taken between two of your sites, or with location off, it waits for you to choose.
                </li>
                <li>
                  One taken after dark is the night view. The first by day is the approach view.
                </li>
                <li>A site holds up to {MAX_PHOTOS} photographs.</li>
              </ul>
              <p className="t-small text-ink-muted mt-4">
                Stock images are refused, and a photograph already on another listing is checked by
                our team.
              </p>
            </Card>
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
