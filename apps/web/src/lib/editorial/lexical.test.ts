import { describe, expect, it } from "vitest";
import { formatDate, timeAgo } from "./format";
import { countWords, excerpt, factsIn, headingIndex, refId, slugifyHeading } from "./lexical";

const text = (t: string) => ({ type: "text", text: t });
const fact = (value: string, source: unknown, label?: string) => ({
  type: "inlineBlock",
  fields: { blockType: "fact", value, source, asOf: "2025-12-31", ...(label ? { label } : {}) },
});
const body = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [text("Spend reached "), fact("$54.2 bn", 7, "Global spend"), text(" in 2025.")],
      },
      { type: "heading", tag: "h2", children: [text("The money is in static")] },
      { type: "paragraph", children: [text("Billboards earn "), fact("71.1%", { id: 9 })] },
      { type: "heading", tag: "h2", children: [text("The money is in static")] },
      { type: "heading", tag: "h3", children: [text("Écoute, c'est ça")] },
    ],
  },
};

describe("lexical helpers", () => {
  it("gives headings stable, unique ids", () => {
    const { list, ids } = headingIndex(body);
    expect(list.map((h) => h.id)).toEqual([
      "the-money-is-in-static",
      "the-money-is-in-static-2",
      "ecoute-c-est-ca",
    ]);
    expect(list.map((h) => h.level)).toEqual([2, 2, 3]);
    expect(ids.get(body.root.children[1]!)).toBe("the-money-is-in-static");
  });
  it("finds facts in reading order, with their sources", () => {
    const facts = factsIn(body);
    expect(facts.map((f) => f.value)).toEqual(["$54.2 bn", "71.1%"]);
    expect(facts.map((f) => refId(f.source))).toEqual([7, 9]);
    expect(facts[0]!.label).toBe("Global spend");
  });
  it("counts words including the figures", () => {
    expect(countWords(body)).toBe(22);
    expect(countWords(null)).toBe(0);
  });
  it("takes the opening paragraph as the excerpt", () => {
    expect(excerpt(body)).toBe("Spend reached $54.2 bn in 2025.");
    expect(excerpt(body, 12)).toBe("Spend reach…");
  });
  it("never returns an empty heading id", () => {
    expect(slugifyHeading("!!!")).toBe("section");
  });
});

describe("dates", () => {
  it("formats dates the way the design system sets them, in India time", () => {
    expect(formatDate("2026-10-03T06:00:00.000Z")).toBe("3 Oct 2026");
    expect(formatDate("2026-09-23T20:00:00.000Z")).toBe("24 Sep 2026");
    expect(formatDate(null)).toBe("");
  });
  it("speaks in plain words for recent times", () => {
    const now = Date.parse("2026-10-10T12:00:00.000Z");
    expect(timeAgo("2026-10-10T11:59:40.000Z", now)).toBe("Just now");
    expect(timeAgo("2026-10-10T10:00:00.000Z", now)).toBe("2 hours ago");
    expect(timeAgo("2026-10-09T10:00:00.000Z", now)).toBe("Yesterday");
    expect(timeAgo("2026-10-07T12:00:00.000Z", now)).toBe("3 days ago");
    expect(timeAgo("2026-09-01T12:00:00.000Z", now)).toBe("1 Sep 2026");
  });
});
