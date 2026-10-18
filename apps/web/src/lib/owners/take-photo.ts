import { indiaDate } from "@/lib/sites/calendar";
import type { Owner, Site } from "@/payload-types";
import { photoFingerprint, stockLibrary } from "./photo-checks";
import { GPS_MATCH_METRES, metresFromPin, readPhotoFacts, type PhotoFacts } from "./photo-facts";
import { MAX_PHOTOS, addPhoto, samePhotoElsewhere } from "./server";

export type PhotoView = "approach" | "day" | "night";

export type PhotoOutcome =
  | { added: true; fromFile: boolean; gps: boolean; away: number | null; twin: boolean }
  | { added: false; problem: "many" | "stock" | "date" | "read"; library?: string };

/**
 * Adds one photograph to one of an owner's sites, after every check a photograph gets, wherever it was
 * sent from (a site's own page, or many at once). The date comes from the file when the camera recorded
 * a plausible one, and the owner's typed date otherwise. A photograph whose recorded position is within
 * reach of the pin counts as GPS-stamped. One whose file credits a stock library is refused; one that is
 * already on another listing is added, and flagged for the team.
 */
export async function takePhoto(
  owner: Owner,
  site: Site,
  file: File,
  view: PhotoView,
  typedDate: string,
  read?: { bytes: Uint8Array; facts: PhotoFacts },
): Promise<PhotoOutcome> {
  if ((site.photos?.length ?? 0) >= MAX_PHOTOS) return { added: false, problem: "many" };
  const today = indiaDate(Date.now());
  const plausible = (d: string | null): d is string =>
    d !== null &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(new Date(d).getTime()) &&
    d <= today &&
    d >= "2000-01-01";
  const bytes = read?.bytes ?? new Uint8Array(await file.arrayBuffer());
  const library = await stockLibrary(bytes);
  if (library) return { added: false, problem: "stock", library };
  const facts = read?.facts ?? (await readPhotoFacts(bytes));
  // A camera with its clock wrong gives a future or ancient date: then the owner's word is used.
  const fromFile = plausible(facts.takenOn);
  const takenOn = fromFile ? facts.takenOn : typedDate;
  if (!plausible(takenOn)) return { added: false, problem: "date" };
  const away = metresFromPin(facts, site);
  const gps = away !== null && away <= GPS_MATCH_METRES;
  try {
    const fingerprint = await photoFingerprint(bytes);
    const twin = fingerprint ? await samePhotoElsewhere(fingerprint, site) : null;
    await addPhoto(owner, site, file, view, takenOn, gps, { fingerprint, twin });
    return { added: true, fromFile, gps, away, twin: Boolean(twin) };
  } catch {
    return { added: false, problem: "read" };
  }
}
