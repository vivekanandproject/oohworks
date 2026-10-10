import type { Metadata } from "next";
import { Badge, Button, Container, EmptyState } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar, Score, StateTag } from "@/components/owners/Bits";
import { formatDate } from "@/lib/editorial/format";
import { stateOf } from "@/lib/owners/progress";
import { ownerFiles, ownerSites, requireOwner } from "@/lib/owners/server";
import { maskEmail } from "@/lib/sites/enquiry";
import { cityDef } from "@/lib/sites/taxonomy";
import { placeLine, priceOf, siteUrl } from "@/lib/sites/view";
import type { Site } from "@/payload-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your sites", robots: { index: false, follow: false } };

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** The one thing to do next for a site, in words. */
function Next({ site }: { site: Site }) {
  const state = stateOf(site);
  const page = `/owner/sites/${site.permanentId}/`;
  if (state === "live")
    return (
      <>
        <a href={`${page}#update`} className="oh-link">
          Update price or availability
        </a>{" "}
        ·{" "}
        <a href={siteUrl(site)} className="oh-link">
          View
        </a>
      </>
    );
  if (state === "review")
    return (
      <span className="text-ink-muted">Sent {formatDate(site.submittedAt)}. Nothing to do.</span>
    );
  if (state === "changes")
    return (
      <>
        <span>&ldquo;{site.reviewNote}&rdquo;</span>{" "}
        <a href={`${page}edit/`} className="oh-link">
          Fix it
        </a>
      </>
    );
  return (
    <>
      <a href={`${page}#photos`} className="oh-link">
        {(site.photos?.length ?? 0) === 0 ? "Add photographs" : "Photographs"}
      </a>{" "}
      ·{" "}
      <a href={`${page}edit/`} className="oh-link">
        Edit
      </a>
    </>
  );
}

