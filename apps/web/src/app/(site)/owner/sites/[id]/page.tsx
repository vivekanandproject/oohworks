import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPermanentId } from "@ohworks/core";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { NativeSelect } from "@/components/NativeSelect";
import { Notice, OwnerBar, Score, StateTag } from "@/components/owners/Bits";
import { CONTENT_GRID, PageHead } from "@/components/owners/Frame";
import { formatDate } from "@/lib/editorial/format";
import { picture } from "@/lib/editorial/media";
import { improvements, stateOf } from "@/lib/owners/progress";
import { MAX_PHOTOS, ownerSite, photoOf, requireOwner } from "@/lib/owners/server";
import { indiaDate } from "@/lib/sites/calendar";
import { maskEmail } from "@/lib/sites/enquiry";
import { lightingDef } from "@/lib/sites/taxonomy";
import {
  availabilityOf,
  coords,
  facingText,
  formatLabel,
  placeLine,
  priceOf,
  siteUrl,
  sizeFull,
} from "@/lib/sites/view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your site", robots: { index: false, follow: false } };

const KIND = { approach: "Approach, from the road", day: "Day, close", night: "Night" } as const;
const PHOTO_ERRORS: Record<string, string> = {
  missing: "Choose a photograph first.",
  big: "That photograph is over 10 MB. Use a smaller one.",
  type: "Use a JPEG, PNG or WebP photograph.",
  many: `A site holds up to ${MAX_PHOTOS} photographs. Remove one to add another.`,
  date: "This photograph does not record when it was taken. Give the date; it cannot be in the future.",
  read: "We could not read that file as a photograph. Try another.",
};
/** What happened to an added photograph: where its date came from, and whether it matched the pin. */
function photoAdded(q: Record<string, string | string[] | undefined>): string {
  const said = ["Photograph added."];
  if (one(q.from) === "file") said.push("Its date was read from the photograph.");
  if (one(q.gps) === "1") said.push("It was taken at the pin, so buyers see it as GPS-stamped.");
  const away = Number(one(q.away));
  if (Number.isFinite(away) && away > 0)
    said.push(
      `It was taken about ${away >= 1000 ? `${(away / 1000).toFixed(1)} km` : `${away} m`} from the pin. Check that the pin is right and that this is the right site.`,
    );
  return said.join(" ");
}

