import { describe, expect, it } from "vitest";
import { readiness, type ReadinessInput } from "./readiness";

const p = (text: string) => ({ type: "paragraph", children: [{ type: "text", text }] });
const link = (url: string) => ({
  type: "link",
  fields: { url, linkType: "custom" },
  children: [{ type: "text", text: "a link" }],
});
const body = (...children: unknown[]) => ({ root: { type: "root", children } });

const ready: ReadinessInput = {
  collection: "articles",
  pillar: "news",
  title: "Karnataka's draft rules would auction Bengaluru hoardings by road",
  slug: "karnataka-draft-rules-auction-bengaluru-hoardings",
  standfirst:
    "The state's draft rules, published on 3 Oct 2026, would let the city auction outdoor advertising rights stretch by stretch.",
  shortAnswer: Array.from({ length: 50 }, () => "word").join(" "),
  seoDescription: "",
  body: body(p("The draft rules were published on 3 Oct 2026."), {
    type: "paragraph",
    children: [
      link("/news/other/"),
      link("https://oohworks.co/guides/x/"),
      link("https://karnataka.gov.in/rules"),
    ],
  }),
  authors: 1,
  places: 1,
  tags: 0,
  layout: "standard",
  hero: { width: 1600, alt: "A hoarding on Outer Ring Road", credit: "OOHWORKS" },
  siteHost: "oohworks.co",
};

const failing = (input: ReadinessInput) =>
  readiness(input)
    .filter((c) => !c.ok)
    .map((c) => c.key);

describe("readiness", () => {
  it("passes a piece that meets every check", () => {
    expect(failing(ready)).toEqual([]);
  });

  it("asks for a short answer on news, and not on showcase", () => {
    expect(failing({ ...ready, shortAnswer: "" })).toEqual(["short-answer"]);
    expect(failing({ ...ready, pillar: "showcase", shortAnswer: "" })).toEqual([]);
  });

  it("flags titles, standfirsts and descriptions of the wrong length", () => {
    expect(failing({ ...ready, title: "Too short" })).toEqual(["title"]);
    const long = "x".repeat(200);
    expect(failing({ ...ready, standfirst: long })).toEqual(["description"]);
    expect(failing({ ...ready, standfirst: long, seoDescription: "A short description." })).toEqual(
      [],
    );
  });

  it("counts unchecked figures and asks for them to be ticked", () => {
    const fact = (checked: boolean) => ({
      type: "inlineBlock",
      fields: { blockType: "fact", value: "15%", source: 1, asOf: "2026-01-01", checked },
    });
    const withFacts = body(
      { type: "paragraph", children: [fact(true), fact(false)] },
      { type: "paragraph", children: [link("/a/"), link("/b/")] },
    );
    const check = readiness({ ...ready, body: withFacts }).find((c) => c.key === "facts")!;
    expect(check.ok).toBe(false);
    expect(check.label).toContain("1 of 2");
  });

  it("wants a wide hero with alt text, and a hero on an immersive piece", () => {
    expect(failing({ ...ready, hero: { width: 800, alt: "x", credit: "y" } })).toEqual(["hero"]);
    expect(failing({ ...ready, hero: { width: 1600, alt: "", credit: "y" } })).toEqual(["hero"]);
    expect(failing({ ...ready, hero: null, layout: "immersive" })).toEqual(["hero"]);
    expect(failing({ ...ready, hero: null })).toEqual([]);
  });

  it("checks links, headings, length and long sentences", () => {
    expect(failing({ ...ready, body: body(p("No links at all.")) })).toEqual([
      "internal-links",
      "outbound",
    ]);
    const skipping = body(
      { type: "heading", tag: "h3", children: [{ type: "text", text: "Sub" }] },
      ...(ready.body as { root: { children: unknown[] } }).root.children,
    );
    expect(failing({ ...ready, body: skipping })).toEqual(["headings"]);
    expect(failing({ ...ready, pillar: "analysis" })).toEqual(["length"]);
    const rambling = Array.from({ length: 35 }, () => "word").join(" ") + ".";
    expect(
      failing({
        ...ready,
        body: body(p(rambling), ...(ready.body as { root: { children: unknown[] } }).root.children),
      }),
    ).toEqual(["sentences"]);
  });

  it("rejects an address with a date in it", () => {
    expect(failing({ ...ready, slug: "rules-2026-10-03" })).toEqual(["slug"]);
  });
});
