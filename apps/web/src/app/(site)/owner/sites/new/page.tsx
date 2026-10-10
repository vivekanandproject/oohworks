import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { OwnerBar } from "@/components/owners/Bits";
import { SiteForm } from "@/components/owners/SiteForm";
import { requireOwner } from "@/lib/owners/server";
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
        <div className="mt-6 max-w-[820px]">
          <p className="t-label text-ink-muted">List your sites · step 3 of 4</p>
          <h1 className="t-display-md mt-2">Add a site</h1>
          <p className="t-body text-ink-muted mt-2">
            One physical face is one site. Two faces back to back are two sites.
          </p>
          <div className="mt-6">
            <SiteForm
              raw={raw}
              errors={errors}
              availability={one(q.availability) === "booked" ? "booked" : "free"}
              styleUrl={MAP_STYLE}
            />
          </div>
        </div>
      </Container>
    </Shell>
  );
}
