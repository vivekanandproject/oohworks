import { FORM_GRID } from "@/components/owners/Frame";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isPermanentId } from "@ohworks/core";
import { Button, Container, Notice, Radio } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { EnquirySummary } from "@/components/sites/EnquirySummary";
import { DateOrder } from "@/components/sites/Enhance";
import { indiaDate } from "@/lib/sites/calendar";
import { ARTWORK, type Artwork } from "@/lib/sites/enquiries";
import { BUYER_COOKIE, maskEmail, readBuyer } from "@/lib/sites/enquiry";
import { getSite } from "@/lib/sites/queries";
import { availabilityOf, priceOf } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Send an enquiry",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, { t: string; d: string }> = {
  dates: {
    t: "Check the dates.",
    d: "The start must be today or later, and the end on or after the start.",
  },
  brand: {
    t: "Add the brand and its category.",
    d: "A few words are enough, such as “Namma Bakes, food and drink”.",
  },
  budget: { t: "Check the budget.", d: "It should be a number in rupees, or left empty." },
  email: { t: "That email did not look right.", d: "Check it and send again. Nothing was sent." },
  busy: {
    t: "Too many tries in a short time.",
    d: "Wait a minute, then send it again. Nothing was sent.",
  },
  send: { t: "We could not send it just now.", d: "Nothing was lost. Try again in a minute." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
const isDate = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function EnquirePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id } = await params;
  if (!isPermanentId(id)) notFound();
  const found = await getSite(id);
  if (!found || found.site.removed || !found.owner) notFound();
  const { site, owner } = found;

  const q = await searchParams;
  const now = Date.now();
  const today = indiaDate(now);
  const error = ERRORS[one(q.error)];
  const from = isDate(one(q.from)) ? one(q.from) : "";
  const to = isDate(one(q.to)) ? one(q.to) : "";
  const artwork: Artwork = one(q.artwork) in ARTWORK ? (one(q.artwork) as Artwork) : "not_started";
  const known = readBuyer((await cookies()).get(BUYER_COOKIE)?.value);
  const availability = availabilityOf(site, now);
  const action = priceOf(site).shown ? "Send enquiry" : "Ask for a quote";

  return (
    <Shell active="find">
      <DateOrder />
      <Container className="py-8 lg:py-12">
        <div className={FORM_GRID}>
          <div className="min-w-0">
            <p className="t-label text-ink-muted">Enquiry</p>
            <h1 className="t-display-md mt-2">
              {action === "Send enquiry" ? "Send an enquiry" : "Ask for a quote"}
            </h1>
            <p className="t-body text-ink-muted mt-2">
              It goes straight to {owner.name}, who replies to you by email. OOHWORKS charges
              nothing and never sits in between.
            </p>

            {error ? (
              <Notice tone="error" title={error.t} section="enquiry-error" className="mt-5">
                {error.d}
              </Notice>
            ) : null}
            {availability.state === "booked" ? (
              <p
                className="t-small border-hairline bg-paper-raised text-ink mt-5 rounded-sm border px-3 py-2"
                data-section="booked-note"
              >
                {availability.label}. {availability.note}
              </p>
            ) : null}

            <form
              method="post"
              action="/api/enquire/"
              className="mt-6 flex flex-col gap-5"
              data-section="enquiry-form"
            >
              <input type="hidden" name="id" value={id} />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="sr-only"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="enq-from" className="oh-label">
                    From
                  </label>
                  <input
                    id="enq-from"
                    name="from"
                    type="date"
                    required
                    min={today}
                    defaultValue={from}
                    className="oh-input data mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="enq-to" className="oh-label">
                    Until
                  </label>
                  <input
                    id="enq-to"
                    name="to"
                    type="date"
                    required
                    min={from || today}
                    defaultValue={to}
                    className="oh-input data mt-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="enq-brand" className="oh-label">
                  Brand and category
                </label>
                <input
                  id="enq-brand"
                  name="brand"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  defaultValue={one(q.brand).slice(0, 120)}
                  autoComplete="organization"
                  aria-describedby="enq-brand-help"
                  className="oh-input mt-1"
                />
                <p id="enq-brand-help" className="t-small text-ink-muted mt-1">
                  Owners check this against what a site may carry.
                </p>
              </div>

              <div>
                <label htmlFor="enq-budget" className="oh-label">
                  Budget a month, optional
                </label>
                <div className="oh-affix mt-1">
                  <span aria-hidden="true">₹</span>
                  <input
                    id="enq-budget"
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9, ]*"
                    maxLength={14}
                    defaultValue={/^\d+$/.test(one(q.budget)) ? one(q.budget) : ""}
                    aria-describedby="enq-budget-help"
                    className="oh-input data"
                  />
                </div>
                <p id="enq-budget-help" className="t-small text-ink-muted mt-1">
                  In rupees. It helps the owner answer at once.
                </p>
              </div>

              <fieldset>
                <legend className="oh-label">Artwork</legend>
                <div className="mt-1 flex flex-wrap gap-x-6">
                  {(Object.keys(ARTWORK) as Artwork[]).map((key) => (
                    <Radio
                      key={key}
                      name="artwork"
                      value={key}
                      defaultChecked={artwork === key}
                      label={ARTWORK[key]}
                    />
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="enq-message" className="oh-label">
                  Message, optional
                </label>
                <textarea
                  id="enq-message"
                  name="message"
                  rows={4}
                  maxLength={2000}
                  className="oh-input mt-1 block"
                />
              </div>

              <div>
                <label htmlFor="enq-email" className="oh-label">
                  Your work email
                </label>
                <input
                  id="enq-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  defaultValue={known ?? ""}
                  aria-describedby="enq-email-help"
                  className="oh-input mt-1"
                />
                <p
                  id="enq-email-help"
                  className="t-small text-ink-muted mt-1"
                  data-section="email-help"
                >
                  {known
                    ? `This browser has already confirmed ${maskEmail(known)}, so no code is needed. A different address gets a code.`
                    : "We send a code to confirm it is you. Owners only see verified enquiries."}
                </p>
              </div>

              <div>
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full sm:w-auto"
                  type="submit"

                  data-action="send"
                >
                  {action}
                </Button>
              </div>
            </form>
          </div>

          <div className="order-first lg:order-none">
            <EnquirySummary site={site} owner={owner} now={now} />
          </div>
        </div>
      </Container>
    </Shell>
  );
}
