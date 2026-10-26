import type { Media } from "@/payload-types";

export type MediaSize = "thumb" | "card" | "hero";

export interface Picture {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
  /** Every stored width of the same frame, for the browser to choose from with `sizes`. */
  srcSet?: string;
}

/** Smaller stored versions of a size, in the same frame. */
const SMALLER: Partial<Record<MediaSize, readonly "heroMd"[]>> = { hero: ["heroMd"] };

/** The best stored size of an image, with the dimensions that prevent layout shift. */
export function picture(media: Media | null | undefined, size: MediaSize): Picture | null {
  if (!media) return null;
  const s = media.sizes?.[size];
  const src = s?.url ?? media.url;
  if (!src) return null;
  const width = (s?.url ? s.width : media.width) ?? 1600;
  const set = (SMALLER[size] ?? [])
    .map((k) => media.sizes?.[k])
    .filter((v) => v?.url && v.width && v.width < width)
    .map((v) => `${v!.url} ${v!.width}w`);
  return {
    src,
    width,
    height: (s?.url ? s.height : media.height) ?? 900,
    alt: media.alt,
    credit: media.credit,
    ...(set.length && s?.url ? { srcSet: [...set, `${src} ${width}w`].join(", ") } : {}),
  };
}