export default async function OwnerHomePage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const sites = await ownerSites(owner.id);
  const kits = await ownerFiles(owner.id, "media_kit");
  const waiting = sites.filter((s) => ["draft", "changes"].includes(stateOf(s)));
  const sent = Number(one(q.sent));
  const counts = { live: 0, review: 0, changes: 0, draft: 0 };
  for (const s of sites) counts[stateOf(s)] += 1;

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="sites" />
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="t-label text-ink-muted">Your sites</p>
            <h1 className="t-display-md mt-2">{owner.name}</h1>
            <p className="t-small text-ink-muted mt-1" data-section="owner-counts">
              {[
                cityDef(owner.city)?.label,
                sites.length === 1 ? "1 site" : `${sites.length} sites`,
                counts.live ? `${counts.live} live` : null,
                counts.review ? `${counts.review} in review` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {owner.verified ? (
            <Badge kind="verified">Verified owner</Badge>
          ) : (
            <a href="/owner/company/" className="oh-badge neutral" data-section="not-verified">
              Not yet a verified owner ·{" "}
              {owner.gstin ? "we are checking your details" : "add your GSTIN"}
            </a>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {one(q.saved) === "company" ? (
            <Notice
              tone="success"
              title="Your company details are saved."
              section="saved-company"
            />
          ) : null}
          {sent > 0 ? (
            <Notice
              tone="success"
              title={sent === 1 ? "1 site sent for review." : `${sent} sites sent for review.`}
              section="sent"
            >
              We check the owner, the location and the photographs before each one goes live,
              usually within a working day. You will get an email for each site.
            </Notice>
          ) : null}
          {one(q.removed) === "1" ? (
            <Notice tone="success" title="That site was removed." section="removed" />
          ) : null}
          {one(q.error) === "busy" ? (
            <Notice tone="error" title="Too many changes in a short time.">
              Wait a minute, then try again.
            </Notice>
          ) : null}
          {one(q.error) === "send" ? (
            <Notice tone="error" title="We could not send them just now.">
              Nothing was lost. Try again in a minute.
            </Notice>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2" data-section="add">
          <Button href="/owner/sites/new/" variant="primary">
            Add a site
          </Button>
          <Button href="/owner/import/" variant="secondary">
            Upload a spreadsheet
          </Button>
          <Button href="/owner/kit/" variant="secondary">
            Send a media kit
          </Button>
        </div>

        {waiting.length ? (
          <form
            method="post"
            action="/api/owner/submit/"
            className="border-hairline bg-verified-tint mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
            data-section="submit"
          >
            <p className="t-body text-ink">
              {waiting.length === 1 ? "1 site is" : `${waiting.length} sites are`} ready to send. We
              check each one before it goes live. A site with photographs is checked faster and
              ranks higher.
            </p>
            <button type="submit" className="oh-btn primary" data-action="submit">
              {waiting.length === 1
                ? "Send 1 site for review"
                : `Send ${waiting.length} sites for review`}
            </button>
          </form>
        ) : null}

        {sites.length === 0 ? (
          <div className="mt-8 max-w-[760px]" data-section="no-sites">
            <EmptyState icon="hoarding" title="No sites yet">
              Add your first site, upload a spreadsheet of them, or send us your media kit and we
              will enter them for you.
            </EmptyState>
          </div>
        ) : (
          <ul
            className="border-hairline bg-paper-raised divide-hairline mt-6 divide-y overflow-hidden rounded-md border"
            data-section="owner-sites"
          >
            {sites.map((site) => {
              const price = priceOf(site);
              return (
                <li
                  key={site.id}
                  className="grid gap-x-6 gap-y-2 px-4 py-4 lg:grid-cols-[minmax(0,5fr)_auto_minmax(120px,2fr)_minmax(0,5fr)] lg:items-center"
                  data-site={site.permanentId}
                  data-state={stateOf(site)}
                >
                  <div className="min-w-0">
                    <h2 className="text-[16px] leading-[22px] font-semibold">
                      <a href={`/owner/sites/${site.permanentId}/`} className="oh-rowlink">
                        {site.title}
                      </a>
                    </h2>
                    <p className="t-small text-ink-muted">
                      {placeLine(site)} ·{" "}
                      {price.shown ? `${price.prefix}${price.amount} a month` : "Price on request"}
                      {site.ownerRef ? ` · ${site.ownerRef}` : ""}
                    </p>
                    {site.duplicateNote ? (
                      <p className="t-small text-lit mt-1">
                        Check this: {site.duplicateNote.replace(/, listed by .*$/, "")}.
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <StateTag state={stateOf(site)} />
                  </div>
                  <Score value={site.qualityScore ?? 0} />
                  <p className="t-body text-ink min-w-0">
                    <Next site={site} />
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {kits.length ? (
          <section className="mt-8" data-section="kits">
            <h2 className="t-display-sm">Media kits you sent</h2>
            <ul className="t-body text-ink mt-3 space-y-1">
              {kits.map((k) => (
                <li key={k.id}>
                  <span className="font-mono text-[13px]">{formatDate(k.createdAt)}</span> ·{" "}
                  {k.filename?.replace(/^.*?-\d{13}-/, "")} ·{" "}
                  {k.handled
                    ? "Entered. Check the drafts above."
                    : "With our team. We will email you when your sites are ready to check."}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="border-hairline bg-paper-raised mt-8 max-w-[760px] rounded-md border p-5">
          <h2 className="t-display-sm">What earns a better place in results</h2>
          <p className="t-body text-ink-muted mt-2">
            Real photographs, a price or a clear &ldquo;price on request&rdquo;, an audience figure
            with its source, a permit number and a landmark. Each adds to the score out of 100.
            Paying ohworks never does.
          </p>
          <p className="mt-2">
            <a href="/how-results-are-ordered/" className="oh-link t-body">
              How results are ordered
            </a>
          </p>
        </section>
      </Container>
    </Shell>
  );
}
