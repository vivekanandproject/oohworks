import { isPermanentId } from "@ohworks/core";
import { fileOf, go, ownerGate, text } from "@/lib/owners/request";
import { photoFingerprint, stockLibrary } from "@/lib/owners/photo-checks";
import { GPS_MATCH_METRES, metresFromPin, readPhotoFacts } from "@/lib/owners/photo-facts";
import { MAX_PHOTOS, addPhoto, ownerSite, samePhotoElsewhere } from "@/lib/owners/server";
import { indiaDate } from "@/lib/sites/calendar";

export const dynamic = "force-dynamic";

const KINDS = ["approach", "day", "night"] as const;

/**
 * Adds one photograph to a site, with the view it shows and the date it was taken. The date comes from
 * the file when the camera recorded one, and the owner's typed date otherwise. A photograph whose
 * recorded position is within reach of the pin counts as GPS-stamped. A photograph whose file credits
 * a stock library is refused; one that is already on another listing is added, and flagged for the team.
 */
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
  const today = indiaDate(Date.now());
  const plausible = (d: string | null): d is string =>
    d !== null &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(new Date(d).getTime()) &&
    d <= today &&
    d >= "2000-01-01";
  const bytes = new Uint8Array(await picked.file.arrayBuffer());
  const library = await stockLibrary(bytes);
  if (library) return back(`perror=stock&lib=${encodeURIComponent(library)}`);
  const facts = await readPhotoFacts(bytes);
  // A camera with its clock wrong gives a future or ancient date: then the owner's word is used.
  const fromFile = plausible(facts.takenOn);
  const takenOn = fromFile ? facts.takenOn : text(form, "takenOn", 10);
  if (!plausible(takenOn)) return back("perror=date");
  const away = metresFromPin(facts, site);
  const gps = away !== null && away <= GPS_MATCH_METRES;
  let twin: string | null = null;
  try {
    const fingerprint = await photoFingerprint(bytes);
    twin = fingerprint ? await samePhotoElsewhere(fingerprint, site) : null;
    await addPhoto(owner, site, picked.file, kind, takenOn, gps, { fingerprint, twin });
  } catch {
    return back("perror=read");
  }
  const said = [
    "photo=added",
    ...(fromFile ? ["from=file"] : []),
    ...(gps ? ["gps=1"] : away !== null ? [`away=${away}`] : []),
    ...(twin ? ["twin=1"] : []),
  ];
  return back(said.join("&"));
}
