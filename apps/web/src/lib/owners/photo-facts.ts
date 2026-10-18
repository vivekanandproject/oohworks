import exifr from "exifr";
import { distanceKm } from "@/lib/sites/filter";

/** A photograph counts as GPS-stamped at a site when it was taken within this distance of the pin. */
export const GPS_MATCH_METRES = 150;

export interface PhotoFacts {
  /** The day it was taken, as the camera recorded it (its local date). */
  takenOn: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * What a photograph's file says about itself: when it was taken and where, if the camera recorded it.
 * Phones record both unless the owner turned location off. A file with neither gives nulls.
 */
export async function readPhotoFacts(data: Uint8Array): Promise<PhotoFacts> {
  const none: PhotoFacts = { takenOn: null, lat: null, lng: null };
  try {
    // Cameras write the local time with no zone. Read as a time, it would shift with the server's own
    // zone (a photograph from 23:50 in Mumbai lands on the next day on a UTC server), so the calendar
    // date is taken exactly as written.
    const raw = (await exifr.parse(data, {
      pick: ["DateTimeOriginal", "CreateDate"],
      reviveValues: false,
    })) as { DateTimeOriginal?: string; CreateDate?: string } | undefined;
    const written = /^(\d{4}):(\d{2}):(\d{2})/.exec(raw?.DateTimeOriginal ?? raw?.CreateDate ?? "");
    const position = (await exifr.gps(data).catch(() => undefined)) as
      { latitude?: number; longitude?: number } | undefined;
    const lat = position?.latitude;
    const lng = position?.longitude;
    return {
      takenOn: written ? `${written[1]}-${written[2]}-${written[3]}` : null,
      lat: typeof lat === "number" && Number.isFinite(lat) ? lat : null,
      lng: typeof lng === "number" && Number.isFinite(lng) ? lng : null,
    };
  } catch {
    return none;
  }
}

/** How far from the site's pin the photograph was taken, in whole metres, or null without a position. */
export function metresFromPin(
  facts: PhotoFacts,
  site: { lat: number; lng: number },
): number | null {
  if (facts.lat === null || facts.lng === null) return null;
  return Math.round(distanceKm({ lat: facts.lat, lng: facts.lng }, site) * 1000);
}
