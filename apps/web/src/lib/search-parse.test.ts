import { describe, expect, it } from "vitest";
import { parseQuery, searchUrl } from "./search-parse";

describe("parseQuery", () => {
  it("finds city, format and size", () => {
    const { facets } = parseQuery("20x10 hoardings in Bengaluru");
    expect(facets.city).toBe("bengaluru");
    expect(facets.format).toBe("hoarding");
    expect(facets.size).toEqual({ w: 20, h: 10 });
  });
  it("understands aliases and budgets", () => {
    const { facets } = parseQuery("LED screens in Bombay under ₹2 lakh a month");
    expect(facets.city).toBe("mumbai");
    expect(facets.format).toBe("led-screen");
    expect(facets.budget).toBe(200000);
  });
  it("keeps a road or landmark as an area", () => {
    const { facets } = parseQuery("hoarding near Silk Board junction");
    expect(facets.format).toBe("hoarding");
    expect(facets.area).toBe("silk board junction");
  });
  it("returns nothing for an empty query", () => {
    expect(parseQuery("   ").facets).toEqual({});
  });
  it("builds URLs in a fixed order", () => {
    expect(searchUrl({ format: "hoarding", city: "pune", q: "x" })).toBe(
      "/search/?q=x&city=pune&format=hoarding",
    );
  });
});
