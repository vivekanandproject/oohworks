import { isPermanentId } from "@ohworks/core";
import { go, ownerGate, text } from "@/lib/owners/request";
import { stateOf } from "@/lib/owners/progress";
import { ownerSite, withdraw } from "@/lib/owners/server";

export const dynamic = "force-dynamic";

/** Takes a live site off ohworks at once, at its owner's word. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "withdraw");
  if (!gate.ok) return gate.response;
  const id = text(gate.form, "id", 12);
  const site = gate.owner && isPermanentId(id) ? await ownerSite(gate.owner.id, id) : null;
  if (!site) return go("/owner/");
  if (stateOf(site) === "live") await withdraw(site);
  return go(`/owner/sites/${id}/?withdrawn=1`);
}
