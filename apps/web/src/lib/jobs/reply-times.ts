import { getPayload } from "payload";
import config from "@payload-config";
import { refreshReplyTime } from "@/lib/sites/enquiries";

/** Works out each owner's typical reply time again from their answered enquiries. Runs nightly. */
export async function refreshReplyTimes(): Promise<{ owners: number }> {
  const payload = await getPayload({ config });
  const enquiries = (
    await payload.find({
      collection: "enquiries",
      pagination: false,
      depth: 0,
      overrideAccess: true,
      select: { owner: true },
    })
  ).docs;
  const owners = new Set(
    enquiries
      .map((e) => (typeof e.owner === "object" && e.owner ? e.owner.id : e.owner))
      .filter((id): id is number => typeof id === "number"),
  );
  for (const id of owners) await refreshReplyTime(id);
  return { owners: owners.size };
}
