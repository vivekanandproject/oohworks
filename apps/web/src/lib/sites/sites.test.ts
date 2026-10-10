import { beforeAll, describe, expect, it } from "vitest";
import type { Owner, Site } from "@/payload-types";
import { indiaDate, monthView } from "./calendar";
import {
  dateRange,
  hashCode,
  isReference,
  maskEmail,
  newCode,
  newReference,
  readBuyer,
  sameHash,
  sameOrigin,
  signBuyer,
} from "./enquiry";
import { facetCounts, matches, medianRate, sortListings, widen, type Listing } from "./filter";
import { activeCount, readState, toUrl, toggle, without } from "./state";
import {
  availabilityOf,
  badgesOf,
  isIndexable,
  lakh,
  priceOf,
  siteUrl,
  sizeFull,
  summaryOf,
} from "./view";

const DAY = 24 * 3600 * 1000;
const NOW = new Date("2026-10-10T06:00:00Z").getTime();
const iso = (days: number) => new Date(NOW + days * DAY).toISOString();

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
    landmark: "opposite Sony Signal",
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

const ALL: Listing[] = [
  listing({}),
  listing({
    id: 2,
    permanentId: "ows0002",
    localitySlug: "indiranagar",
    locality: "Indiranagar",
    rate: 190000,
    widthMm: 12192,
    heightMm: 6096,
    quality: 80,
  }),
  listing({
    id: 3,
    permanentId: "ows0003",
    format: "unipole",
    priceShown: false,
    rate: null,
    quality: 50,
  }),
  listing({
    id: 4,
    permanentId: "ows0004",
    format: "led-screen",
    isDigital: true,
    lighting: "digital",
    rate: 60000,
    bookedUntil: NOW + 30 * DAY,
  }),
  listing({
    id: 5,
    permanentId: "ows0005",
    city: "mumbai",
    localitySlug: "worli",
    locality: "Worli",
    rate: 45000,
    ownerVerified: false,
    ownerReplyHours: null,
    permitValid: false,
    verifiedLocation: false,
    freshOn: NOW - 50 * DAY,
  }),
];
const state = (raw: Record<string, string> = {}) => readState(raw).state;
const ids = (items: Listing[]) => items.map((l) => l.id);

describe("search state", () => {
  it("reads explicit filters and writes them back in a fixed order", () => {
    const s = state({
      sort: "price",
      format: "unipole,hoarding",
      city: "bengaluru",
      max: "100000",
      trust: "permit,owner",
      page: "2",
    });
    expect(s.formats.sort()).toEqual(["hoarding", "unipole"]);
    expect(toUrl(s)).toBe(
      "/search/?city=bengaluru&format=hoarding,unipole&max=100000&trust=owner,permit&sort=price&page=2",
    );
  });
  it("lets a typed query narrow the search", () => {
    const { state: s, understood } = readState({ q: "20x10 hoardings in Bengaluru under 1 lakh" });
    expect(understood).toBe(true);
    expect(s.city).toBe("bengaluru");
    expect(s.formats).toEqual(["hoarding"]);
    expect(s.size).toEqual({ w: 20, h: 10 });
    expect(s.max).toBe(100000);
  });
  it("ignores values it does not know, and a locality without a city", () => {
    const s = state({
      city: "atlantis",
      format: "blimp",
      sort: "random",
      page: "-3",
      locality: "koramangala",
    });
    expect(s.city).toBeUndefined();
    expect(s.formats).toEqual([]);
    expect(s.localities).toEqual([]);
    expect(s.sort).toBe("best");
    expect(s.page).toBe(1);
    expect(toUrl(s)).toBe("/search/");
  });
  it("toggles list filters, removes single ones and counts what is active", () => {
    const s = state({ city: "bengaluru", format: "hoarding", max: "100000", priced: "1" });
    expect(toggle(s.formats, "unipole")).toEqual(["hoarding", "unipole"]);
    expect(toggle(s.formats, "hoarding")).toEqual([]);
    expect(activeCount(s)).toBe(4);
    expect(toUrl(without(s, "max"))).toBe("/search/?city=bengaluru&format=hoarding&priced=1");
    expect(toUrl(s, { map: false, panel: true })).toBe(
      "/search/?city=bengaluru&format=hoarding&max=100000&priced=1&map=0&filters=1",
    );
  });
});

