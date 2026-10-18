import exifr from "exifr";
import sharp from "sharp";

/**
 * Two checks on a photograph an owner adds, for what a buyer cannot see: whether it is a stock image,
 * by what its own file says, and whether the same picture is already on another listing, by a
 * fingerprint of its shapes that survives resizing, recompressing and a little cropping.
 */

/** Stock libraries, as they name themselves in a photograph's copyright, credit or source. */
const LIBRARIES: [RegExp, string][] = [
  [/shutterstock/i, "Shutterstock"],
  [/getty\s*images|gettyimages/i, "Getty Images"],
  [/istock/i, "iStock"],
  [/adobe\s*stock|stock\.adobe/i, "Adobe Stock"],
  [/alamy/i, "Alamy"],
  [/dreamstime/i, "Dreamstime"],
  [/123rf/i, "123RF"],
  [/depositphotos/i, "Depositphotos"],
  [/bigstock/i, "Bigstock"],
  [/unsplash/i, "Unsplash"],
  [/pexels/i, "Pexels"],
  [/pixabay/i, "Pixabay"],
  [/freepik/i, "Freepik"],
  [/envato/i, "Envato"],
];

/** The metadata fields where a library writes its name. */
const CREDIT_FIELD =
  /copyright|credit|source|rights|artist|creator|by-?line|webstatement|usageterms|licen[cs]e/i;

const textsIn = (value: unknown, key: string, out: string[]): void => {
  if (typeof value === "string") {
    if (CREDIT_FIELD.test(key)) out.push(value);
  } else if (Array.isArray(value)) value.forEach((v) => textsIn(v, key, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) textsIn(v, CREDIT_FIELD.test(key) ? key : k, out);
};

/** The stock library a photograph's file names as its source, or null. */
export async function stockLibrary(data: Uint8Array): Promise<string | null> {
  try {
    const meta = (await exifr.parse(data, { xmp: true, iptc: true, mergeOutput: true })) as unknown;
    const texts: string[] = [];
    textsIn(meta, "", texts);
    for (const text of texts) for (const [re, name] of LIBRARIES) if (re.test(text)) return name;
    return null;
  } catch {
    return null;
  }
}

const SIDE = 16;
/**
 * Two fingerprints this close (a quarter of the 256 bits) are taken as the same photograph. Measured on
 * textured test images: a copy sent through WhatsApp, brightened or trimmed by 1% differs by under 50
 * bits; different pictures by over 90.
 */
export const SAME_PHOTO_BITS = 64;

/**
 * A fingerprint of a photograph's shapes (a difference hash): it is shrunk to 17 × 16 in grey, and
 * each bit says whether a point is brighter than the one to its right. Null for a picture too plain to
 * tell apart from others, such as an empty sky or a blank test image.
 */
export async function photoFingerprint(data: Uint8Array): Promise<string | null> {
  try {
    const px = await sharp(data)
      .rotate()
      .greyscale()
      .resize(SIDE + 1, SIDE, { fit: "fill" })
      .raw()
      .toBuffer();
    let bits = 0n;
    let set = 0;
    for (let y = 0; y < SIDE; y += 1)
      for (let x = 0; x < SIDE; x += 1) {
        const on = px[y * (SIDE + 1) + x]! > px[y * (SIDE + 1) + x + 1]!;
        bits = (bits << 1n) | (on ? 1n : 0n);
        if (on) set += 1;
      }
    if (set < 24 || set > SIDE * SIDE - 24) return null;
    return bits.toString(16).padStart((SIDE * SIDE) / 4, "0");
  } catch {
    return null;
  }
}

/** How many of the 256 bits differ. */
export function fingerprintDistance(a: string, b: string): number {
  let v = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (v) {
    n += Number(v & 1n);
    v >>= 1n;
  }
  return n;
}
