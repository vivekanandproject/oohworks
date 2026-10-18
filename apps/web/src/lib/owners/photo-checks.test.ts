import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SAME_PHOTO_BITS,
  fingerprintDistance,
  photoFingerprint,
  stockLibrary,
} from "./photo-checks";

/** A picture with shapes in it, made fresh each time: blurred noise stands in for a photograph. */
const picture = async (): Promise<Buffer> =>
  sharp(
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
        noise: { type: "gaussian", mean: 128, sigma: 60 },
      },
    })
      .png()
      .toBuffer(),
  )
    .blur(12)
    .resize(1200, 900)
    .jpeg({ quality: 88 })
    .toBuffer();

describe("the same photograph on two listings", () => {
  it("is recognised after resizing and recompressing, brightening, or trimming a little", async () => {
    const original = await picture();
    const print = (await photoFingerprint(original))!;
    expect(print).toMatch(/^[0-9a-f]{64}$/);
    for (const copy of [
      // As WhatsApp sends it on.
      await sharp(original).resize(800).jpeg({ quality: 50 }).toBuffer(),
      await sharp(original).modulate({ brightness: 1.15 }).jpeg().toBuffer(),
      await sharp(original)
        .extract({ left: 12, top: 9, width: 1176, height: 882 })
        .webp()
        .toBuffer(),
    ])
      expect(fingerprintDistance(print, (await photoFingerprint(copy))!)).toBeLessThanOrEqual(
        SAME_PHOTO_BITS,
      );
  });

  it("is not confused with a different photograph", async () => {
    for (let i = 0; i < 5; i += 1) {
      const a = (await photoFingerprint(await picture()))!;
      const b = (await photoFingerprint(await picture()))!;
      expect(fingerprintDistance(a, b)).toBeGreaterThan(SAME_PHOTO_BITS + 20);
    }
  });

  it("leaves out a picture too plain to tell apart, and a file that is not a picture", async () => {
    const plain = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 110, g: 130, b: 150 } },
    })
      .jpeg()
      .toBuffer();
    expect(await photoFingerprint(plain)).toBeNull();
    expect(await photoFingerprint(new TextEncoder().encode("not a photo"))).toBeNull();
  });
});

describe("a stock photograph", () => {
  it("is named by the library its file credits", async () => {
    const credited = await sharp(await picture())
      .withExif({ IFD0: { Copyright: "Image: Shutterstock / A. Person", Artist: "A. Person" } })
      .jpeg()
      .toBuffer();
    expect(await stockLibrary(credited)).toBe("Shutterstock");
  });

  it("is not suspected from an owner's own camera", async () => {
    const own = await sharp(await picture())
      .withExif({ IFD0: { Copyright: "Kaveri Outdoor", Make: "Google", Model: "Pixel 7" } })
      .jpeg()
      .toBuffer();
    expect(await stockLibrary(own)).toBeNull();
    expect(await stockLibrary(await picture())).toBeNull();
  });
});
