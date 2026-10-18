import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPermanentId } from "@ohworks/core";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { Aside, BetterPlace, FORM_GRID, PageHead } from "@/components/owners/Frame";
import { SiteForm } from "@/components/owners/SiteForm";
import { stateOf } from "@/lib/owners/progress";
import { ownerSite, requireOwner } from "@/lib/owners/server";
import { openChange } from "@/lib/owners/site-changes";
import {
  FIELD_KEYS,
  checkSite,
  rawFromSite,
  type FieldErrors,
  type Raw,
} from "@/lib/owners/site-input";
import { indiaDate } from "@/lib/sites/calendar";
import { maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit a site", robots: { index: false, follow: false } };

const MAP_STYLE = process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function EditSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  const site = isPermanentId(id) ? await ownerSite(owner.id, id) : null;
  if (!site) notFound();
  // A live site's changes go to the team first: what it is and where it is are what the badges vouch for.
  const live = stateOf(site) === "live";
  const pending = live ? await openChange(site.id) : null;

  const today = indiaDate(Date.now());
  const back = Boolean(one(q.e));
  // Changes already with the team, or returned, are the starting point, so they can be adjusted.
  let raw: Raw = pending?.proposed ? (pending.proposed as Raw) : rawFromSite(site);
  let errors: FieldErrors = {};
  if (back) {
    raw = {};
    for (const key of FIELD_KEYS) if (one(q[key])) raw[key] = one(q[key]).slice(0, 300);
    const checked = checkSite(raw, today);
    if (!checked.ok) errors = checked.errors;
  }
  const booked = back
    ? one(q.availability) === "booked"
    : Boolean(site.bookedUntil && site.bookedUntil.slice(0, 10) >= today);

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="site" />
        <div className={`mt-6 ${FORM_GRID}`}>
          <div className="min-w-0">
            <PageHead eyebrow="Your sites" title="Edit this site">
              <a href={`/owner/sites/${id}/`} className="oh-link">
                {site.title}
              </a>
            </PageHead>
            {live ? (
              <p className="t-body text-ink mt-5 max-w-[60ch]" data-section="live-edit">
                <strong>This site is live, so your changes go to the team first.</strong> Buyers
                keep seeing the live version until they are approved, usually within a day. Price
                and availability are not changed here: change them on the site&rsquo;s page, where
                they take effect at once.
              </p>
            ) : null}
            {pending?.status === "changes" && pending.reviewNote ? (
              <div className="mt-5">
                <Notice tone="warning" title="What our reviewer asked for" section="review-note">
                  &ldquo;{pending.reviewNote}&rdquo;
                </Notice>
              </div>
            ) : null}
            {stateOf(site) === "changes" && site.reviewNote ? (
              <div className="mt-5">
                <Notice tone="warning" title="What our reviewer asked for" section="review-note">
                  &ldquo;{site.reviewNote}&rdquo;
                </Notice>
              </div>
            ) : null}
            <div className="mt-6">
              <SiteForm
                raw={raw}
                errors={errors}
                id={id}
                availability={booked ? "booked" : "free"}
                styleUrl={MAP_STYLE}
              />
            </div>
          </div>
          <Aside label="About this site">
            <BetterPlace />
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
