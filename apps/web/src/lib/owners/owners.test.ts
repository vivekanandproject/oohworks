import { beforeAll, describe, expect, it } from "vitest";
import type { Owner, Site } from "@/payload-types";
import { readEmail, signEmail } from "@/lib/sites/enquiry";
import { OTHER_CITY, checkStart, readDetails } from "./company-input";
import { bearingGap, metresBetween, readCoords, sameFace } from "./coords";
import { isGstin, tidyGstin } from "./gstin";
import { freeSlug, improvements, stateOf } from "./progress";
import { EXAMPLE_REF, SHEET_COLUMNS, cellText, readSheet } from "./sheet";
import { checkSite, readDate, toSiteData, type Raw } from "./site-input";

const TODAY = "2026-10-11";
const good: Raw = {
  format: "Hoarding",
  width: "20",
  height: "10",
  lighting: "Front-lit",
  city: "Bengaluru",
  locality: "Koramangala",
  road: "80 Feet Road",
  lat: "12.93512",
  lng: "77.62214",
  facing: "225",
  priceDisplay: "exact",
  rate: "85,000",
};

describe("a GSTIN", () => {
  it("is accepted when its last character adds up", () => {
    for (const g of [
      "27AAPFU0939F1ZV",
      "29AAGCB7383J1Z4",
      "07AAGFF2194N1Z1",
      "24AAACC1206D1ZM",
      "33AAACH7409R1Z8",
    ])
      expect(isGstin(g), g).toBe(true);
    expect(isGstin(" 29aagcb7383j1z4 ")).toBe(true);
    expect(tidyGstin("29 aagcb-7383 j1z4")).toBe("29AAGCB7383J1Z4");
  });
  it("is refused when one character is wrong, or the shape is", () => {
    expect(isGstin("29AAGCB7383J1Z5")).toBe(false);
    expect(isGstin("29AAGCB7383J1Y4")).toBe(false);
    expect(isGstin("29AAGCB7384J1Z4")).toBe(false);
    expect(isGstin("00AAGCB7383J1Z4")).toBe(false);
    expect(isGstin("AAGCB7383J")).toBe(false);
    expect(isGstin("")).toBe(false);
  });
});

describe("a position an owner pastes", () => {
  it("is read from plain numbers and from Google Maps links", () => {
    expect(readCoords("12.93512, 77.62214")).toEqual({ lat: 12.93512, lng: 77.62214 });
    expect(readCoords("12.9351234 77.6221456")).toEqual({ lat: 12.93512, lng: 77.62215 });
    expect(readCoords("https://www.google.com/maps/@12.93512,77.62214,17z")).toEqual({
      lat: 12.93512,
      lng: 77.62214,
    });
    expect(readCoords("https://www.google.com/maps/search/?api=1&query=12.93512,77.62214")).toEqual(
      { lat: 12.93512, lng: 77.62214 },
    );
    expect(readCoords("https://maps.google.com/?q=12.93512%2C77.62214")).toEqual({
      lat: 12.93512,
      lng: 77.62214,
    });
    // A place link carries both the view's centre and the pin. The pin is the site.
    expect(
      readCoords(
        "https://www.google.com/maps/place/Sony+Signal/@12.9400,77.6200,17z/data=!3d12.93512!4d77.62214",
      ),
    ).toEqual({ lat: 12.93512, lng: 77.62214 });
  });
  it("is refused when there is none, or it is not on the globe", () => {
    expect(readCoords("opposite Sony Signal")).toBeNull();
    expect(readCoords("https://maps.app.goo.gl/AbCdEf123")).toBeNull();
    expect(readCoords("95.1, 77.6")).toBeNull();
    expect(readCoords("0, 0")).toBeNull();
    expect(readCoords("")).toBeNull();
  });
  it("finds two listings of one face, and tells apart two faces back to back", () => {
    const a = { lat: 12.93512, lng: 77.62214, facingDeg: 225 };
    expect(Math.round(metresBetween(a, { lat: 12.93525, lng: 77.62214 }))).toBe(14);
    expect(bearingGap(350, 10)).toBe(20);
    expect(bearingGap(225, 45)).toBe(180);
    expect(sameFace(a, { lat: 12.93525, lng: 77.62214, facingDeg: 240 })).toBe(true);
    expect(sameFace(a, { lat: 12.93525, lng: 77.62214, facingDeg: 45 })).toBe(false);
    expect(sameFace(a, { lat: 12.93525, lng: 77.62214, facingDeg: null })).toBe(true);
    expect(sameFace(a, { lat: 12.93612, lng: 77.62214, facingDeg: 225 })).toBe(false);
  });
});

