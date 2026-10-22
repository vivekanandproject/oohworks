import { describe, expect, it } from "vitest";
import { briefChips } from "./brief";

const labels = (text: string) => briefChips(text).map((c) => c.label);

describe("briefChips", () => {
  it("reads the home page's example briefs as the search will", () => {
    expect(labels("Hoardings on Outer Ring Road, Bengaluru")).toEqual([
      "Bengaluru",
      "Hoardings",
      "“outer ring road”",
    ]);
    expect(labels("LED screens in Mumbai")).toEqual(["Mumbai", "LED screens"]);
    expect(labels("20 × 10 near Silk Board under 1 lakh")).toEqual([
      "20 × 10 ft",
      "Under ₹ 1,00,000 a month",
      "“silk board”",
    ]);
  });

  it("shows lighting only when it is a filter the search has", () => {
    expect(labels("back-lit hoardings in Pune")).toEqual(["Pune", "Hoardings", "Back-lit"]);
    expect(labels("lit hoardings in Pune")).toEqual(["Pune", "Hoardings"]);
  });

  it("shows nothing for an empty box or words it cannot place", () => {
    expect(briefChips("")).toEqual([]);
    expect(briefChips("   ")).toEqual([]);
    expect(briefChips("asdfgh")).toEqual([]);
  });
});
