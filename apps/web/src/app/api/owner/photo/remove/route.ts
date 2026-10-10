import { isPermanentId } from "@ohworks/core";
import { go, ownerGate, text } from "@/lib/owners/request";
import { ownerSite, removePhoto } from "@/lib/owners/server";

export const dynamic = "force-dynamic";

/** Takes one photograph off a site. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "photo-remove");
  if (!gate.ok) return gate.response;
  const id = text(gate.form, "id", 12);
  const site = gate.owner && isPermanentId(id) ? await ownerSite(gate.owner.id, id) : null;
  if (!site) return go("/owner/");
  const media = Number(text(gate.form, "media", 12));
  if (Number.isInteger(media) && media > 0) await removePhoto(site, media);
  return go(`/owner/sites/${id}/?photo=removed#photos`);
}
