import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { AskedFacts, SiteList, Thread } from "@/components/sites/Thread";
import { timeAgo } from "@/lib/editorial/format";
import { findGroup, messagesOf } from "@/lib/sites/enquiries";
import { ANSWERS, checkThreadKey, isAnyReference, type Answer } from "@/lib/sites/enquiry";
import { inr, siteUrl } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
// The address holds the key. "same-origin" keeps it out of any referrer sent to another site, while this
// page's own forms still say where they came from, which the server checks.
export const metadata: Metadata = {
  title: "Your enquiry",
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

const ERRORS: Record<string, { t: string; d: string }> = {
  empty: { t: "There is nothing to send yet.", d: "Write a few words first." },
  busy: {
    t: "Too many messages in a short time.",
    d: "Give the owner time to answer, then try again.",
  },
  send: { t: "We could not send it just now.", d: "Nothing was lost. Try again in a minute." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** The buyer's view of an enquiry: every owner asked, and each reply, in one place. Opened from the confirmation email. */
export default async function EnquiryThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<Query>;
}) {
  const { ref } = await params;
  const q = await searchParams;
  const key = one(q.k);
  if (!isAnyReference(ref) || !checkThreadKey(ref, "buyer", key)) notFound();
  const group = await findGroup(ref);
  if (!group || group.requests.some((r) => r.enquiry.status === "pending")) notFound();
  const messages = await messagesOf(group);
  const error = ERRORS[one(q.error)];
  const sent = one(q.sent) === "1";
  const many = group.requests.length > 1;
  const first = group.requests[0];
  if (!first) notFound();

  // The latest answer each owner has given for each site, so replies can be read side by side.
  const rows = group.requests.flatMap((r) => {
    const latest = new Map<number, { availability: Answer | null; quote: number | null }>();
    for (const m of messages.get(r.enquiry.id) ?? []) {
      if (m.from !== "owner") continue;
      for (const a of m.answers ?? []) {
        const siteId = typeof a.site === "object" ? a.site.id : a.site;
        const before = latest.get(siteId);
        latest.set(siteId, {
          availability:
            (a.availability as Answer | null | undefined) ?? before?.availability ?? null,
          quote: a.quote ?? before?.quote ?? null,
        });
      }
    }
    return r.sites.map((site) => ({ site, owner: r.owner, answer: latest.get(site.id) ?? null }));
  });
  const anyAnswer = rows.some((row) => row.answer);
  const waiting = group.requests.filter((r) => !r.enquiry.repliedAt).length;

  return (
    <Shell active="find">
      <Container className="py-8 lg:py-12">
        <p className="t-label text-ink-muted">
          Enquiry <span className="font-mono">{group.ref}</span>
        </p>
        <h1 className="t-display-md mt-2">
          {many
            ? `Your enquiry to ${group.requests.length} owners`
            : `Your enquiry to ${first.owner.name}`}
        </h1>
        <p className="t-body text-ink-muted mt-2 max-w-[68ch]" data-section="thread-lead">
          {waiting === 0
            ? many
              ? "Every owner has replied."
              : "The owner has replied."
            : many
              ? `${group.requests.length - waiting} of ${group.requests.length} owners have replied so far.`
              : "Waiting for the owner to reply."}{" "}
          Replies also come to your email. Contract, invoice and payment stay between you and{" "}
          {many ? "each owner" : "the owner"}.
        </p>

        {sent && !error ? (
          <div className="oh-toast success mt-5" role="status" data-section="thread-sent">
            <span className="dot" />
            <div>
              <div className="t">Your message was sent.</div>
              <div className="d">It went straight to that owner, and to nobody else.</div>
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="oh-toast error mt-5" role="alert" data-section="thread-error">
            <span className="dot" />
            <div>
              <div className="t">{error.t}</div>
              <div className="d">{error.d}</div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 max-w-[760px]">
          <AskedFacts request={first} showBudget={!many && !first.enquiry.plan} />
        </div>

        {anyAnswer && rows.length > 1 ? (
          <section className="mt-8" data-section="answers-table">
            <h2 className="t-display-sm">Answers so far</h2>
            <div
              className="border-hairline relative mt-4 overflow-x-auto rounded-md border"
              tabIndex={0}
              role="region"
              aria-label="Answers so far"
            >
              <table className="oh-table w-full min-w-[560px]">
                <thead>
                  <tr>
                    <th scope="col">Site</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Availability</th>
                    <th scope="col">Rate quoted</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.site.id} data-site={row.site.permanentId}>
                      <td>
                        <a href={siteUrl(row.site)} className="oh-link">
                          {row.site.title}
                        </a>
                      </td>
                      <td>{row.owner.name}</td>
                      <td>
                        {row.answer?.availability ? (
                          ANSWERS[row.answer.availability]
                        ) : (
                          <span className="text-ink-muted">No answer yet</span>
                        )}
                      </td>
                      <td className="data">
                        {row.answer?.quote ? (
                          `${inr(row.answer.quote)} a month`
                        ) : (
                          <span className="text-ink-muted font-sans">No answer yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="t-small text-ink-muted mt-2">
              Each rate is that owner&rsquo;s own quote to you. ohworks does not set, change or add
              to it.
            </p>
          </section>
        ) : null}

        <div className="mt-8 max-w-[760px] space-y-8">
          {group.requests.map((r) => (
            <section
              key={r.enquiry.id}
              id={r.enquiry.reference}
              className="scroll-mt-28"
              data-section="request"
              data-owner={r.owner.slug}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="t-display-sm">{r.owner.name}</h2>
                {r.enquiry.repliedAt ? (
                  <Badge kind="verified">
                    Replied {timeAgo(r.enquiry.repliedAt).toLowerCase()}
                  </Badge>
                ) : (
                  <Badge kind="neutral">Waiting for a reply</Badge>
                )}
              </div>
              <p className="t-small text-ink-muted mt-1">
                Sent {timeAgo(r.enquiry.sentAt).toLowerCase()} · typical reply:{" "}
                {r.owner.medianReplyHours != null && r.owner.medianReplyHours < 24
                  ? "under a day"
                  : "not known yet"}{" "}
                · <span className="font-mono">{r.enquiry.reference}</span>
              </p>
              <div className="mt-3">
                <SiteList request={r} />
              </div>
              <div className="mt-4">
                <Thread request={r} messages={messages.get(r.enquiry.id) ?? []} viewer="buyer" />
              </div>
              <form
                method="post"
                action="/api/thread/"
                className="mt-4 flex flex-col gap-3"
                data-section="follow-up"
              >
                <input type="hidden" name="ref" value={group.ref} />
                <input type="hidden" name="k" value={key} />
                <input type="hidden" name="to" value={r.enquiry.reference} />
                <div>
                  <label htmlFor={`msg-${r.enquiry.reference}`} className="oh-label block">
                    Write to {r.owner.name}
                  </label>
                  <textarea
                    id={`msg-${r.enquiry.reference}`}
                    name="body"
                    rows={3}
                    maxLength={4000}
                    required
                    className="oh-input mt-1 block"
                  />
                </div>
                <div>
                  <button type="submit" className="oh-btn secondary sm">
                    Send to {r.owner.name}
                  </button>
                </div>
              </form>
            </section>
          ))}
        </div>
        <p className="t-small text-ink-muted border-hairline mt-10 max-w-[760px] border-t pt-5">
          Keep this page&rsquo;s link to yourself: it opens your enquiry without a password.{" "}
          {NEUTRALITY_LINE}
        </p>
      </Container>
    </Shell>
  );
}
