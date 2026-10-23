import { describe, expect, it } from "vitest";
import {
  OWNER_FAQ,
  OWNER_SHORT_ANSWER,
  ownerFaqJsonLd,
  ownerGuideMarkdown,
} from "@/lib/owners/guide";
import { SHEET_COLUMNS } from "@/lib/owners/sheet";
import { indexChecks, isIndexable } from "./view";

const ready = {
  sample: false,
  removed: false,
  photos: [{}] as never,
  lat: 13.04512,
  lng: 80.24822,
  facingDeg: 30,
  widthMm: 12192,
  lighting: "front-lit" as const,
  audience: {},
};

describe("the content bar", () => {
  it("lets a complete, real site with a verified owner into the index", () => {
    expect(isIndexable(ready, { verified: true })).toBe(true);
    expect(indexChecks(ready, { verified: true }).every((c) => c.ok)).toBe(true);
  });

  it("names each thing that keeps a site out", () => {
    const failing = (site: Partial<typeof ready>, verified = true) =>
      indexChecks({ ...ready, ...site }, { verified })
        .filter((c) => !c.ok)
        .map((c) => c.key);
    expect(failing({ sample: true })).toEqual(["real"]);
    expect(failing({ photos: [] as never })).toEqual(["photo"]);
    expect(failing({}, false)).toEqual(["owner"]);
    expect(failing({ facingDeg: null as never })).toEqual(["facing"]);
    expect(
      failing({ audience: { figure: 1000, source: null, measuredOn: null } as never }),
    ).toEqual(["audience"]);
  });
});

describe("the owner guide", () => {
  it("has a short answer of 40 to 60 words", () => {
    const words = OWNER_SHORT_ANSWER.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
  });

  it("lists every column of the real spreadsheet template", () => {
    const md = ownerGuideMarkdown((p) => `https://oohworks.co${p}`);
    for (const c of SHEET_COLUMNS) expect(md).toContain(`| ${c.header} |`);
    expect(md).toContain("https://oohworks.co/api/owner/template/");
  });

  it("marks up the same questions the page shows", () => {
    expect(ownerFaqJsonLd().mainEntity.map((q) => q.name)).toEqual(OWNER_FAQ.map((f) => f.q));
  });
});
