import { isPermanentId } from "@ohworks/core";
import { go, ownerGate, text } from "@/lib/owners/request";
import { stateOf } from "@/lib/owners/progress";
import { ownerSite, removeDraft } from "@/lib/owners/server";

export const dynamic = "force-dynamic";

/** Removes a site that has never been live. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "remove");
  if (!gate.ok) return gate.response;
  const id = text(gate.form, "id", 12);
  const site = gate.owner && isPermanentId(id) ? await ownerSite(gate.owner.id, id) : null;
  if (!site) return go("/owner/");
  if (stateOf(site) === "live") return go(`/owner/sites/${id}/`);
  await removeDraft(site);
  return go("/owner/?removed=1");
}
