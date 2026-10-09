export interface UnitPathParts {
  country: string; // "in"
  city: string; // "bengaluru"
  locality: string; // "koramangala"
  slug: string; // "hoarding-80-feet-road"
  permanentId: string; // "ow8k3x2"
}

/** Canonical unit URL: /in/bengaluru/koramangala/hoarding-80-feet-road-ow8k3x2/ */
export function unitPath(p: UnitPathParts): string {
  return `/${p.country}/${p.city}/${p.locality}/${p.slug}-${p.permanentId}/`;
}
