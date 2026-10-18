import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Notice } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { AskedFacts, SiteList, Thread } from "@/components/sites/Thread";
import { findGroup, messagesOf } from "@/lib/sites/enquiries";
import { ANSWERS, checkThreadKey, isReference, type Answer } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";
// The address holds the key. "same-origin" keeps it out of any referrer sent to another site, while this
// page's own forms still say where they came from, which the server checks.
export const metadata: Metadata = {
  title: "Reply to an enquiry",
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

const ERRORS: Record<string, { t: string; d: string }> = {
  empty: {
    t: "There is nothing to send yet.",
    d: "Give an answer for at least one site, or write a message.",
  },
  quote: { t: "Check the rate.", d: "It should be a number in rupees, or left empty." },
  busy: { t: "Too many tries in a short time.", d: "Wait a minute, then send it again." },
  send: { t: "We could not send it just now.", d: "Nothing was lost. Try again in a minute." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** The page an owner reaches from the link in their enquiry email. The link's key is what lets them in. */
export default async function ReplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<Query>;
}) {
  const { ref } = await params;
  const q = await searchParams;
  const key = one(q.k);
  if (!isReference(ref) || !checkThreadKey(ref, "owner", key)) notFound();
  const group = await findGroup(ref);
  const request = group?.requests[0];
  if (!group || !request || request.enquiry.status === "pending") notFound();
  const messages = (await messagesOf(group)).get(request.enquiry.id) ?? [];
  const error = ERRORS[one(q.error)];
  const sent = one(q.sent) === "1";
  const many = request.sites.length > 1;

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <div className="mx-auto max-w-[760px]">
          <p className="t-label text-ink-muted">
            Enquiry <span className="font-mono">{request.enquiry.reference}</span>
          </p>
          <h1 className="t-display-md mt-2">Reply to this enquiry</h1>
          <p className="t-body text-ink-muted mt-2">
            A buyer has asked about {many ? `${request.sites.length} of your sites` : "your site"}.
            Your reply goes straight to them at{" "}
            <a href={`mailto:${request.enquiry.email}`} className="oh-link">
              {request.enquiry.email}
            </a>
            . You set the price and keep the client; OOHWORKS never sits in between.
          </p>

          {sent && !error ? (
            <Notice
              tone="success"
              title="Your reply was sent to the buyer."
              section="reply-sent"
              className="mt-5"
            >
              They can answer here or by email. You can add to it below.
            </Notice>
          ) : null}
          {error ? (
            <Notice tone="error" title={error.t} section="reply-error" className="mt-5">
              {error.d}
            </Notice>
          ) : null}

          <section className="mt-8" data-section="asked">
            <h2 className="t-display-sm">What they asked</h2>
            <div className="mt-4">
              <AskedFacts request={request} showBudget={!group.plan && !request.enquiry.plan} />
            </div>
            <h3 className="oh-label mt-5">{many ? "Your sites in this request" : "Your site"}</h3>
            <div className="mt-2">
              <SiteList request={request} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="t-display-sm">The conversation</h2>
            <div className="mt-4">
              <Thread request={request} messages={messages} viewer="owner" />
            </div>
          </section>

          <form
            method="post"
            action="/api/reply/"
            className="mt-8 flex flex-col gap-5"
            data-section="reply-form"
          >
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="k" value={key} />
            <h2 className="t-display-sm">
              {messages.some((m) => m.from === "owner") ? "Add to your reply" : "Your reply"}
            </h2>
            {request.sites.map((site) => (
              <fieldset
                key={site.id}
                className="border-hairline bg-paper-raised rounded-md border p-4"
                data-site={site.permanentId}
              >
                <legend className="t-body-strong px-1">{site.title}</legend>
                <div className="flex flex-wrap gap-x-6">
                  {(Object.keys(ANSWERS) as Answer[]).map((a) => (
                    <label
                      key={a}
                      className="t-body flex min-h-11 cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={`a-${site.id}`}
                        value={a}
                        className="accent-navy h-[18px] w-[18px]"
                      />
                      {ANSWERS[a]}
                    </label>
                  ))}
                </div>
                <div className="mt-2 max-w-[280px]">
                  <label htmlFor={`q-${site.id}`} className="oh-label block">
                    Your rate a month, optional
                  </label>
                  <div className="oh-affix mt-1">
                    <span aria-hidden="true">₹</span>
                    <input
                      id={`q-${site.id}`}
                      name={`q-${site.id}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9, ]*"
                      maxLength={14}
                      className="oh-input data"
                    />
                  </div>
                </div>
              </fieldset>
            ))}
            <div>
              <label htmlFor="reply-body" className="oh-label block">
                Message, optional
              </label>
              <textarea
                id="reply-body"
                name="body"
                rows={5}
                maxLength={4000}
                className="oh-input mt-1 block"
              />
            </div>
            <div>
              <button
                type="submit"
                className="oh-btn primary lg w-full sm:w-auto"
                data-action="send-reply"
              >
                Send reply to the buyer
              </button>
            </div>
            <p className="t-small text-ink-muted">
              Keep this page&rsquo;s link to yourself: it opens this enquiry without a password.
            </p>
          </form>
        </div>
      </Container>
    </Shell>
  );
}
