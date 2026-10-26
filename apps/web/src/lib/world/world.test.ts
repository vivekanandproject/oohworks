import { describe, expect, it } from "vitest";
import { COUNTRIES, countryOrDefault, findCountry, isCurrency } from "./countries";
import { timeZoneAt } from "./zone";
import { dateIn } from "@/lib/sites/calendar";
import { countWords, money } from "./money";

const NBSP = " ";

describe("countries", () => {
  it("knows every country's currency, zone, number style and size unit", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(findCountry("in")).toMatchObject({
      code: "IN",
      slug: "in",
      name: "India",
      currency: "INR",
      timeZone: "Asia/Kolkata",
      locale: "en-IN",
      sizeUnit: "ft",
    });
    expect(findCountry("AE")).toMatchObject({
      currency: "AED",
      timeZone: "Asia/Dubai",
      sizeUnit: "m",
    });
    expect(findCountry("GB")).toMatchObject({ currency: "GBP", timeZone: "Europe/London" });
    expect(findCountry("US")).toMatchObject({
      currency: "USD",
      timeZone: "America/New_York",
      sizeUnit: "ft",
    });
  });

  it("falls back to India only where a figure must have a country", () => {
    expect(findCountry("zz")).toBeUndefined();
    expect(findCountry(null)).toBeUndefined();
    expect(countryOrDefault("zz").code).toBe("IN");
  });

  it("checks currency codes", () => {
    expect(isCurrency("aed")).toBe(true);
    expect(isCurrency("XYZ")).toBe(false);
  });

  it("reads the zone from a point, offline", () => {
    expect(timeZoneAt(25.2048, 55.2708)).toBe("Asia/Dubai");
    expect(timeZoneAt(12.9716, 77.5946)).toBe("Asia/Kolkata");
    expect(timeZoneAt(51.5072, -0.1276)).toBe("Europe/London");
  });
});

describe("money", () => {
  it("writes each currency as its country does", () => {
    expect(money(125000, "INR")).toBe(`₹${NBSP}1,25,000`);
    expect(money(12500, "AED")).toBe(`AED${NBSP}12,500`);
    expect(money(4000, "USD")).toBe(`$${NBSP}4,000`);
    expect(money(4000, "GBP")).toBe(`£${NBSP}4,000`);
    expect(money(4000, "EUR")).toBe(`€${NBSP}4,000`);
  });

  it("never shows a bare $ for a dollar that is not the US one", () => {
    expect(money(5000, "SGD")).toBe(`SGD${NBSP}5,000`);
    expect(money(5000, "AUD")).toBe(`AUD${NBSP}5,000`);
  });

  it("rounds to whole amounts", () => {
    expect(money(85000.6, "INR")).toBe(`₹${NBSP}85,001`);
  });
});

describe("counts in words", () => {
  it("says lakh and crore in India and millions elsewhere", () => {
    expect(countWords(420000, "IN")).toBe("4.2 lakh");
    expect(countWords(13000000, "IN")).toBe("1.3 crore");
    expect(countWords(420000, "AE")).toBe("420,000");
    expect(countWords(1200000, "GB")).toBe("1.2 million");
    expect(countWords(950, "US")).toBe("950");
  });
});

describe("a site's own today", () => {
  it("turns over at midnight where the site stands", () => {
    // 20:30 UTC on 26 Oct is already 27 Oct in Kolkata and Dubai, still 26 Oct in New York.
    const t = Date.UTC(2026, 9, 26, 20, 30);
    expect(dateIn(t, "Asia/Kolkata")).toBe("2026-10-27");
    expect(dateIn(t, "Asia/Dubai")).toBe("2026-10-27");
    expect(dateIn(t, "America/New_York")).toBe("2026-10-26");
    expect(dateIn(t, "Not/AZone")).toBe("2026-10-27");
  });
});
