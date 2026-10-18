import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button, Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { aboutText, dateRange, findGroup, threadPath } from "@/lib/sites/enquiries";
import { BUYER_COOKIE, isAnyReference, maskEmail, readBuyer } from "@/lib/sites/enquiry";
import { emailConfigured } from "@/lib/sites/mail";
import { siteUrl } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiry sent",
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

const reply = (hours: number | null | undefined): string =>
  hours != null && hours < 24 ? "Under a day" : "Not known yet";

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).ref;
  const ref = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  if (!isAnyReference(ref)) notFound();
  const group = await findGroup(ref);
  if (!group) notFound();
  if (group.requests.some((r) => r.enquiry.status === "pending"))
    redirect(`/enquire/confirm/?ref=${ref}`);
  const local = !emailConfigured() && process.env.NODE_ENV !== "production";
  // The link to the replies opens without a password, so it is shown only in the browser that confirmed this address.
  const mine = readBuyer((await cookies()).get(BUYER_COOKIE)?.value) === group.email;
  const only = group.requests.length === 1 ? group.requests[0] : undefined;
  const first = group.requests[0]?.sites[0];
  const many = group.requests.length > 1;

  return (
    <Shell active="find">
      <Container className="py-10 lg:py-16">
        <div className="mx-auto max-w-[680px]" data-section="enquiry-sent">
          <p className="t-label text-verified">Enquiry sent</p>
          <h1 className="t-display-lg mt-2">
            Sent to {only ? only.owner.name : `${group.requests.length} owners`}.
          </h1>
          <p className="t-body-lg text-ink-muted mt-4">
            Your enquiry about {aboutText(group)} went straight to {many ? "each of them" : "them"}.{" "}
            {many ? "Each owner saw only their own sites. Their replies come" : "Their reply comes"}{" "}
            to you by email, at <span className="text-ink font-mono">{maskEmail(group.email)}</span>
            .
          </p>

          {only ? (
            <dl className="oh-spec mt-8">
              <div>
                <dt>Typical reply</dt>
                <dd>{reply(only.owner.medianReplyHours)}</dd>
              </div>
              <div>
                <dt>Your dates</dt>
                <dd>{dateRange(only.enquiry.dateFrom, only.enquiry.dateTo)}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd data-section="reference">{only.enquiry.reference}</dd>
              </div>
            </dl>
          ) : (
            <>
              <p className="t-data text-ink mt-6">
                {dateRange(group.lead.dateFrom, group.lead.dateTo)} ·{" "}
                <span data-section="reference">{group.ref}</span>
              </p>
              <ul
                className="border-hairline bg-paper-raised divide-hairline mt-4 divide-y overflow-hidden rounded-md border"
                data-section="sent-owners"
              >
                {group.requests.map((r) => (
                  <li
                    key={r.enquiry.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3"
                    data-owner={r.owner.slug}
                  >
                    <div className="min-w-0">
                      <p className="text-[16px] leading-[22px] font-semibold">{r.owner.name}</p>
                      <p className="t-small text-ink-muted">
                        {r.sites.length === 1 ? r.sites[0]?.title : `${r.sites.length} sites`} ·
                        typical reply: {reply(r.owner.medianReplyHours).toLowerCase()}
                      </p>
                    </div>
                    <span className="t-data-sm text-ink-muted">{r.enquiry.reference}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {local ? (
            <p
              className="t-small border-hairline bg-lit-tint text-ink mt-5 rounded-sm border px-3 py-2"
              data-section="dev-outbox"
            >
              Development only: no email service is set up on this machine, so the{" "}
              {many ? "emails to the owners" : "email to the owner"} and your copy are in the admin,
              under Operations, Outbox.
            </p>
          ) : null}

          <p className="t-body text-ink mt-6">
            Contract, invoice and payment are between you and {many ? "each owner" : "the owner"}.
            OOHWORKS charges nothing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {mine ? (
              <Button
                href={threadPath(group.ref)}
                variant="primary"
                rel="nofollow"
                data-action="see-replies"
              >
                See replies as they arrive
              </Button>
            ) : null}
            {first && !many ? (
              <Button href={`${siteUrl(first)}#similar`} variant={mine ? "secondary" : "primary"}>
                See similar sites nearby
              </Button>
            ) : (
              <Button href="/shortlist/" variant="secondary" rel="nofollow">
                Back to your shortlist
              </Button>
            )}
            <Button
              href={first ? `/search/?city=${first.city}` : "/search/"}
              variant="ghost"
              rel="nofollow"
            >
              Back to results
            </Button>
          </div>
          {!mine ? (
            <p className="t-small text-ink-muted mt-4">
              The link to your replies is in the confirmation email.
            </p>
          ) : null}
          <p className="t-small text-ink-muted border-hairline mt-10 border-t pt-5">
            {NEUTRALITY_LINE}
          </p>
        </div>
      </Container>
    </Shell>
  );
}
