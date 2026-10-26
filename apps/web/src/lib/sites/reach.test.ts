import { beforeAll, describe, expect, it } from "vitest";
import type { Owner, Site } from "@/payload-types";
import {
  MIN_REPLIES,
  checkThreadKey,
  isAnyReference,
  isPlanReference,
  isReference,
  medianReplyHours,
  newPlanReference,
  threadKey,
} from "./enquiry";
import { echo, fieldError, readFields } from "./enquiry-form";
import { exportTable, plainCell, toCsv } from "./export";
import type { Listing } from "./filter";
import { HUB_MIN, hubFact, hubPath, hubStatus, hubTitle, inHub, readHub, type Hub } from "./hubs";

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
    cityLabel: "Bengaluru",
    country: "in",
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
    currency: "INR",
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
    indexable: true,
    ...over,
  };
}
const many = (n: number, over: Partial<Listing> = {}): Listing[] =>
  Array.from({ length: n }, (_, i) =>
    listing({ id: i + 1, permanentId: `ows${String(i + 1).padStart(4, "0")}`, ...over }),
  );

describe("hubs", () => {
  it("reads a hub from its address, and refuses what it does not serve", () => {
    expect(readHub("in", "bengaluru")).toEqual({ kind: "city", country: "in", city: "bengaluru" });
    expect(readHub("in", "bengaluru", "koramangala")).toEqual({
      kind: "locality",
      country: "in",
      city: "bengaluru",
      locality: "koramangala",
    });
    expect(readHub("in", "bengaluru", "hoardings")).toEqual({
      kind: "format",
      country: "in",
      city: "bengaluru",
      format: "hoarding",
    });
    expect(readHub("in", "bengaluru", "led-screens")).toEqual({
      kind: "format",
      country: "in",
      city: "bengaluru",
      format: "led-screen",
    });
    expect(readHub("in", "bengaluru", "bus-shelters")).toEqual({
      kind: "format",
      country: "in",
      city: "bengaluru",
      format: "bus-shelter",
    });
    // Any country and city can be named; whether the page opens is up to its listings (hubStatus).
    expect(readHub("ae", "dubai")).toEqual({ kind: "city", country: "ae", city: "dubai" });
    expect(hubStatus([], { kind: "city", country: "in", city: "atlantis" }).published).toBe(false);
    expect(readHub("zz", "bengaluru")).toBeNull();
    expect(readHub("india", "bengaluru")).toBeNull();
    expect(readHub("in", "bengaluru", "Not A Slug")).toBeNull();
  });
  it("gives each hub one address, with later pages under it", () => {
    expect(hubPath({ kind: "city", country: "in", city: "mumbai" })).toBe("/in/mumbai/");
    expect(
      hubPath({ kind: "locality", country: "in", city: "mumbai", locality: "bandra-west" }, 3),
    ).toBe("/in/mumbai/bandra-west/page/3/");
    expect(hubPath({ kind: "format", country: "in", city: "pune", format: "led-screen" })).toBe(
      "/in/pune/led-screens/",
    );
    const hub = readHub("in", "pune", "led-screens") as Hub;
    expect(readHub("in", "pune", hubPath(hub).split("/")[3])).toEqual(hub);
  });
  it("publishes a hub only at its threshold of indexable sites", () => {
    const city: Hub = { kind: "city", country: "in", city: "bengaluru" };
    expect(hubStatus(many(HUB_MIN.city - 1), city)).toEqual({
      indexable: 24,
      needed: 25,
      published: false,
    });
    expect(hubStatus(many(HUB_MIN.city), city).published).toBe(true);
    // Samples and thin listings are never indexable, so they never open a hub however many there are.
    expect(hubStatus(many(60, { indexable: false, sample: true }), city)).toEqual({
      indexable: 0,
      needed: 25,
      published: false,
    });
    const area: Hub = {
      kind: "locality",
      country: "in",
      city: "bengaluru",
      locality: "koramangala",
    };
    expect(hubStatus(many(10), area).published).toBe(true);
    expect(hubStatus(many(10, { localitySlug: "hebbal" }), area).published).toBe(false);
    expect(hubStatus(many(30, { city: "mumbai" }), city).published).toBe(false);
    expect(
      inHub(listing({ format: "unipole" }), {
        kind: "format",
        country: "in",
        city: "bengaluru",
        format: "hoarding",
      }),
    ).toBe(false);
  });
  it("names the page and opens it with a dated fact from the listings", () => {
    expect(hubTitle({ kind: "city", country: "in", city: "bengaluru" })).toBe(
      "Outdoor advertising sites in Bengaluru",
    );
    expect(
      hubTitle({ kind: "format", country: "in", city: "bengaluru", format: "led-screen" }),
    ).toBe("LED screens in Bengaluru");
    expect(
      hubTitle(
        { kind: "locality", country: "in", city: "bengaluru", locality: "hsr-layout" },
        "HSR Layout",
      ),
    ).toBe("Outdoor advertising sites in HSR Layout, Bengaluru");
    const items = [...many(3), listing({ id: 9, format: "unipole", ownerId: 2 })];
    expect(
      hubFact({ kind: "city", country: "in", city: "bengaluru" }, items, null, "Oct 2026"),
    ).toBe(
      "Bengaluru has 4 listed sites from 2 owners. Hoardings are the most common, with 3. (OOHWORKS, Oct 2026)",
    );
    expect(
      hubFact(
        { kind: "format", country: "in", city: "bengaluru", format: "hoarding" },
        many(1),
        null,
        "Oct 2026",
      ),
    ).toBe("Bengaluru has 1 listed hoarding from 1 owner. (OOHWORKS, Oct 2026)");
    expect(
      hubFact(
        { kind: "locality", country: "in", city: "bengaluru", locality: "koramangala" },
        many(6),
        { rate: 70000, n: 6, currency: "INR" },
        "Oct 2026",
        "Koramangala",
      ),
    ).toBe(
      "Koramangala, Bengaluru, has 6 listed sites from 1 owner. The median rate of the 6 that show a price is ₹ 70,000 a month. (OOHWORKS, Oct 2026)",
    );
  });
});

