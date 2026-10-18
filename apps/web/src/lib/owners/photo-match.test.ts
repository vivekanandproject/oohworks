import { describe, expect, it } from "vitest";
import { CLEAR_METRES, placePhoto, viewOf } from "./photo-match";

const at = (lat: number | null, lng: number | null, hour: number | null = 11) => ({
  takenOn: "2026-10-12",
  hour,
  lat,
  lng,
});
// Two of one owner's sites in Koramangala, about 450 m apart, and a third at the first one's junction.
const A = { id: "a", lat: 12.93512, lng: 77.62214 };
const B = { id: "b", lat: 12.93912, lng: 77.62314 };
const JUNCTION = { id: "j", lat: 12.93522, lng: 77.62224 };

describe("placing a photograph on one of the owner's sites", () => {
  it("places it on the site it was taken at", () => {
    const placed = placePhoto(at(12.9353, 77.6223), [A, B]);
    expect(placed).toMatchObject({ site: A });
    expect("metres" in placed && placed.metres).toBeLessThan(40);
    expect(placePhoto(at(12.939, 77.623), [A, B])).toMatchObject({ site: B });
  });

  it("leaves it unplaced without a position, far from every pin, or between two sites", () => {
    expect(placePhoto(at(null, null), [A, B])).toEqual({ reason: "no-position", metres: null });
    const far = placePhoto(at(12.9756, 77.6066), [A, B]);
    expect(far).toMatchObject({ reason: "far" });
    expect(far.metres).toBeGreaterThan(4000);
    expect(placePhoto(at(12.93517, 77.62219), [A, JUNCTION, B])).toMatchObject({
      reason: "between",
    });
    expect(placePhoto(at(12.9353, 77.6223), [])).toEqual({ reason: "far", metres: null });
    expect(CLEAR_METRES).toBeGreaterThan(0);
  });

  it("calls a photograph taken after dark the night view, and the first by day the approach", () => {
    expect(viewOf(at(1, 1, 21), false)).toBe("night");
    expect(viewOf(at(1, 1, 3), true)).toBe("night");
    expect(viewOf(at(1, 1, 10), false)).toBe("approach");
    expect(viewOf(at(1, 1, 10), true)).toBe("day");
    expect(viewOf(at(1, 1, null), true)).toBe("day");
  });
});
