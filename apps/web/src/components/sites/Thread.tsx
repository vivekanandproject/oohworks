import { NEUTRALITY_LINE } from "@ohworks/ui";
import { formatDate, timeAgo } from "@/lib/editorial/format";
import { ANSWERS, ARTWORK, dateRange, type Answer } from "@/lib/sites/enquiry";
import type { Group, Request } from "@/lib/sites/enquiries";
import { inr, placeLine, siteUrl } from "@/lib/sites/view";
import type { Message } from "@/payload-types";

/** What the buyer asked: the same facts both sides see. */
export function AskedFacts({ request, showBudget }: { request: Request; showBudget: boolean }) {
  const e = request.enquiry;
  const rows: [string, string][] = [
    ["Dates", dateRange(e.dateFrom, e.dateTo)],
    ["Brand and category", e.brand],
    ...(showBudget
      ? ([["Budget a month", e.budget ? inr(e.budget) : "Not given"]] as [string, string][])
      : []),
    ["Artwork", ARTWORK[e.artwork]],
  ];
  return (
    <dl className="oh-spec">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SiteList({ request }: { request: Request }) {
  return (
    <ul className="t-body space-y-1">
      {request.sites.map((s) => (
        <li key={s.id}>
          <a href={siteUrl(s)} className="oh-link">
            {s.title}
          </a>
          <span className="text-ink-muted">
            {" "}
            · {placeLine(s)} · <span className="font-mono text-[13px]">{s.permanentId}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Bubble({
  who,
  when,
  mine,
  children,
}: {
  who: string;
  when: string | null | undefined;
  mine: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`border-hairline rounded-md border p-4 ${mine ? "bg-paper-sunken" : "bg-paper-raised"}`}
      data-from={mine ? "me" : "them"}
    >
      <p className="t-small text-ink-muted">
        <span className="text-ink font-semibold">{who}</span>
        {when ? ` · ${timeAgo(when)}` : ""}
      </p>
      <div className="t-body text-ink mt-2 space-y-2">{children}</div>
    </li>
  );
}

/**
 * One request's conversation, oldest first: what the buyer asked, then each reply. An owner's answer
 * for each site is set out as facts, so replies from different owners can be read the same way.
 */
export function Thread({
  request,
  messages,
  viewer,
}: {
  request: Request;
  messages: Message[];
  viewer: "owner" | "buyer";
}) {
  const e = request.enquiry;
  const name = (from: "owner" | "buyer") =>
    from === viewer ? "You" : from === "owner" ? request.owner.name : "The buyer";
  return (
    <ol className="space-y-3" data-section="thread">
      <Bubble who={name("buyer")} when={e.sentAt} mine={viewer === "buyer"}>
        <p className="whitespace-pre-line">
          {e.message || "No message. The dates and details above are the enquiry."}
        </p>
      </Bubble>
      {messages.map((m) => (
        <Bubble key={m.id} who={name(m.from)} when={m.createdAt} mine={m.from === viewer}>
          {m.answers?.length ? (
            <ul className="space-y-1" data-section="answers">
              {m.answers.map((a) => {
                const siteId = typeof a.site === "object" ? a.site.id : a.site;
                const site = request.sites.find((s) => s.id === siteId);
                return (
                  <li key={a.id ?? siteId}>
                    <span className="font-semibold">{site?.title ?? "Site"}:</span>{" "}
                    {[
                      a.availability ? ANSWERS[a.availability as Answer] : null,
                      a.quote ? `${inr(a.quote)} / month` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {m.body ? <p className="whitespace-pre-line">{m.body}</p> : null}
        </Bubble>
      ))}
    </ol>
  );
}

/** Whom a group of requests goes to, and what each owner is asked about. Shown while a buyer confirms. */
export function GroupSummary({ group }: { group: Group }) {
  const sites = group.requests.reduce((n, r) => n + r.sites.length, 0);
  return (
    <aside
      className="border-hairline bg-paper-raised rounded-md border p-5"
      aria-label="What you are sending"
      data-section="group-summary"
    >
      <p className="t-label text-ink-muted">You are asking</p>
      <p className="t-title mt-2">
        {group.requests.length === 1
          ? group.requests[0]?.owner.name
          : `${group.requests.length} owners`}{" "}
        about {sites === 1 ? "1 site" : `${sites} sites`}
      </p>
      <p className="t-small text-ink-muted mt-1">
        {dateRange(group.lead.dateFrom, group.lead.dateTo)}
      </p>
      <ul className="mt-4 space-y-3">
        {group.requests.map((r) => (
          <li
            key={r.enquiry.id}
            className="border-hairline border-t pt-3"
            data-owner={r.owner.slug}
          >
            <p className="t-body-strong">{r.owner.name}</p>
            <ul className="t-small text-ink-muted mt-1 space-y-0.5">
              {r.sites.map((s) => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="t-small text-ink-muted border-hairline mt-4 border-t pt-4">
        {group.requests.length > 1
          ? "One request goes to each owner. Each sees only their own sites, never the rest of your shortlist. "
          : `Goes straight to ${group.requests[0]?.owner.name}. `}
        {NEUTRALITY_LINE}
      </p>
    </aside>
  );
}

export function sentWhen(iso: string | null | undefined): string {
  return iso ? formatDate(iso) : "";
}
