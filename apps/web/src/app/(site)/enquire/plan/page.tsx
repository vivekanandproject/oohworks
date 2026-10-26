import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button, Badge, Container, NEUTRALITY_LINE, Notice, Radio } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { DateOrder } from "@/components/sites/Enhance";
import { indiaDate } from "@/lib/sites/calendar";
import { ARTWORK, BUYER_COOKIE, maskEmail, readBuyer, type Artwork } from "@/lib/sites/enquiry";
import { isDay } from "@/lib/sites/enquiry-form";
import { LISTS, parseIds } from "@/lib/sites/lists";
import { readLists } from "@/lib/sites/lists-server";
import { cardsFor, type Card } from "@/lib/sites/queries";
import { placeLine, priceOf } from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Send one enquiry for your shortlist",
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
  email: { t: "That email did not look right.", d: "Check it and send again. Nothing was sent." },
  sites: { t: "Choose at least one site.", d: "Tick the sites you want to ask about." },
  owners: {
    t: "That is more owners than one enquiry can reach.",
    d: "Untick some sites and send the rest as a second enquiry.",
  },
  busy: {
    t: "Too many tries in a short time.",
    d: "Wait a minute, then send it again. Nothing was sent.",
  },
  send: { t: "We could not send it just now.", d: "Nothing was lost. Try again in a minute." },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function PlanEnquiryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const asked = parseIds(one(q.sites), LISTS.saved.max);
  const ids = asked.length ? asked : (await readLists()).saved;
  const cards = await cardsFor(ids);
  if (cards.length === 0) redirect("/shortlist/");

  const groups = new Map<number, Card[]>();
  for (const card of cards)
    if (card.owner) groups.set(card.owner.id, [...(groups.get(card.owner.id) ?? []), card]);
  const today = indiaDate(Date.now());
  const error = ERRORS[one(q.error)];
  const from = isDay(one(q.from)) ? one(q.from) : "";
  const to = isDay(one(q.to)) ? one(q.to) : "";
  const artwork: Artwork = one(q.artwork) in ARTWORK ? (one(q.artwork) as Artwork) : "not_started";
  const known = readBuyer((await cookies()).get(BUYER_COOKIE)?.value);
  const owners = groups.size;

  return (
    <Shell active="find">
      <DateOrder />
      <Container className="py-8 lg:py-12">
        <p className="t-label text-ink-muted">Enquiry</p>
        <h1 className="t-display-md mt-2">One enquiry for your shortlist</h1>
        <p className="t-body text-ink-muted mt-2 max-w-[68ch]">
          You fill this in once.{" "}
          {owners === 1
            ? "It goes straight to the owner of these sites."
            : `It is split into ${owners} requests, one for each owner. Each owner sees only their own sites, never the rest of your shortlist.`}{" "}
          Your budget is not sent.
        </p>

        {error ? (
          <Notice tone="error" title={error.t} section="enquiry-error" className="mt-5">
            {error.d}
          </Notice>
        ) : null}

        <form
          method="post"
          action="/api/enquire/plan/"
          className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
          data-section="plan-enquiry-form"
        >
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />

          <fieldset className="min-w-0 space-y-4" data-section="plan-sites">
            <legend className="t-display-sm">Who gets what</legend>
            {[...groups.entries()].map(([ownerId, items]) => {
              const owner = items[0]?.owner;
              return (
                <section
                  key={ownerId}
                  className="border-hairline bg-paper-raised overflow-hidden rounded-md border"
                  data-owner={owner?.slug ?? ownerId}
                >
                  <header className="border-hairline bg-paper-sunken flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                    <h2 className="t-title">{owner?.name ?? "Owner"}</h2>
                    <div className="flex flex-wrap gap-1">
                      {owner?.verified ? <Badge kind="verified">Verified owner</Badge> : null}
                      {owner?.medianReplyHours != null && owner.medianReplyHours < 24 ? (
                        <Badge kind="responsive">Replies in under a day</Badge>
                      ) : null}
                    </div>
                  </header>
                  <ul>
                    {items.map((card) => {
                      const price = priceOf(card.site);
                      return (
                        <li key={card.site.id} className="border-hairline border-b last:border-b-0">
                          <label className="flex min-h-11 cursor-pointer items-start gap-3 px-4 py-3">
                            <input
                              type="checkbox"
                              name="ids"
                              value={card.site.permanentId ?? ""}
                              defaultChecked
                              className="accent-navy mt-1 h-[18px] w-[18px] shrink-0"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="t-body-strong block">{card.site.title}</span>
                              <span className="t-small text-ink-muted block">
                                {placeLine(card.site)}
                              </span>
                            </span>
                            <span className="t-data shrink-0 text-right">
                              {price.shown ? `${price.prefix}${price.amount}` : "Price on request"}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </fieldset>

          <div className="flex min-w-0 flex-col gap-5">
            <h2 className="t-display-sm">What you are asking</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="enq-from" className="oh-label block">
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
                <label htmlFor="enq-to" className="oh-label block">
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
              <label htmlFor="enq-brand" className="oh-label block">
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
              <label htmlFor="enq-message" className="oh-label block">
                Message to every owner, optional
              </label>
              <textarea
                id="enq-message"
                name="message"
                rows={4}
                maxLength={2000}
                aria-describedby="enq-message-help"
                className="oh-input mt-1 block"
              />
              <p id="enq-message-help" className="t-small text-ink-muted mt-1">
                Every owner reads the same message, so leave out anything meant for one of them.
              </p>
            </div>
            <div>
              <label htmlFor="enq-email" className="oh-label block">
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
                {owners === 1 ? "Send enquiry" : `Send enquiry to ${owners} owners`}
              </Button>
            </div>
            <p className="t-small text-ink-muted">{NEUTRALITY_LINE}</p>
          </div>
        </form>
      </Container>
    </Shell>
  );
}
