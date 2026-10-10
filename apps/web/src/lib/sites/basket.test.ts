import { describe, expect, it } from "vitest";
import { inBox, matches, widen, type Listing } from "./filter";
import { LISTS, addIds, isListName, parseIds, toggleId, writeIds } from "./lists";
import { budgetLine, distanceText, freeFor, planText, spanKm, summarise } from "./plan";
import { readBox, readState, toUrl } from "./state";

const NOW = new Date("2026-10-10T06:00:00Z").getTime();
const DAY = 24 * 3600 * 1000;

function listing(over: Partial<Listing>): Listing {
  return {
    id: 1,
    permanentId: "ows0001",
    title: "20 × 10 ft hoarding, 80 Feet Road",
    url: "/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/",
    format: "hoarding",
    isDigital: false,
    lighting: "front-lit",
    city: "bengaluru",
    locality: "Koramangala",
    localitySlug: "koramangala",
    road: "80 Feet Road",
    landmark: "",
    lat: 12.93512,
    lng: 77.62214,
    widthMm: 6096,
    heightMm: 3048,
    priceShown: true,
    priceFrom: false,
    rate: 85000,
    bookedUntil: null,
    confirmedOn: NOW - 2 * DAY,
    freshOn: NOW - 2 * DAY,
    audience: null,
    permitValid: true,
    verifiedLocation: true,
    ownerId: 1,
    ownerSlug: "kaveri",
    ownerName: "Kaveri Outdoor",
    ownerVerified: true,
    ownerReplyHours: 6,
    quality: 70,
    createdAt: NOW - 20 * DAY,
    sample: false,
    ...over,
  };
}

describe("shortlist and compare lists", () => {
  it("keeps only real-looking unit ids, each once, up to the limit", () => {
    expect(parseIds("ows0001.ows0002,OWS0003 ows0001 nonsense ow12", 50)).toEqual([
      "ows0001",
      "ows0002",
      "ows0003",
    ]);
    expect(parseIds(undefined, 50)).toEqual([]);
    expect(parseIds("ows0001,ows0002,ows0003,ows0004,ows0005", LISTS.compare.max)).toHaveLength(4);
    expect(writeIds(["ows0001", "ows0002"])).toBe("ows0001.ows0002");
    expect(parseIds(writeIds(["ows0001", "ows0002"]), 50)).toEqual(["ows0001", "ows0002"]);
  });
  it("adds, removes and refuses to overfill", () => {
    expect(toggleId([], "ows0001", 4)).toEqual({ ids: ["ows0001"], on: true, full: false });
    expect(toggleId(["ows0001", "ows0002"], "ows0001", 4)).toEqual({
      ids: ["ows0002"],
      on: false,
      full: false,
    });
    const four = ["ows0001", "ows0002", "ows0003", "ows0004"];
    expect(toggleId(four, "ows0005", 4)).toEqual({ ids: four, on: false, full: true });
    expect(toggleId(four, "ows0004", 4).ids).toHaveLength(3);
    expect(addIds(["ows0001"], ["ows0001", "ows0002", "ows0003"], 2)).toEqual([
      "ows0001",
      "ows0002",
    ]);
    expect(isListName("saved") && isListName("compare")).toBe(true);
    expect(isListName("admin")).toBe(false);
  });
});

