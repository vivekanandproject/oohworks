import { getPayload } from "payload";
import config from "@payload-config";
import { emailLink } from "@/lib/email-links";
import { siteUrl } from "@/lib/hosting";
import { sendMail } from "@/lib/sites/mail";

/** A live site whose availability was last confirmed longer ago than this is asked about. */
export const REMIND_AFTER_DAYS = 21;
const DAY = 24 * 3600 * 1000;

/**
 * Asks each owner, once a week, about their live sites whose availability has not been confirmed for
 * three weeks: one email, with a link that confirms them all as free in one tap. A site booked into the
 * future is not asked about. Runs weekly.
 */
export async function remindAvailability(
  now = Date.now(),
): Promise<{ owners: number; sites: number }> {
  const payload = await getPayload({ config });
  const cutoff = new Date(now - REMIND_AFTER_DAYS * DAY).toISOString();
  const sites = (
    await payload.find({
      collection: "sites",
      where: {
        and: [
          { _status: { equals: "published" } },
          { removed: { not_equals: true } },
          {
            or: [
              { availabilityConfirmedOn: { exists: false } },
              { availabilityConfirmedOn: { less_than: cutoff } },
            ],
          },
          {
            or: [
              { bookedUntil: { exists: false } },
              { bookedUntil: { less_than: new Date(now).toISOString() } },
            ],
          },
        ],
      },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
  ).docs;
  const byOwner = new Map<number, typeof sites>();
  for (const s of sites) {
    const id = typeof s.owner === "object" ? s.owner.id : s.owner;
    byOwner.set(id, [...(byOwner.get(id) ?? []), s]);
  }
  let owners = 0;
  for (const [ownerId, theirs] of byOwner) {
    const owner = await payload.findByID({
      collection: "owners",
      id: ownerId,
      depth: 0,
      overrideAccess: true,
    });
    const to = owner.loginEmail || owner.contactEmail;
    if (!to) continue;
    const n = theirs.length === 1 ? "this site" : `these ${theirs.length} sites`;
    await sendMail({
      kind: "owner_notice",
      to,
      subject:
        theirs.length === 1
          ? `Is ${theirs[0]!.title} still free?`
          : `Are your ${theirs.length} sites still free?`,
      text: [
        `Buyers see when you last confirmed a site is free. For ${n} it has been more than three weeks, so buyers are told to ask first:`,
        "",
        ...theirs.map((s) => `- ${s.title}`),
        "",
        `If nothing has changed, confirm them all as free in one step: ${emailLink("availability", ownerId, now)}`,
        `If one is booked, give its date on its page: ${siteUrl()}/owner/`,
      ].join("\n"),
    });
    owners += 1;
  }
  return { owners, sites: sites.length };
}
