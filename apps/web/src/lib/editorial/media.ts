import type { Media } from "@/payload-types";

export type MediaSize = "thumb" | "card" | "hero";

export interface Picture {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
}

/** The best stored size of an image, with the dimensions that prevent layout shift. */
export function picture(media: Media | null | undefined, size: MediaSize): Picture | null {
  if (!media) return null;
  const s = media.sizes?.[size];
  const src = s?.url ?? media.url;
  if (!src) return null;
  return {
    src,
    width: (s?.url ? s.width : media.width) ?? 1600,
    height: (s?.url ? s.height : media.height) ?? 900,
    alt: media.alt,
    credit: media.credit,
  };
}
