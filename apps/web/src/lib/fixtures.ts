/**
 * Day-one fixture. Replaced by Postgres queries in M1/M2. Exists only so routing,
 * status codes and JSON-LD can be verified before the data layer lands.
 */
export interface FixtureFace {
  permanentId: string;
  slug: string;
  country: string;
  city: string;
  locality: string;
  name: string;
  format: string;
  widthMm: number;
  heightMm: number;
  illumination: string;
  lat: number;
  lng: number;
  facingDeg: number;
  owner: { name: string; slug: string };
  priceDisplay: "exact" | "from" | "on_request";
  ratePerMonthInr?: number;
  indexable: boolean;
}

export const FIXTURE_FACES: FixtureFace[] = [
  {
    permanentId: "ow8k3x2",
    slug: "hoarding-80-feet-road",
    country: "in",
    city: "bengaluru",
    locality: "koramangala",
    name: "Hoarding, 80 Feet Road, Koramangala",
    format: "hoarding",
    widthMm: 12192,
    heightMm: 6096,
    illumination: "front-lit",
    lat: 12.93512,
    lng: 77.62214,
    facingDeg: 225,
    owner: { name: "Sample Media", slug: "sample-media" },
    priceDisplay: "from",
    ratePerMonthInr: 85000,
    indexable: true,
  },
];

export function findFace(permanentId: string): FixtureFace | undefined {
  return FIXTURE_FACES.find((f) => f.permanentId === permanentId);
}

export const FIXTURE_HUBS = new Set(["in/bengaluru", "in/bengaluru/koramangala"]);