describe("checking a site", () => {
  it("accepts a complete one and tidies it", () => {
    const got = checkSite(
      { ...good, landmark: "  opposite   Sony Signal ", minPeriod: "3 months" },
      TODAY,
    );
    expect(got.ok).toBe(true);
    if (!got.ok) return;
    expect(got.site).toMatchObject({
      format: "hoarding",
      width: 20,
      height: 10,
      sizeUnit: "ft",
      lighting: "front-lit",
      city: "bengaluru",
      lat: 12.93512,
      lng: 77.62214,
      facingDeg: 225,
      priceDisplay: "exact",
      rate: 85000,
      landmark: "opposite Sony Signal",
      audience: null,
      permit: null,
      digital: null,
    });
    const data = toSiteData(got.site, TODAY);
    expect(data).toMatchObject({
      country: "in",
      environment: "roadside",
      availabilityConfirmedOn: TODAY,
      taxesNote: "Taxes extra",
    });
  });
  it("understands the words owners use", () => {
    const got = checkSite(
      {
        ...good,
        format: "LED screens",
        lighting: "LED",
        city: "Bangalore",
        unit: "metres",
        width: "6",
        height: "3",
        priceDisplay: "On Request",
        rate: "",
        resolution: "1920 × 1080",
        spotSeconds: "10",
      },
      TODAY,
    );
    expect(got.ok && got.site).toMatchObject({
      format: "led-screen",
      lighting: "digital",
      city: "bengaluru",
      sizeUnit: "m",
      priceDisplay: "on_request",
      rate: null,
      digital: { resolution: "1920 × 1080", spotSeconds: 10 },
    });
    expect(
      checkSite(
        {
          ...good,
          format: "billboard",
          lighting: "backlit",
          city: "gurgaon",
          lat: "28.4595",
          lng: "77.0266",
        },
        TODAY,
      ),
    ).toMatchObject({
      ok: true,
      site: { format: "hoarding", lighting: "back-lit", city: "delhi-ncr" },
    });
    // No word for how the price shows: a rate means it shows, no rate means on request.
    expect(checkSite({ ...good, priceDisplay: "" }, TODAY)).toMatchObject({
      ok: true,
      site: { priceDisplay: "exact" },
    });
    expect(checkSite({ ...good, priceDisplay: "", rate: "" }, TODAY)).toMatchObject({
      ok: true,
      site: { priceDisplay: "on_request" },
    });
  });
  it("takes the position from a pasted link when no numbers are given", () => {
    const got = checkSite(
      { ...good, lat: "", lng: "", place: "https://www.google.com/maps/@12.93512,77.62214,17z" },
      TODAY,
    );
    expect(got.ok && got.site).toMatchObject({ lat: 12.93512, lng: 77.62214 });
    const bad = checkSite({ ...good, lat: "", lng: "", place: "near the signal" }, TODAY);
    expect(!bad.ok && bad.errors.place).toContain("could not find a position");
  });
  it("names each problem against its field, in words that say what to do", () => {
    const got = checkSite(
      {
        format: "blimp",
        width: "wide",
        height: "",
        lighting: "",
        city: "Atlantis",
        locality: "",
        road: "",
        lat: "12,935",
        lng: "",
        facing: "400",
        priceDisplay: "exact",
        rate: "",
      },
      TODAY,
    );
    expect(got.ok).toBe(false);
    if (got.ok) return;
    expect(got.errors.format).toContain("“blimp” is not a format we list");
    expect(got.errors.width).toContain("width as a number of feet");
    expect(got.errors.lighting).toBe("Choose the lighting.");
    expect(got.errors.city).toContain("We are not open in “Atlantis” yet");
    expect(got.errors.locality).toBeTruthy();
    expect(got.errors.road).toBeTruthy();
    expect(got.errors.lat).toBe("“12,935” is not a latitude. Use a number such as 12.93512.");
    expect(got.errors.lng).toContain("Put the pin on the map");
    expect(got.errors.facing).toContain("0 to 359");
    expect(got.errors.rate).toContain("Price is set to show, but there is no rate.");
  });
  it("refuses what would mislead a buyer", () => {
    const swapped = checkSite({ ...good, lat: "77.62214", lng: "12.93512" }, TODAY);
    expect(!swapped.ok && swapped.errors.lat).toContain("outside India");
    const unsourced = checkSite({ ...good, audienceFigure: "420000" }, TODAY);
    expect(!unsourced.ok && unsourced.errors.audienceSource).toContain("needs its source");
    expect(!unsourced.ok && unsourced.errors.audienceDate).toContain("needs the date");
    const sourced = checkSite(
      {
        ...good,
        audienceFigure: "4,20,000",
        audienceSource: "RoadStar",
        audienceDate: "1 Sep 2026",
      },
      TODAY,
    );
    expect(sourced.ok && sourced.site.audience).toEqual({
      figure: 420000,
      metric: null,
      source: "RoadStar",
      method: null,
      measuredOn: "2026-09-01",
    });
    const past = checkSite({ ...good, bookedUntil: "2026-09-01" }, TODAY);
    expect(!past.ok && past.errors.bookedUntil).toContain("has passed");
    const orphan = checkSite({ ...good, permitAuthority: "BBMP" }, TODAY);
    expect(!orphan.ok && orphan.errors.permitNumber).toBeTruthy();
  });
  it("reads dates the way they are written in India", () => {
    expect(readDate("2026-11-14")).toBe("2026-11-14");
    expect(readDate("14/11/2026")).toBe("2026-11-14");
    expect(readDate("14 Nov 2026")).toBe("2026-11-14");
    expect(readDate("3 October 2026")).toBe("2026-10-03");
    expect(readDate("")).toBeNull();
    expect(readDate("31/02/2026")).toBe("bad");
    expect(readDate("next week")).toBe("bad");
  });
});