describe("what a shortlist adds up to", () => {
  const items = [
    listing({}),
    listing({ id: 2, permanentId: "ows0002", rate: 140000, priceFrom: true }),
    listing({ id: 3, permanentId: "ows0003", priceShown: false, rate: null }),
    listing({
      id: 4,
      permanentId: "ows0017",
      ownerId: 2,
      ownerName: "Marine Line Media",
      rate: 60000,
    }),
  ];
  it("counts only prices owners show, and says when the sum is a floor", () => {
    const s = summarise(items);
    expect(s).toEqual({ sites: 4, owners: 2, shown: 285000, priced: 3, onRequest: 1, floor: true });
    expect(planText(s)).toBe(
      "4 sites saved · 2 owners · from ₹ 2,85,000 a month shown · 1 on request",
    );
    expect(planText(summarise([listing({})]))).toBe(
      "1 site saved · 1 owner · ₹ 85,000 a month shown",
    );
    expect(planText(summarise([]))).toBe("Nothing saved yet");
  });
  it("sets the shown prices against a budget without guessing the rest", () => {
    const s = summarise(items);
    expect(budgetLine(s, 300000)).toMatchObject({ state: "under" });
    expect(budgetLine(s, 300000)?.text).toContain("₹ 15,000 a month under your budget.");
    expect(budgetLine(s, 300000)?.text).toContain("Not counting 1 site with price on request.");
    expect(budgetLine(s, 300000)?.text).toContain("“From” prices may come in higher.");
    expect(budgetLine(s, 200000)).toMatchObject({ state: "over" });
    expect(budgetLine(s, 285000)).toMatchObject({ state: "exact" });
    expect(budgetLine(s, undefined)).toBeNull();
    expect(budgetLine(summarise([items[2] as Listing]), 100000)).toBeNull();
  });
  it("checks a site against the start date, and measures between sites", () => {
    const booked = listing({ bookedUntil: new Date("2026-11-14").getTime() });
    expect(freeFor(booked, "2026-11-01")).toBe("booked");
    expect(freeFor(booked, "2026-11-15")).toBe("free");
    expect(freeFor(booked, undefined)).toBe("unknown");
    expect(freeFor(listing({}), "2026-11-01")).toBe("free");
    expect(distanceText(0.63)).toBe("650 m");
    expect(distanceText(3.44)).toBe("3.4 km");
    expect(distanceText(851.8)).toBe("852 km");
    expect(spanKm([{ lat: 12.93512, lng: 77.62214 }])).toBe(0);
    const span = spanKm([
      { lat: 12.93512, lng: 77.62214 },
      { lat: 12.93461, lng: 77.61132 },
      { lat: 13.03581, lng: 77.59702 },
    ]);
    expect(span).toBeGreaterThan(11);
    expect(span).toBeLessThan(12);
  });
});

describe("searching a map area", () => {
  it("reads a valid area and refuses a broken one", () => {
    expect(readBox("77.55,12.9,77.66,12.99")).toEqual([77.55, 12.9, 77.66, 12.99]);
    expect(readBox("77.123456,12.9,77.66,12.99")?.[0]).toBe(77.1235);
    expect(readBox("77.66,12.9,77.55,12.99")).toBeUndefined();
    expect(readBox("77.55,12.9,77.66")).toBeUndefined();
    expect(readBox("a,b,c,d")).toBeUndefined();
    expect(readBox("77.55,-95,77.66,12.99")).toBeUndefined();
    expect(readBox("")).toBeUndefined();
  });
  it("writes the area into the address in its place, and reads it back unchanged", () => {
    const { state } = readState({
      format: "hoarding",
      bbox: "77.55,12.9,77.66,12.99",
      sort: "price",
    });
    const url = toUrl(state);
    expect(url).toBe("/search/?bbox=77.5500,12.9000,77.6600,12.9900&format=hoarding&sort=price");
    expect(
      toUrl(readState(Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? ""))).state),
    ).toBe(url);
  });
  it("keeps only the sites inside it, and offers to look outside", () => {
    const box: [number, number, number, number] = [77.55, 12.9, 77.66, 12.99];
    expect(inBox({ lat: 12.93512, lng: 77.62214 }, box)).toBe(true);
    expect(inBox({ lat: 13.03581, lng: 77.59702 }, box)).toBe(false);
    const all = [
      listing({}),
      listing({ id: 2, permanentId: "ows0014", lat: 13.03581, lng: 77.59702 }),
    ];
    const { state } = readState({ bbox: box.join(",") });
    expect(all.filter((l) => matches(l, state, NOW)).map((l) => l.id)).toEqual([1]);
    expect(widen(all, state, NOW, 1).map((w) => w.label)).toContain("Outside this map area");
  });
});
