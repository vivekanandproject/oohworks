import { isPermanentId } from "@ohworks/core";
import { go, ownerGate, text } from "@/lib/owners/request";
import { ownerSite } from "@/lib/owners/server";
import { withdrawChange } from "@/lib/owners/site-changes";

export const dynamic = "force-dynamic";

/** The owner takes back changes to a live site that the team has not yet approved. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "change-withdraw");
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  const id = text(form, "id", 12);
  const site = owner && isPermanentId(id) ? await ownerSite(owner.id, id) : null;
  if (!owner || !site) return go("/owner/");
  await withdrawChange(site);
  return go(`/owner/sites/${id}/?changes=withdrawn#changes`);
}
