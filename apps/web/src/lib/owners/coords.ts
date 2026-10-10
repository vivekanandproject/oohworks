export interface LatLng {
  lat: number;
  lng: number;
}

const ok = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180 &&
  !(lat === 0 && lng === 0);
const round = (n: number): number => Number(n.toFixed(5));

/**
 * Reads a position from what an owner pasted: "12.93512, 77.62214", or a Google Maps link in any of
 * its common shapes. Returns null when no position can be found, so the form can say so.
 */
export function readCoords(text: string): LatLng | null {
  const t = text.trim();
  if (!t) return null;
  const patterns = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, // the pin in a place link
    /[?&](?:q|query|ll|destination|center)=(?:loc:)?(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, // the centre of the view
    /^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/, // two plain numbers
  ];
  for (const re of patterns) {
    const m = re.exec(t);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (ok(lat, lng)) return { lat: round(lat), lng: round(lng) };
  }
  return null;
}

const RAD = Math.PI / 180;
export function metresBetween(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

/** The smaller angle between two compass bearings. */
export function bearingGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export interface Placed extends LatLng {
  facingDeg?: number | null | undefined;
}

/**
 * Whether two listings are probably the same physical face: within 25 metres, and facing within 30
 * degrees of each other. Two faces back to back on one structure are different sites, so facing matters.
 * When either facing is unknown, distance alone decides.
 */
export function sameFace(a: Placed, b: Placed): boolean {
  if (metresBetween(a, b) > 25) return false;
  if (a.facingDeg == null || b.facingDeg == null) return true;
  return bearingGap(a.facingDeg, b.facingDeg) <= 30;
}