describe("a spreadsheet of sites", () => {
  const header = SHEET_COLUMNS.map((c) => c.header);
  const rowOf = (values: Raw) => SHEET_COLUMNS.map((c) => values[c.key] ?? "");
  it("has a column for every fact, with an example the upload leaves out", () => {
    expect(new Set(header).size).toBe(header.length);
    expect(SHEET_COLUMNS.filter((c) => c.required).map((c) => c.header)).toEqual([
      "Format",
      "Width",
      "Height",
      "Lighting",
      "City",
      "Area",
      "Road",
      "Latitude",
      "Longitude",
      "Price shown as",
    ]);
    const example = rowOf(Object.fromEntries(SHEET_COLUMNS.map((c) => [c.key, c.example])) as Raw);
    const onlyExample = readSheet(header, [example], TODAY);
    expect(onlyExample.refused).toContain("no sites in this file yet");
    expect(SHEET_COLUMNS[0]?.example).toBe(EXAMPLE_REF);
  });
  it("turns right rows into sites and reports wrong ones by row and column", () => {
    const rows = [
      rowOf({ ...good, ownerRef: "KRM-1" }),
      rowOf({ ...good, ownerRef: "KRM-2", lat: "12,935" }),
      ["", "", "", ""],
      rowOf({ ...good, ownerRef: "KRM-3", priceDisplay: "exact", rate: "" }),
      rowOf({ ...good, ownerRef: "krm-1", road: "Hosur Road" }),
      rowOf({ ...good, road: "Sarjapur Road", priceDisplay: "on request", rate: "" }),
    ];
    const got = readSheet(header, rows, TODAY);
    expect(got.refused).toBeNull();
    expect(got.sites.map((s) => s.row)).toEqual([2, 7]);
    expect(got.sites[0]?.site.ownerRef).toBe("KRM-1");
    expect(got.problems).toEqual([
      {
        row: 3,
        column: "Latitude",
        problem: "“12,935” is not a latitude. Use a number such as 12.93512.",
      },
      {
        row: 5,
        column: "Rate a month (INR)",
        problem:
          "Price is set to show, but there is no rate. Give a rate, or set the price to “on request”.",
      },
      {
        row: 6,
        column: "Your reference",
        problem: "“krm-1” is also on row 2. Each site needs its own reference, or none.",
      },
    ]);
  });
  it("forgives reordered and renamed-by-case headings, and says which it did not read", () => {
    const shuffled = [
      "ROAD",
      "format ",
      "Width",
      "Height",
      "lighting",
      "City",
      "Area",
      "latitude",
      "Longitude",
      "Price shown as",
      "Rate a month (INR)",
      "My notes",
    ];
    const got = readSheet(
      shuffled,
      [
        [
          "80 Feet Road",
          "Hoarding",
          20,
          10,
          "Front-lit",
          "Bengaluru",
          "Koramangala",
          12.93512,
          77.62214,
          "exact",
          85000,
          "call first",
        ],
      ],
      TODAY,
    );
    expect(got.sites).toHaveLength(1);
    expect(got.unknown).toEqual(["My notes"]);
  });
  it("refuses a file that is not the template, and one that is too long", () => {
    expect(readSheet(["Name", "Address"], [["A", "B"]], TODAY).refused).toContain(
      "does not look like the ohworks template",
    );
    const many = Array.from({ length: 501 }, () => rowOf(good));
    expect(readSheet(header, many, TODAY).refused).toContain("Upload up to 500 at a time");
  });
  it("reads cells as a spreadsheet stores them", () => {
    expect(cellText(new Date("2026-11-14T00:00:00Z"))).toBe("2026-11-14");
    expect(cellText(85000)).toBe("85000");
    expect(cellText({ result: 12.93512 })).toBe("12.93512");
    expect(cellText({ richText: [{ text: "80 Feet " }, { text: "Road" }] })).toBe("80 Feet Road");
    expect(cellText({ text: "https://maps.google.com/?q=12.9,77.6", hyperlink: "x" })).toBe(
      "https://maps.google.com/?q=12.9,77.6",
    );
    expect(cellText(null)).toBe("");
  });
});

