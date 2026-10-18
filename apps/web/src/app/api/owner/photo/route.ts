import { isPermanentId } from "@ohworks/core";
import { fileOf, go, ownerGate, text } from "@/lib/owners/request";
import { ownerSite } from "@/lib/owners/server";
import { takePhoto } from "@/lib/owners/take-photo";

export const dynamic = "force-dynamic";

const KINDS = ["approach", "day", "night"] as const;

/**
 * Adds one photograph to a site, with the view it shows and the date it was taken, after the checks
 * every photograph gets (src/lib/owners/take-photo.ts).
 */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "photo", 60);
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  const id = text(form, "id", 12);
  const site = owner && isPermanentId(id) ? await ownerSite(owner.id, id) : null;
  if (!owner || !site) return go("/owner/");
  const back = (query: string) => go(`/owner/sites/${id}/?${query}#photos`);
  const picked = fileOf(form, "photo", "photo");
  if ("problem" in picked) return back(`perror=${picked.problem}`);
  const kind = KINDS.find((k) => k === text(form, "kind", 10)) ?? "approach";
  const done = await takePhoto(owner, site, picked.file, kind, text(form, "takenOn", 10));
  if (!done.added)
    return back(
      done.problem === "stock" && done.library
        ? `perror=stock&lib=${encodeURIComponent(done.library)}`
        : `perror=${done.problem}`,
    );
  const said = [
    "photo=added",
    ...(done.fromFile ? ["from=file"] : []),
    ...(done.gps ? ["gps=1"] : done.away !== null ? [`away=${done.away}`] : []),
    ...(done.twin ? ["twin=1"] : []),
  ];
  return back(said.join("&"));
}
