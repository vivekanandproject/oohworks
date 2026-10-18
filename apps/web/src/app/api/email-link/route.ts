import { getPayload } from "payload";
import config from "@payload-config";
import { availabilityDayFresh, checkLinkKey, type LinkPurpose } from "@/lib/email-links";
import { currentIds } from "@/lib/jobs/alerts";
import { seeOther } from "@/lib/forms";
import { indiaDate } from "@/lib/sites/calendar";

export const dynamic = "force-dynamic";

const PURPOSES: readonly LinkPurpose[] = [
  "confirm-follow",
  "unfollow",
  "confirm-subscriber",
  "unsubscribe",
  "availability",
];

/**
 * The links in emails (src/lib/email-links.ts): confirm a follow or a newsletter sign-up, leave either,
 * or confirm an owner's sites as still free. Each does its one thing, then says so on /email/{result}/.
 */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const purpose = q.get("p") as LinkPurpose;
  const id = Number(q.get("id"));
  const key = q.get("k") ?? "";
  const day = q.get("d") ?? "";
  const go = (result: string) => seeOther(req, `/email/${result}/`);
  if (!PURPOSES.includes(purpose) || !Number.isInteger(id) || id < 1) return go("link-not-valid");
  if (!checkLinkKey(purpose, id, key, purpose === "availability" ? day : ""))
    return go("link-not-valid");

  const payload = await getPayload({ config });
  const now = new Date().toISOString();
  try {
    switch (purpose) {
      case "confirm-follow": {
        const follow = await payload.findByID({
          collection: "follows",
          id,
          depth: 0,
          overrideAccess: true,
        });
        // Only sites listed from now on are news: what matches today is remembered as already seen.
        if (!follow.confirmed)
          await payload.update({
            collection: "follows",
            id,
            data: { confirmed: true, unsubscribedAt: null, seen: await currentIds(follow) },
            overrideAccess: true,
          });
        return go("following");
      }
      case "unfollow":
        await payload.update({
          collection: "follows",
          id,
          data: { unsubscribedAt: now },
          overrideAccess: true,
        });
        return go("unfollowed");
      case "confirm-subscriber":
        await payload.update({
          collection: "subscribers",
          id,
          data: { confirmed: true, unsubscribedAt: null },
          overrideAccess: true,
        });
        return go("subscribed");
      case "unsubscribe":
        await payload.update({
          collection: "subscribers",
          id,
          data: { unsubscribedAt: now },
          overrideAccess: true,
        });
        return go("unsubscribed");
      case "availability": {
        if (!availabilityDayFresh(day)) return go("link-expired");
        const today = indiaDate(Date.now());
        const sites = (
          await payload.find({
            collection: "sites",
            where: {
              and: [
                { owner: { equals: id } },
                { _status: { equals: "published" } },
                { removed: { not_equals: true } },
                {
                  or: [{ bookedUntil: { exists: false } }, { bookedUntil: { less_than: now } }],
                },
              ],
            },
            pagination: false,
            depth: 0,
            overrideAccess: true,
          })
        ).docs;
        for (const s of sites)
          await payload.update({
            collection: "sites",
            id: s.id,
            data: { availabilityConfirmedOn: today },
            overrideAccess: true,
          });
        return go("availability-confirmed");
      }
    }
  } catch {
    // The record has gone, such as a follow already removed.
    return go("link-not-valid");
  }
  return go("link-not-valid");
}