describe("links that open a conversation", () => {
  beforeAll(() => {
    process.env.PAYLOAD_SECRET = "unit-test-secret";
  });
  it("tells a plan's reference from a single enquiry's", () => {
    const plan = newPlanReference();
    expect(isPlanReference(plan)).toBe(true);
    expect(isReference(plan)).toBe(false);
    expect(isAnyReference(plan) && isAnyReference("ENQ-AAAAAAAA")).toBe(true);
    expect(isAnyReference("XYZ-AAAAAAAA")).toBe(false);
  });
  it("gives each side its own key, good for that enquiry only", () => {
    const owner = threadKey("ENQ-AAAAAAAA", "owner");
    const buyer = threadKey("ENQ-AAAAAAAA", "buyer");
    expect(owner).toMatch(/^[0-9a-f]{32}$/);
    expect(owner).not.toBe(buyer);
    expect(checkThreadKey("ENQ-AAAAAAAA", "owner", owner)).toBe(true);
    expect(checkThreadKey("ENQ-AAAAAAAA", "buyer", owner)).toBe(false);
    expect(checkThreadKey("ENQ-BBBBBBBB", "owner", owner)).toBe(false);
    expect(checkThreadKey("ENQ-AAAAAAAA", "owner", "")).toBe(false);
    expect(checkThreadKey("ENQ-AAAAAAAA", "owner", `${owner.slice(0, 31)}Z`)).toBe(false);
  });
  it("works out a reply time only from enough answers", () => {
    const pair = (hours: number) => ({
      sentAt: "2026-10-01T00:00:00.000Z",
      repliedAt: new Date(
        new Date("2026-10-01T00:00:00.000Z").getTime() + hours * 3600_000,
      ).toISOString(),
    });
    expect(medianReplyHours([1, 2, 3, 4].map(pair))).toBeNull();
    expect(MIN_REPLIES).toBe(5);
    expect(medianReplyHours([30, 2, 5, 50, 3].map(pair))).toBe(5);
    expect(medianReplyHours([1, 2, 4, 6, 40, 80].map(pair))).toBe(5);
    // A reply stamped before the enquiry was sent is a bad record, not a fast owner.
    expect(medianReplyHours([-5, 1, 2, 3, 4].map(pair))).toBeNull();
  });
});

