import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Button, Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { dateRange, findEnquiry } from "@/lib/sites/enquiries";
import { isReference, maskEmail } from "@/lib/sites/enquiry";
import { emailConfigured } from "@/lib/sites/mail";
import { placeLine, siteUrl } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiry sent",
  robots: { index: false, follow: false },
};

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).ref;
  const ref = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  if (!isReference(ref)) notFound();
  const found = await findEnquiry(ref);
  if (!found) notFound();
  const { enquiry, site, owner } = found;
  if (enquiry.status === "pending") redirect(`/enquire/confirm/?ref=${ref}`);
  const local = !emailConfigured() && process.env.NODE_ENV !== "production";

  return (
    <Shell active="find">
      <Container className="py-10 lg:py-16">
        <div className="max-w-[620px]" data-section="enquiry-sent">
          <p className="t-label text-verified">Enquiry sent</p>
          <h1 className="t-display-lg mt-2">Sent to {owner.name}.</h1>
          <p className="t-body-lg text-ink-muted mt-4">
            Your enquiry about {site.title}, {placeLine(site)}, went straight to them. Their reply
            comes to you by email, at{" "}
            <span className="text-ink font-mono">{maskEmail(enquiry.email)}</span>.
          </p>

          <dl className="oh-spec mt-8">
            <div>
              <dt>Typical reply</dt>
              <dd>
                {owner.medianReplyHours != null && owner.medianReplyHours < 24
                  ? "Under a day"
                  : "Not known yet"}
              </dd>
            </div>
            <div>
              <dt>Your dates</dt>
              <dd>{dateRange(enquiry.dateFrom, enquiry.dateTo)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd data-section="reference">{enquiry.reference}</dd>
            </div>
          </dl>

          {local ? (
            <p
              className="t-small border-hairline bg-lit-tint text-ink mt-5 rounded-sm border px-3 py-2"
              data-section="dev-outbox"
            >
              Development only: no email service is set up on this machine, so the email to the
              owner and your copy are in the admin, under Operations, Outbox.
            </p>
          ) : null}

          <p className="t-body text-ink mt-6">
            Contract, invoice and payment are between you and the owner. ohworks charges nothing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={`${siteUrl(site)}#similar`} variant="primary">
              See similar sites nearby
            </Button>
            <Button href={`/search/?city=${site.city}`} variant="ghost" rel="nofollow">
              Back to results
            </Button>
          </div>
          <p className="t-small border-hairline text-ink-muted mt-10 border-t pt-5">
            {NEUTRALITY_LINE}
          </p>
        </div>
      </Container>
    </Shell>
  );
}