describe("one address per search", () => {
  it("reads back exactly what it wrote, so a tidy address never redirects again", () => {
    const cases: Record<string, string>[] = [
      {},
      {
        city: "bengaluru",
        locality: "koramangala,indiranagar",
        format: "unipole,hoarding",
        type: "static",
        size: "20.0x10",
        lit: "front-lit",
        min: "010000",
        max: "100000",
        priced: "1",
      },
      {
        from: "2026-11-01",
        to: "2026-11-30",
        trust: "responsive,owner",
        owner: "Sample-Kaveri",
        sort: "audience",
        page: "3",
        map: "0",
        filters: "1",
      },
      { q: "silk board", city: "bengaluru" },
      { city: "nowhere", page: "1", sort: "best", min: "", max: "" },
    ];
    for (const raw of cases) {
      const once = toUrl(state(raw));
      const again = toUrl(state(Object.fromEntries(new URLSearchParams(once.split("?")[1] ?? ""))));
      expect(again).toBe(once);
    }
    expect(toUrl(state({ city: "bengaluru", format: "hoarding", min: "", max: "50000" }))).toBe(
      "/search/?city=bengaluru&format=hoarding&max=50000",
    );
  });
});

describe("filtering and ordering", () => {
  it("applies place, format, type and size", () => {
    expect(ids(ALL.filter((l) => matches(l, state({ city: "bengaluru" }), NOW)))).toEqual([
      1, 2, 3, 4,
    ]);
    expect(
      ids(
        ALL.filter((l) => matches(l, state({ city: "bengaluru", locality: "indiranagar" }), NOW)),
      ),
    ).toEqual([2]);
    expect(
      ids(ALL.filter((l) => matches(l, state({ format: "unipole,led-screen" }), NOW))),
    ).toEqual([3, 4]);
    expect(ids(ALL.filter((l) => matches(l, state({ type: "digital" }), NOW)))).toEqual([4]);
    expect(ids(ALL.filter((l) => matches(l, state({ size: "40x20" }), NOW)))).toEqual([2]);
  });
  it("judges a price limit only against a price the owner shows", () => {
    expect(ids(ALL.filter((l) => matches(l, state({ max: "100000" }), NOW)))).toEqual([1, 4, 5]);
    expect(
      ids(ALL.filter((l) => matches(l, state({ priced: "1", city: "bengaluru" }), NOW))),
    ).toEqual([1, 2, 4]);
  });
  it("leaves out a site booked past the start date, and keeps it for later dates", () => {
    expect(
      ids(
        ALL.filter((l) =>
          matches(l, state({ city: "bengaluru", from: indiaDate(NOW + 10 * DAY) }), NOW),
        ),
      ),
    ).toEqual([1, 2, 3]);
    expect(
      ids(
        ALL.filter((l) =>
          matches(l, state({ city: "bengaluru", from: indiaDate(NOW + 40 * DAY) }), NOW),
        ),
      ),
    ).toEqual([1, 2, 3, 4]);
  });
  it("applies the trust filters", () => {
    expect(
      ids(
        ALL.filter((l) =>
          matches(l, state({ trust: "owner,permit,fresh,responsive,location" }), NOW),
        ),
      ),
    ).toEqual([1, 2, 3, 4]);
  });
  it("counts each option as if it were chosen", () => {
    const f = facetCounts(ALL, state({ city: "bengaluru", format: "hoarding" }), NOW);
    expect(f.cities.find((c) => c.slug === "mumbai")?.count).toBe(1);
    expect(f.formats.find((x) => x.slug === "unipole")?.count).toBe(1);
    expect(f.formats.find((x) => x.slug === "hoarding")?.count).toBe(2);
    expect(f.localities.map((l) => l.slug).sort()).toEqual(["indiranagar", "koramangala"]);
    expect(f.priced).toBe(2);
  });
  it("puts sites with no shown price after the priced ones when sorting by price", () => {
    expect(ids(sortListings(ALL, state({ sort: "price" }), NOW))).toEqual([5, 4, 1, 2, 3]);
  });
  it("ranks a complete, free listing above a thin or booked one in best match", () => {
    const order = ids(sortListings(ALL, state(), NOW));
    expect(order[0]).toBe(2);
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(4));
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(3));
  });
  it("suggests only changes that add sites", () => {
    const s = state({ city: "bengaluru", locality: "indiranagar", max: "50000" });
    const current = ALL.filter((l) => matches(l, s, NOW)).length;
    expect(current).toBe(0);
    const wider = widen(ALL, s, NOW, current);
    expect(wider.length).toBeGreaterThan(0);
    for (const w of wider) expect(w.add).toBeGreaterThan(0);
    expect(wider.map((w) => w.label)).toContain("Remove the price limit");
  });
  it("gives a median only from enough real, priced sites", () => {
    expect(medianRate(ALL)).toBeNull();
    const six = [40000, 50000, 60000, 80000, 90000, 120000].map((rate, i) =>
      listing({ id: 10 + i, rate }),
    );
    expect(medianRate(six)).toEqual({ rate: 70000, n: 6 });
    expect(medianRate(six.map((l) => ({ ...l, sample: true })))).toBeNull();
  });
});

