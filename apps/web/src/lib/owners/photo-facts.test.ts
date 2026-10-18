import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { GPS_MATCH_METRES, metresFromPin, readPhotoFacts } from "./photo-facts";

/** A small JPEG carrying what a phone records: when it was taken, and where. */
async function photo(exif: Record<string, Record<string, string>> = {}): Promise<Uint8Array> {
  const image = sharp({
    create: { width: 8, height: 8, channels: 3, background: "#888888" },
  }).jpeg();
  return new Uint8Array(await (Object.keys(exif).length ? image.withExif(exif) : image).toBuffer());
}

// 80 Feet Road, Koramangala: the sample site ows0001's pin.
const PIN = { lat: 12.93512, lng: 77.62214 };

describe("what a photograph says about itself", () => {
  it("reads the day it was taken, in India, and where", async () => {
    const facts = await readPhotoFacts(
      await photo({
        IFD2: { DateTimeOriginal: "2026:10:01 23:50:00" },
        IFD3: {
          GPSVersionID: "2 3 0 0",
          GPSLatitudeRef: "N",
          GPSLatitude: "12/1 56/1 618/100",
          GPSLongitudeRef: "E",
          GPSLongitude: "77/1 37/1 1959/100",
        },
      }),
    );
    expect(facts.takenOn).toBe("2026-10-01");
    expect(facts.hour).toBe(23);
    expect(facts.lat).toBeCloseTo(12.93505, 5);
    expect(facts.lng).toBeCloseTo(77.62211, 5);
    const away = metresFromPin(facts, PIN);
    expect(away).toBeLessThan(GPS_MATCH_METRES);
  });

  it("measures a photograph taken across town", async () => {
    // MG Road, about 4 km north.
    const away = metresFromPin({ takenOn: null, hour: null, lat: 12.9756, lng: 77.6066 }, PIN);
    expect(away).toBeGreaterThan(4000);
    expect(away).toBeLessThan(5000);
  });

  it("gives nothing for a file with no record, or one that is not a photograph", async () => {
    const nothing = { takenOn: null, hour: null, lat: null, lng: null };
    expect(await readPhotoFacts(await photo())).toEqual(nothing);
    expect(await readPhotoFacts(new TextEncoder().encode("not a photograph"))).toEqual(nothing);
    expect(metresFromPin({ ...nothing, takenOn: "2026-10-01" }, PIN)).toBeNull();
  });
});