describe("where a site stands, and what would improve it", () => {
  const site = (over: Partial<Site>) => ({ priceDisplay: "exact", photos: [], ...over }) as Site;
  it("names the state an owner sees", () => {
    expect(stateOf(site({ _status: "draft" }))).toBe("draft");
    expect(stateOf(site({ _status: "draft", review: "draft" }))).toBe("draft");
    expect(stateOf(site({ _status: "draft", review: "submitted" }))).toBe("review");
    expect(stateOf(site({ _status: "draft", review: "changes" }))).toBe("changes");
    expect(stateOf(site({ _status: "published", review: "approved" }))).toBe("live");
  });
  it("lists what is missing, biggest gain first, and never payment", () => {
    const list = improvements(site({ priceDisplay: "on_request" }), { verified: false } as Owner);
    expect(list.map((i) => i.points)).toEqual([20, 15, 10, 10, 10, 5, 5]);
    expect(list[0]?.text).toContain("photograph");
    expect(
      list
        .map((i) => i.text)
        .join(" ")
        .toLowerCase(),
    ).not.toMatch(/pay|premium|featured/);
    const complete = {
      photos: [{}, {}, {}],
      audience: { figure: 1, source: "x" },
      permit: { number: "P" },
      artworkSpec: "a",
      landmark: "b",
    } as unknown as Partial<Site>;
    const full = improvements(site(complete), { verified: true } as Owner);
    expect(full).toEqual([]);
  });
  it("finds a free address for an owner's page", () => {
    const taken = new Set(["lakshmi-ads", "lakshmi-ads-2"]);
    expect(freeSlug("lakshmi-ads", (s) => taken.has(s))).toBe("lakshmi-ads-3");
    expect(freeSlug("new-owner", (s) => taken.has(s))).toBe("new-owner");
  });
});

describe("the owner's remembered browser", () => {
  beforeAll(() => {
    process.env.PAYLOAD_SECRET = "unit-test-secret";
  });
  it("is good for its own purpose only", () => {
    const now = Date.now();
    const owner = signEmail("owner", "sales@yourcompany.com", now);
    expect(readEmail("owner", owner, now)).toBe("sales@yourcompany.com");
    expect(readEmail("buyer", owner, now)).toBeNull();
    expect(readEmail("owner", signEmail("buyer", "sales@yourcompany.com", now), now)).toBeNull();
    expect(readEmail("owner", owner, now + 31 * 24 * 3600 * 1000)).toBeNull();
  });
});

describe("who is listing", () => {
  const good = {
    name: "Deccan Signs",
    city: "hyderabad",
    contactName: "Asha Rao",
    phone: "+91 98450 00000",
    email: " Asha@DeccanSigns.in ",
    gstin: "29aagcb7383j1z4",
  };

  it("accepts a full form and tidies what it keeps", () => {
    const r = checkStart(good);
    expect(r).toEqual({
      ok: true,
      email: "asha@deccansigns.in",
      details: {
        name: "Deccan Signs",
        city: "hyderabad",
        contactName: "Asha Rao",
        phone: "+91 98450 00000",
        gstin: "29AAGCB7383J1Z4",
      },
    });
  });

  it("names the first mistake in the order of the page", () => {
    const why = (change: Partial<typeof good>) => {
      const r = checkStart({ ...good, ...change });
      return r.ok ? "ok" : r.error;
    };
    expect(why({ name: "D" })).toBe("name");
    expect(why({ city: "" })).toBe("city");
    expect(why({ city: "atlantis" })).toBe("city");
    expect(why({ contactName: " " })).toBe("contact");
    expect(why({ phone: "call me" })).toBe("phone");
    expect(why({ email: "asha@" })).toBe("email");
    expect(why({ gstin: "29AAGCB7383J1Z5" })).toBe("gstin");
    expect(why({ name: "", email: "" })).toBe("name");
    expect(why({ gstin: "" })).toBe("ok");
  });

  it("lets a company outside the launch cities say so", () => {
    const r = checkStart({ ...good, city: OTHER_CITY });
    expect(r.ok && r.details.city).toBeNull();
  });

  it("reads kept details back, and treats anything else as absent", () => {
    const r = checkStart(good);
    if (!r.ok) throw new Error("expected a good form");
    expect(readDetails(JSON.parse(JSON.stringify(r.details)))).toEqual(r.details);
    expect(readDetails({ ...r.details, city: null })?.city).toBeNull();
    expect(readDetails(null)).toBeNull();
    expect(readDetails("a string")).toBeNull();
    expect(readDetails({ name: "D" })).toBeNull();
    expect(readDetails({ ...r.details, phone: 12 })).toBeNull();
  });
});
