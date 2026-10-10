import { isPermanentId } from "@ohworks/core";
import { fileOf, go, ownerGate, text } from "@/lib/owners/request";
import { MAX_PHOTOS, addPhoto, ownerSite } from "@/lib/owners/server";
import { indiaDate } from "@/lib/sites/calendar";

export const dynamic = "force-dynamic";

const KINDS = ["approach", "day", "night"] as const;

/** Adds one photograph to a site, with the view it shows and the date it was taken. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "photo", 60);
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  const id = text(form, "id", 12);
  const site = owner && isPermanentId(id) ? await ownerSite(owner.id, id) : null;
  if (!owner || !site) return go("/owner/");
  const back = (query: string) => go(`/owner/sites/${id}/?${query}#photos`);
  if ((site.photos?.length ?? 0) >= MAX_PHOTOS) return back("perror=many");
  const picked = fileOf(form, "photo", "photo");
  if ("problem" in picked) return back(`perror=${picked.problem}`);
  const kind = KINDS.find((k) => k === text(form, "kind", 10)) ?? "approach";
  const takenOn = text(form, "takenOn", 10);
  const today = indiaDate(Date.now());
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(takenOn) ||
    Number.isNaN(new Date(takenOn).getTime()) ||
    takenOn > today ||
    takenOn < "2000-01-01"
  )
    return back("perror=date");
  try {
    await addPhoto(owner, site, picked.file, kind, takenOn);
  } catch {
    return back("perror=read");
  }
  return back("photo=added");
}
