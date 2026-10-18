import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { OwnerBar } from "@/components/owners/Bits";
import {
  Aside,
  BetterPlace,
  FORM_GRID,
  ManySites,
  PageHead,
  StepsCard,
} from "@/components/owners/Frame";
import { SiteForm } from "@/components/owners/SiteForm";
import { ownerSites, requireOwner } from "@/lib/owners/server";
import { FIELD_KEYS, checkSite, type FieldErrors, type Raw } from "@/lib/owners/site-input";
import { indiaDate } from "@/lib/sites/calendar";
import { maskEmail } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a site", robots: { index: false, follow: false } };

const MAP_STYLE = process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function NewSitePage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireOwner();
  // The steps are shown to an owner adding their first site, and not again after that.
  const first = (await ownerSites(owner.id)).length === 0;
  const raw: Raw = { city: owner.city ?? "" };
  for (const key of FIELD_KEYS) if (one(q[key])) raw[key] = one(q[key]).slice(0, 300);
  // The problems are worked out again here from what came back, so the words always match the values.
  let errors: FieldErrors = {};
  if (one(q.e)) {
    const checked = checkSite(raw, indiaDate(Date.now()));
    if (!checked.ok) errors = checked.errors;
  }
  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="site" />
        <div className={`mt-4 ${FORM_GRID}`}>
          <div className="min-w-0">
            <PageHead
              eyebrow={first ? "List your sites · step 3 of 4" : "Your sites"}
              title="Add a site"
            >
              One physical face is one site. Two faces back to back are two sites.
            </PageHead>
            <div className="mt-6">
              <SiteForm
                raw={raw}
                errors={errors}
                availability={one(q.availability) === "booked" ? "booked" : "free"}
                styleUrl={MAP_STYLE}
              />
            </div>
          </div>
          <Aside label="About adding a site">
            {first ? <StepsCard at={3} /> : null}
            <BetterPlace />
            <ManySites />
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