const QUICK_ERRORS: Record<string, string> = {
  rate: "Give the monthly rate as a number of rupees, such as 85000.",
  norate:
    "The price is set to show, but there is no rate. Give a rate, or choose “Price on request”.",
  date: "Give a date, today or later, that the site is booked until.",
  notlive: "Only a live site is updated here.",
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function OwnerSitePage({
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
  const state = stateOf(site);
  const now = Date.now();
  const today = indiaDate(now);
  const price = priceOf(site);
  const availability = availabilityOf(site, now);
  const tips = improvements(site, owner);
  const photos = site.photos ?? [];
  const booked = Boolean(site.bookedUntil && site.bookedUntil.slice(0, 10) >= today);
  const facts: [string, string | null][] = [
    ["Format", formatLabel(site.format)],
    ["Size", sizeFull(site)],
    ["Lighting", lightingDef(site.lighting)?.label ?? null],
    ["Where", `${site.road}, ${placeLine(site)}${site.landmark ? ` · ${site.landmark}` : ""}`],
    ["Position", coords(site.lat, site.lng)],
    ["Faces", facingText(site.facingDeg)],
    ["Price", price.shown ? `${price.prefix}${price.amount} a month` : "Price on request"],
    ["Availability", availability.label],
    ["Your reference", site.ownerRef ?? null],
  ];

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        <OwnerBar name={owner.name} email={maskEmail(email)} here="site" />
        <div className="mt-6">
          <PageHead
            eyebrow={
              <>
                Your sites · <span className="font-mono">{site.permanentId}</span>
              </>
            }
            title={site.title}
            status={<StateTag state={state} />}
          >
            {placeLine(site)}
          </PageHead>
        </div>

        <div className={`mt-6 ${CONTENT_GRID}`}>
          <div className="min-w-0 space-y-10">
            <div className="space-y-3 empty:hidden" data-section="site-notes">
              {one(q.saved) === "1" ? (
                <Notice tone="success" title="Saved as a draft." section="saved">
                  Only you can see it. Add photographs below, then send it for review from your
                  sites.
                </Notice>
              ) : null}
              {one(q.withdrawn) === "1" ? (
                <Notice tone="success" title="This site is off ohworks." section="withdrawn">
                  It is a draft again. Send it for review when you want it back.
                </Notice>
              ) : null}
              {state === "draft" ? (
                <p className="t-body text-ink" data-section="state-note">
                  Only you can see this. When it is ready,{" "}
                  <a href="/owner/" className="oh-link">
                    send it for review from your sites
                  </a>
                  .
                </p>
              ) : null}
              {state === "review" ? (
                <p className="t-body text-ink" data-section="state-note">
                  With the ohworks team since {formatDate(site.submittedAt)}. We check the owner,
                  the location and the photographs, usually within a working day.
                </p>
              ) : null}
              {state === "changes" ? (
                <Notice
                  tone="warning"
                  title="It needs a change before it can go live."
                  section="review-note"
                >
                  Our reviewer wrote: &ldquo;{site.reviewNote}&rdquo;{" "}
                  <a href={`/owner/sites/${id}/edit/`} className="oh-link">
                    Fix it
                  </a>
                  , then send it again from your sites.
                </Notice>
              ) : null}
              {state === "live" ? (
                <p className="t-body text-ink" data-section="state-note">
                  Buyers can find it.{" "}
                  <a href={siteUrl(site)} className="oh-link">
                    View it as a buyer does
                  </a>
                  . Enquiries come to{" "}
                  <span className="font-mono">{maskEmail(owner.contactEmail)}</span>.
                </p>
              ) : null}
              {site.duplicateNote ? (
                <Notice
                  tone="warning"
                  title="Is this the same face as one already listed?"
                  section="duplicate"
                >
                  {site.duplicateNote.replace(/, listed by .*$/, "")}, facing the same way. If it is
                  the same face, do not list it twice. If it is a different face, carry on: our team
                  will check.
                </Notice>
              ) : null}
            </div>
            {state === "live" ? (
              <section id="update" className="scroll-mt-28" data-section="quick">
                <h2 className="t-display-sm">Update the price or availability</h2>
                <p className="t-body text-ink-muted mt-1">
                  These are yours to set, so they change at once, with no review. Saving also
                  confirms availability as of today.
                </p>
                <div className="mt-3 space-y-3">
                  {one(q.updated) === "1" ? (
                    <Notice
                      tone="success"
                      title="Updated. Buyers see it now."
                      section="quick-saved"
                    />
                  ) : null}
                  {QUICK_ERRORS[one(q.qerror)] ? (
                    <Notice
                      tone="error"
                      title={QUICK_ERRORS[one(q.qerror)] ?? ""}
                      section="quick-error"
                    />
                  ) : null}
                </div>
                <form
                  method="post"
                  action="/api/owner/quick/"
                  className="border-hairline bg-paper-raised mt-4 flex flex-col gap-4 rounded-md border p-5"
                  data-section="quick-form"
                >
                  <input type="hidden" name="id" value={id} />
                  <fieldset>
                    <legend className="oh-label">How the price shows</legend>
                    <div className="flex flex-wrap gap-x-6">
                      {(
                        [
                          ["exact", "Exact rate"],
                          ["from", "“From” price"],
                          ["on_request", "Price on request"],
                        ] as const
                      ).map(([v, label]) => (
                        <label
                          key={v}
                          className="t-body flex min-h-11 cursor-pointer items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="priceDisplay"
                            value={v}
                            defaultChecked={site.priceDisplay === v}
                            className="accent-navy h-[18px] w-[18px]"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="max-w-[280px]">
                    <label htmlFor="quick-rate" className="oh-label block">
                      Rate a month
                    </label>
                    <div className="oh-affix mt-1">
                      <span aria-hidden="true">₹</span>
                      <input
                        id="quick-rate"
                        name="rate"
                        type="text"
                        inputMode="numeric"
                        maxLength={14}
                        defaultValue={site.rate ?? ""}
                        className="oh-input data"
                      />
                    </div>
                  </div>
                  <fieldset>
                    <legend className="oh-label">Availability</legend>
                    <div className="flex flex-wrap gap-x-6">
                      <label className="t-body flex min-h-11 cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="availability"
                          value="free"
                          defaultChecked={!booked}
                          className="accent-navy h-[18px] w-[18px]"
                        />
                        It is free now
                      </label>
                      <label className="t-body flex min-h-11 cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="availability"
                          value="booked"
                          defaultChecked={booked}
                          className="accent-navy h-[18px] w-[18px]"
                        />
                        It is booked until
                      </label>
                    </div>
                    <label htmlFor="quick-booked" className="sr-only">
                      Booked until
                    </label>
                    <input
                      id="quick-booked"
                      name="bookedUntil"
                      type="date"
                      min={today}
                      defaultValue={booked ? (site.bookedUntil ?? "").slice(0, 10) : ""}
                      className="oh-input data mt-1 max-w-[220px]"
                    />
                  </fieldset>
                  <div>
                    <button type="submit" className="oh-btn primary" data-action="quick-save">
                      Save and confirm as of today
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            <section id="photos" className="scroll-mt-28" data-section="photos">
              <h2 className="t-display-sm">Photographs</h2>
              <p className="t-body text-ink-muted mt-1">
                Real photographs of this face in its street. The approach view, from the road, is
                the one buyers see first. No stock images and no renders.
              </p>
              <div className="mt-3 space-y-3">
                {one(q.photo) === "added" ? (
                  <Notice tone="success" title={photoAdded(q)} section="photo-added" />
                ) : null}
                {one(q.photo) === "removed" ? (
                  <Notice tone="success" title="Photograph removed." section="photo-removed" />
                ) : null}
                {PHOTO_ERRORS[one(q.perror)] ? (
                  <Notice
                    tone="error"
                    title={PHOTO_ERRORS[one(q.perror)] ?? ""}
                    section="photo-error"
                  />
                ) : null}
              </div>
              {photos.length ? (
                <ul className="mt-4 grid gap-4 sm:grid-cols-3" data-section="photo-list">
                  {photos.map((p) => {
                    const media = photoOf(p);
                    const pic = picture(media, "card");
                    return (
                      <li
                        key={p.id ?? media?.id}
                        className="border-hairline bg-paper-raised overflow-hidden rounded-md border"
                      >
                        {pic ? (
                          <img
                            src={pic.src}
                            alt={pic.alt}
                            width={pic.width}
                            height={pic.height}
                            loading="lazy"
                            className="aspect-[3/2] w-full object-cover"
                          />
                        ) : null}
                        <div className="p-3">
                          <p className="t-small text-ink font-semibold">{KIND[p.kind]}</p>
                          <p className="t-data-sm text-ink-muted">{formatDate(p.takenOn)}</p>
                          {media ? (
                            <form method="post" action="/api/owner/photo/remove/" className="mt-2">
                              <input type="hidden" name="id" value={id} />
                              <input type="hidden" name="media" value={media.id} />
                              <button type="submit" className="oh-link t-small cursor-pointer">
                                Remove<span className="sr-only">: {KIND[p.kind]}</span>
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p
                  className="border-hairline bg-paper-sunken text-ink-muted t-body mt-4 rounded-md border px-4 py-6 text-center"
                  data-section="no-photos"
                >
                  No photo yet. A site with a real photograph ranks higher and is checked faster.
                </p>
              )}
              {photos.length < MAX_PHOTOS ? (
                <form
                  method="post"
                  action="/api/owner/photo/"
                  encType="multipart/form-data"
                  className="border-hairline bg-paper-raised mt-4 grid gap-4 rounded-md border p-5 sm:grid-cols-2"
                  data-section="photo-form"
                >
                  <input type="hidden" name="id" value={id} />
                  <div className="sm:col-span-2">
                    <label htmlFor="photo-file" className="oh-label block">
                      Add a photograph
                    </label>
                    <input
                      id="photo-file"
                      name="photo"
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp"
                      aria-describedby="photo-file-help"
                      className="oh-input mt-1"
                    />
                    <p id="photo-file-help" className="t-small text-ink-muted mt-1">
                      JPEG, PNG or WebP, up to 10 MB. Up to {MAX_PHOTOS} for a site.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="photo-kind" className="oh-label block">
                      What it shows
                    </label>
                    <NativeSelect
                      id="photo-kind"
                      name="kind"
                      value={
                        photos.some((p) => p.kind === "approach")
                          ? photos.some((p) => p.kind === "day")
                            ? "night"
                            : "day"
                          : "approach"
                      }
                      options={(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => ({
                        value: k,
                        label: KIND[k],
                      }))}
                      className="oh-input mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="photo-date" className="oh-label block">
                      Date it was taken, if the photograph does not record it
                    </label>
                    <input
                      id="photo-date"
                      name="takenOn"
                      type="date"
                      max={today}
                      defaultValue={today}
                      className="oh-input data mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className="oh-btn secondary" data-action="add-photo">
                      Add this photograph
                    </button>
                  </div>
                </form>
              ) : null}
            </section>

            <section data-section="facts">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="t-display-sm">What buyers will see</h2>
                {state === "live" ? null : (
                  <a
                    href={`/owner/sites/${id}/edit/`}
                    className="oh-link t-body"
                    data-action="edit"
                  >
                    Edit the details
                  </a>
                )}
              </div>
              <dl className="oh-spec mt-4">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    {value ? <dd>{value}</dd> : <dd className="gap">Not given</dd>}
                  </div>
                ))}
              </dl>
              {state === "live" ? (
                <p className="t-small text-ink-muted mt-3">
                  To change what the site is or where it is,{" "}
                  <a
                    href={`mailto:owners@ohworks.com?subject=${encodeURIComponent(`Change to ${site.permanentId}`)}`}
                    className="oh-link"
                  >
                    write to us
                  </a>
                  . That is what the badges vouch for, so it is checked again.
                </p>
              ) : null}
            </section>
          </div>

          <aside
            className="flex flex-col gap-5 self-start lg:sticky lg:top-24"
            aria-label="About this listing"
            data-section="site-aside"
          >
            <section
              className="border-hairline bg-paper-raised rounded-md border p-5"
              data-section="score"
            >
              <h2 className="t-display-sm">How complete it is</h2>
              <div className="mt-3">
                <Score value={site.qualityScore ?? 0} />
              </div>
              {tips.length ? (
                <ul className="t-body text-ink mt-4 space-y-2">
                  {tips.map((t) => (
                    <li key={t.text} className="flex items-baseline justify-between gap-4">
                      <span>{t.text}</span>
                      <span className="t-data-sm text-ink-muted shrink-0">+{t.points}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="t-body text-ink mt-4">
                  Nothing is missing. This listing is as complete as it can be.
                </p>
              )}
              <p className="t-small text-ink-muted mt-4">
                A fuller listing ranks higher. Paying ohworks never does.
              </p>
            </section>
            {state === "live" ? (
              <form
                method="post"
                action="/api/owner/site/withdraw/"
                className="border-hairline bg-paper-raised rounded-md border p-5"
                data-section="withdraw"
              >
                <input type="hidden" name="id" value={id} />
                <h2 className="t-display-sm">Withdraw this site</h2>
                <p className="t-body text-ink-muted mt-3">
                  It comes off ohworks at once and becomes a draft. You can send it for review again
                  later.
                </p>
                <button type="submit" className="oh-btn danger mt-4" data-action="withdraw">
                  Withdraw from ohworks
                </button>
              </form>
            ) : state === "review" ? null : (
              <form
                method="post"
                action="/api/owner/site/remove/"
                className="border-hairline bg-paper-raised rounded-md border p-5"
                data-section="remove"
              >
                <input type="hidden" name="id" value={id} />
                <h2 className="t-display-sm">Remove this site</h2>
                <p className="t-body text-ink-muted mt-3">
                  It has never been live, so it is removed for good.
                </p>
                <button type="submit" className="oh-btn danger mt-4" data-action="remove">
                  Remove this draft
                </button>
              </form>
            )}
          </aside>
        </div>
      </Container>
    </Shell>
  );
}
