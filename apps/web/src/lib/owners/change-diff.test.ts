import { describe, expect, it } from "vitest";
import { differences, summaryOf } from "./change-diff";
import type { Raw } from "./site-input";

const live: Raw = {
  format: "hoarding",
  width: "20",
  height: "10",
  unit: "ft",
  road: "80 Feet Road",
  landmark: "",
  lat: "12.93512",
  lng: "77.62214",
  priceDisplay: "exact",
  rate: "85000",
  bookedUntil: "",
};

describe("what an owner changed on a live site", () => {
  it("names each changed field, from what to what", () => {
    const diffs = differences(live, { ...live, road: "100 Feet Road", landmark: "Sony signal" });
    expect(diffs.map((d) => d.key)).toEqual(["road", "landmark"]);
    expect(summaryOf(diffs)).toBe(
      "Road: 80 Feet Road → 100 Feet Road\nLandmark: nothing → Sony signal",
    );
  });

  it("leaves out price and availability, which the owner changes at once elsewhere", () => {
    expect(differences(live, { ...live, rate: "90000", bookedUntil: "2026-12-01" })).toEqual([]);
  });

  it("does not count spaces around a value as a change", () => {
    expect(differences(live, { ...live, road: " 80 Feet Road " })).toEqual([]);
  });
});