const site = (over: Partial<Site>): Site =>
  ({
    id: 1,
    title: "20 × 10 ft hoarding, 80 Feet Road",
    slug: "hoarding-80-feet-road",
    permanentId: "ows0001",
    owner: 1,
    format: "hoarding",
    environment: "roadside",
    width: 20,
    height: 10,
    sizeUnit: "ft",
    widthMm: 6096,
    heightMm: 3048,
    lighting: "front-lit",
    country: "in",
    city: "bengaluru",
    locality: "Koramangala",
    localitySlug: "koramangala",
    road: "80 Feet Road",
    landmark: "opposite Sony Signal",
    lat: 12.93512,
    lng: 77.62214,
    facingDeg: 225,
    trafficDirection: "north-bound",
    verifiedLocation: true,
    priceDisplay: "exact",
    rate: 85000,
    availabilityConfirmedOn: iso(-2),
    photos: [{ image: 1, kind: "approach", takenOn: iso(-5) }],
    permit: { number: "P-1", authority: "City", expiresOn: iso(200) },
    updatedAt: iso(-1),
    createdAt: iso(-30),
    ...over,
  }) as Site;
const owner = { name: "Kaveri Outdoor", verified: true, medianReplyHours: 6 } as Owner;

describe("what a site page says", () => {
  it("shows the price in the mode the owner chose", () => {
    expect(priceOf(site({}))).toEqual({ shown: true, prefix: "", amount: "₹ 85,000" });
    expect(priceOf(site({ priceDisplay: "from", rate: 140000 }))).toEqual({
      shown: true,
      prefix: "From ",
      amount: "₹ 1,40,000",
    });
    expect(priceOf(site({ priceDisplay: "on_request" }))).toEqual({ shown: false });
  });
  it("words availability from the owner's calendar, with no invented urgency", () => {
    expect(availabilityOf(site({}), NOW).state).toBe("free");
    const booked = availabilityOf(site({ bookedUntil: "2026-11-14T00:00:00.000Z" }), NOW);
    expect(booked.label).toBe("Booked until 14 Nov 2026");
    expect(booked.note).toContain("15 Nov 2026");
    expect(availabilityOf(site({ availabilityConfirmedOn: iso(-45) }), NOW)).toMatchObject({
      state: "stale",
      label: "Last confirmed 6 weeks ago",
    });
    expect(availabilityOf(site({ availabilityConfirmedOn: null }), NOW).label).toBe(
      "Availability not confirmed yet",
    );
  });
  it("gives only the badges a site has earned, and says when a permit has expired", () => {
    expect(badgesOf(site({}), owner, NOW).map((b) => b.text)).toEqual([
      "Verified owner",
      "Verified location",
      "Permit on file",
      "Updated 2 days ago",
      "Replies in under a day",
    ]);
    const weak = badgesOf(
      site({
        verifiedLocation: false,
        permit: { number: "P-1", expiresOn: "2026-03-10T00:00:00.000Z" },
        availabilityConfirmedOn: iso(-90),
        photos: [],
        sample: true,
      }),
      { verified: false, medianReplyHours: 40 },
      NOW,
    );
    expect(weak.map((b) => b.text)).toEqual(["Permit expired Mar 2026", "Sample listing"]);
  });
  it("keeps samples, thin listings and unsourced audiences out of the index", () => {
    expect(isIndexable(site({}), owner)).toBe(true);
    expect(isIndexable(site({ sample: true }), owner)).toBe(false);
    expect(isIndexable(site({ photos: [] }), owner)).toBe(false);
    expect(isIndexable(site({}), { verified: false })).toBe(false);
    expect(isIndexable(site({ audience: { figure: 400000 } }), owner)).toBe(false);
    expect(
      isIndexable(
        site({ audience: { figure: 400000, source: "RoadStar", measuredOn: iso(-40) } }),
        owner,
      ),
    ).toBe(true);
  });
  it("formats sizes, counts, addresses and the factual summary", () => {
    expect(sizeFull(site({}))).toBe("20 × 10 ft (6.1 × 3.0 m)");
    expect(lakh(420000)).toBe("4.2 lakh");
    expect(lakh(13000000)).toBe("1.3 crore");
    expect(lakh(85000)).toBe("85,000");
    expect(siteUrl(site({}))).toBe("/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/");
    expect(summaryOf(site({}), owner)).toBe(
      "A 20 × 10 ft front-lit hoarding on 80 Feet Road in Koramangala, Bengaluru, opposite Sony Signal. It faces 225° SW, towards north-bound traffic. Kaveri Outdoor owns it and is the seller.",
    );
  });
});