describe("the enquiry form's checks", () => {
  const form = (over: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({
      from: "2026-11-01",
      to: "2026-11-30",
      brand: "Namma Bakes, food",
      artwork: "ready",
      email: "You@Company.com",
      message: " hello ",
      ...over,
    }))
      f.set(k, v);
    return readFields(f);
  };
  it("accepts a complete enquiry and tidies it", () => {
    const f = form({ budget: "₹ 80,000" });
    expect(fieldError(f, NOW)).toBeNull();
    expect(f).toMatchObject({
      budget: 80000,
      email: "you@company.com",
      message: "hello",
      artwork: "ready",
      trap: false,
    });
  });
  it("names the first thing an owner could not act on", () => {
    expect(fieldError(form({ from: "2026-10-01" }), NOW)).toBe("dates");
    expect(fieldError(form({ to: "2026-10-20" }), NOW)).toBe("dates");
    expect(fieldError(form({ to: "2029-11-30" }), NOW)).toBe("dates");
    expect(fieldError(form({ brand: "x" }), NOW)).toBe("brand");
    expect(fieldError(form({ budget: "lots" }), NOW)).toBe("budget");
    expect(fieldError(form({ email: "nope" }), NOW)).toBe("email");
    expect(form({ website: "http://spam" }).trap).toBe(true);
    expect(form({ artwork: "whatever" }).artwork).toBe("not_started");
  });
  it("sends back what was typed, without the email or the message", () => {
    const q = echo(form({ budget: "80000" }), "dates").toString();
    expect(q).toBe(
      "error=dates&from=2026-11-01&to=2026-11-30&brand=Namma+Bakes%2C+food&budget=80000&artwork=ready",
    );
    expect(q).not.toContain("company.com");
    expect(q).not.toContain("hello");
  });
});

describe("the site sheet export", () => {
  const site = {
    id: 1,
    title: "20 × 10 ft hoarding, 80 Feet Road",
    permanentId: "ows0001",
    format: "hoarding",
    width: 20,
    height: 10,
    sizeUnit: "ft",
    widthMm: 6096,
    heightMm: 3048,
    lighting: "front-lit",
    city: "bengaluru",
    locality: "Koramangala",
    road: "80 Feet Road",
    landmark: '=HYPERLINK("http://evil")',
    lat: 12.935124,
    lng: 77.622141,
    facingDeg: 225,
    priceDisplay: "exact",
    rate: 85000,
    minPeriod: "3 months",
    availabilityConfirmedOn: new Date(NOW - 2 * DAY).toISOString(),
    audience: { figure: 420000, source: "RoadStar", measuredOn: "2026-09-01T00:00:00.000Z" },
    permit: {
      number: "P-1",
      authority: "City",
      expiresOn: new Date(NOW + 200 * DAY).toISOString(),
    },
    sample: true,
  } as unknown as Site;
  const owner = { name: "Kaveri Outdoor", verified: true, medianReplyHours: 6 } as Owner;
  const abs = (path: string) => `https://oohworks.co${path}`;

  it("puts one site on each row under the same columns", () => {
    const { columns, rows } = exportTable([{ listing: listing({}), site, owner }], NOW, abs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(columns.length);
    const row = Object.fromEntries(columns.map((c, i) => [c.header, rows[0]?.[i]]));
    expect(row["Unit ID"]).toBe("ows0001");
    expect(row["Size"]).toBe("20 × 10 ft");
    expect(row["Latitude"]).toBe(12.93512);
    expect(row["Price shown as"]).toBe("Exact rate");
    expect(row["Rate a month (INR)"]).toBe(85000);
    expect(row["Audience a week"]).toBe(420000);
    expect(row["Audience source"]).toBe("RoadStar");
    expect(row["Owner verified"]).toBe("Yes");
    expect(row["Listing"]).toBe(
      "https://oohworks.co/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/",
    );
    expect(row["Note"]).toBe("Sample listing, not a real site");
    expect(columns.filter((c) => c.money).map((c) => c.header)).toEqual(["Rate a month (INR)"]);
  });
  it("leaves a hidden price blank and adds a column for the buyer's start date", () => {
    const hidden = { ...site, priceDisplay: "on_request" } as Site;
    const { columns, rows } = exportTable(
      [
        {
          listing: listing({
            priceShown: false,
            rate: null,
            bookedUntil: new Date("2026-11-14").getTime(),
          }),
          site: hidden,
          owner,
        },
      ],
      NOW,
      abs,
      "2026-11-01",
    );
    const row = Object.fromEntries(columns.map((c, i) => [c.header, rows[0]?.[i]]));
    expect(row["Price shown as"]).toBe("On request");
    expect(row["Rate a month (INR)"]).toBeNull();
    expect(row["Free on 1 Nov 2026"]).toBe("No, booked");
  });
  it("never lets a cell be read as a formula", () => {
    expect(plainCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(plainCell("+91 98")).toBe("'+91 98");
    expect(plainCell("@cmd")).toBe("'@cmd");
    expect(plainCell(-5)).toBe("-5");
    expect(plainCell("80 Feet Road")).toBe("80 Feet Road");
    expect(plainCell(null)).toBe("");
    const { columns, rows } = exportTable([{ listing: listing({}), site, owner }], NOW, abs);
    const csv = toCsv(columns, rows);
    expect(csv.startsWith('﻿"Unit ID","Site"')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""http://evil"")"');
    expect(csv.trimEnd().split("\r\n")).toHaveLength(2);
  });
});
