import { getPayload, APIError, type PayloadRequest } from "payload";
import config from "@payload-config";
import type { Owner, Site, SiteChange } from "@/payload-types";
import { deliverMail } from "@/payload/mailer";
import { siteUrl } from "@/lib/hosting";
import { indiaDate } from "@/lib/sites/calendar";
import { distanceKm } from "@/lib/sites/filter";
import { teamEmail } from "./server";
import { MOVED_METRES, differences, summaryOf } from "./change-diff";
import { checkSite, rawFromSite, toSiteData, type Raw, type SiteInput } from "./site-input";

/**
 * Changes to a site that is already live. What a site is and where it is are what the badges vouch
 * for, so they go to the team first, and buyers keep seeing the live version until it is approved.
 * Price and availability are not part of it: the owner changes those at once from the site's page.
 */

const client = () => getPayload({ config });

/** A site's form values after the same checks as the form, so "20" and "20.0" are not a change. */
const asForm = (input: SiteInput, today: string): Raw =>
  rawFromSite(toSiteData(input, today) as Parameters<typeof rawFromSite>[0]);

/** The change waiting for the team, or returned to the owner, if there is one. */
export async function openChange(siteId: number): Promise<SiteChange | null> {
  const found = await (
    await client()
  ).find({
    collection: "site-changes",
    where: { and: [{ site: { equals: siteId } }, { status: { in: ["submitted", "changes"] } }] },
    sort: "-submittedAt",
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return found.docs[0] ?? null;
}

/**
 * Sends an owner's changes to a live site to the team, replacing any they had sent before and not yet
 * had decided. Returns false when nothing changed.
 */
export async function proposeChange(owner: Owner, site: Site, input: SiteInput): Promise<boolean> {
  const today = indiaDate(Date.now());
  const proposed = asForm(input, today);
  const diffs = differences(rawFromSite(site as Parameters<typeof rawFromSite>[0]), proposed);
  if (diffs.length === 0) return false;
  const moved = distanceKm(site, input) * 1000 > MOVED_METRES;
  const payload = await client();
  const data = {
    site: site.id,
    owner: owner.id,
    unitId: site.permanentId ?? "",
    status: "submitted" as const,
    summary: summaryOf(diffs),
    moved,
    proposed,
    reviewNote: null,
    submittedAt: new Date().toISOString(),
  };
  const open = await openChange(site.id);
  const change = open
    ? await payload.update({ collection: "site-changes", id: open.id, data, overrideAccess: true })
    : await payload.create({ collection: "site-changes", data, overrideAccess: true });
  await deliverMail(payload, {
    kind: "team_notice",
    to: teamEmail(),
    replyTo: owner.contactEmail,
    subject: `Changes to a live site, from ${owner.name}: ${site.title ?? site.permanentId}`,
    text: [
      `${owner.name} changed ${site.title ?? site.permanentId}, which is live.`,
      "",
      data.summary,
      ...(moved
        ? ["", "The pin moved. Approving clears Verified location until you check it again."]
        : []),
      "",
      `Decide: ${siteUrl()}/admin/collections/site-changes/${change.id}`,
      "Buyers see the live version until you approve.",
    ].join("\n"),
  }).catch(() => undefined);
  return true;
}

/** The owner takes back changes the team has not yet approved. */
export async function withdrawChange(site: Site): Promise<boolean> {
  const open = await openChange(site.id);
  if (!open) return false;
  await (
    await client()
  ).update({
    collection: "site-changes",
    id: open.id,
    data: { status: "withdrawn" },
    overrideAccess: true,
  });
  return true;
}

/**
 * The team's decision, from the collection's hook. Approving puts the changes on the live site (the
 * price and availability as they are now stay) and tells the owner; returning tells them why.
 */
export async function settleChange(req: PayloadRequest, change: SiteChange): Promise<void> {
  const payload = req.payload;
  const siteId = typeof change.site === "object" ? change.site.id : change.site;
  const site = await payload.findByID({
    collection: "sites",
    id: siteId,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const ownerId = typeof site.owner === "object" ? site.owner.id : site.owner;
  const owner = await payload.findByID({
    collection: "owners",
    id: ownerId,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const manage = `${siteUrl()}/owner/sites/${site.permanentId}/`;

  if (change.status === "approved") {
    const today = indiaDate(Date.now());
    const raw = { ...(change.proposed as Raw), bookedUntil: "" };
    const checked = checkSite(raw, today);
    if (!checked.ok)
      throw new APIError(
        `These changes no longer pass the site checks (${Object.keys(checked.errors).join(", ")}). Return them to the owner instead.`,
        400,
      );
    // Price and availability stay as they are now: the owner changes those at once, not here.
    const data: Partial<ReturnType<typeof toSiteData>> = toSiteData(checked.site, today);
    delete data.priceDisplay;
    delete data.rate;
    delete data.bookedUntil;
    delete data.availabilityConfirmedOn;
    const moved = distanceKm(site, checked.site) * 1000 > MOVED_METRES;
    const updated = await payload.update({
      collection: "sites",
      id: siteId,
      data: { ...data, ...(moved ? { verifiedLocation: false, lastVerifiedOn: null } : {}) },
      overrideAccess: true,
      req,
    });
    if (owner.loginEmail)
      await deliverMail(
        payload,
        {
          kind: "owner_notice",
          to: owner.loginEmail,
          subject: `Your changes are live: ${updated.title}`,
          text: [
            `The team approved your changes to ${updated.title}. Buyers see them now.`,
            "",
            change.summary ?? "",
            ...(moved
              ? [
                  "",
                  "The pin moved, so the team will check the location again before it shows as verified.",
                ]
              : []),
            "",
            `Your site: ${manage}`,
          ].join("\n"),
        },
        req,
      ).catch(() => undefined);
    return;
  }

  if (owner.loginEmail)
    await deliverMail(
      payload,
      {
        kind: "owner_notice",
        to: owner.loginEmail,
        subject: `One thing to fix in your changes: ${site.title}`,
        text: [
          `We checked your changes to ${site.title}. Buyers still see the live version.`,
          "",
          `What the reviewer wrote: ${String(change.reviewNote ?? "").trim()}`,
          "",
          `Fix them and send them again: ${manage}edit/`,
        ].join("\n"),
      },
      req,
    ).catch(() => undefined);
}