describe("availability calendar", () => {
  it("draws the current month with the week starting on Monday", () => {
    const m = monthView(undefined, null, NOW);
    expect(m.key).toBe("2026-10");
    expect(m.label).toBe("October 2026");
    expect(m.blanks).toBe(3);
    expect(m.days).toHaveLength(31);
    expect(m.days[8]).toMatchObject({ n: 9, state: "past" });
    expect(m.days[9]).toMatchObject({ n: 10, state: "free" });
    expect(m.prev).toBeNull();
    expect(m.next).toBe("2026-11");
  });
  it("marks days booked up to and including the booked-until date", () => {
    const m = monthView("2026-11", "2026-11-14T00:00:00.000Z", NOW);
    expect(m.days[13]).toMatchObject({ n: 14, state: "booked" });
    expect(m.days[14]).toMatchObject({ n: 15, state: "free" });
    expect(m.prev).toBe("2026-10");
  });
  it("falls back to this month for a month outside the range", () => {
    expect(monthView("2025-01", null, NOW).key).toBe("2026-10");
    expect(monthView("2030-01", null, NOW).key).toBe("2026-10");
    expect(monthView("nonsense", null, NOW).key).toBe("2026-10");
    expect(monthView("2027-09", null, NOW).next).toBeNull();
  });
});

describe("enquiry codes and the remembered browser", () => {
  beforeAll(() => {
    process.env.PAYLOAD_SECRET = "unit-test-secret";
  });
  it("makes references and codes of the right shape", () => {
    const ref = newReference();
    expect(isReference(ref)).toBe(true);
    expect(isReference("ENQ-123")).toBe(false);
    expect(newCode()).toMatch(/^\d{6}$/);
  });
  it("binds a code to its enquiry", () => {
    const hash = hashCode("123456", "ENQ-AAAAAAAA");
    expect(sameHash(hash, hashCode("123456", "ENQ-AAAAAAAA"))).toBe(true);
    expect(sameHash(hash, hashCode("123456", "ENQ-BBBBBBBB"))).toBe(false);
    expect(sameHash(hash, hashCode("123457", "ENQ-AAAAAAAA"))).toBe(false);
    expect(hash).not.toContain("123456");
  });
  it("remembers a confirmed address for 30 days and rejects a changed cookie", () => {
    const cookie = signBuyer("you@company.com", NOW);
    expect(readBuyer(cookie, NOW + 29 * DAY)).toBe("you@company.com");
    expect(readBuyer(cookie, NOW + 31 * DAY)).toBeNull();
    const [body = "", sig = ""] = cookie.split(".");
    const forged = Buffer.from(
      JSON.stringify({ e: "other@company.com", x: NOW + 99 * DAY }),
    ).toString("base64url");
    expect(readBuyer(`${forged}.${sig}`, NOW)).toBeNull();
    expect(readBuyer(`${body}.deadbeef`, NOW)).toBeNull();
    expect(readBuyer(undefined, NOW)).toBeNull();
  });
  it("masks an address and accepts only same-site form posts", () => {
    expect(maskEmail("you@company.com")).toBe("y··@company.com");
    const post = (origin: string | null) =>
      new Request("http://ohworks.test/api/enquire/", {
        method: "POST",
        headers: { host: "ohworks.test", ...(origin ? { origin } : {}) },
      });
    expect(sameOrigin(post("http://ohworks.test"))).toBe(true);
    expect(sameOrigin(post("https://evil.example"))).toBe(false);
    expect(sameOrigin(post("not a url"))).toBe(false);
  });
  it("writes a date range the way it is said", () => {
    expect(dateRange("2026-11-01", "2026-11-30")).toBe("1 to 30 Nov 2026");
    expect(dateRange("2026-11-20", "2026-12-05")).toBe("20 Nov to 5 Dec 2026");
    expect(dateRange("2026-12-20", "2027-01-05")).toBe("20 Dec 2026 to 5 Jan 2027");
    expect(dateRange("2026-11-01", "2026-11-01")).toBe("1 Nov 2026");
  });
});
