import { afterEach, describe, expect, it } from "vitest";
import { gaBootScript, gaMeasurementId, pagePath } from "./analytics";

describe("pagePath", () => {
  it("drops query strings, which carry codes, tokens and references", () => {
    expect(pagePath("/list-your-sites/confirm/", "?t=abc123&via=signin")).toBe(
      "/list-your-sites/confirm/",
    );
    expect(pagePath("/enquire/sent/", "?ref=OH-12345")).toBe("/enquire/sent/");
    expect(pagePath("/sign-in/code/", "t=xyz")).toBe("/sign-in/code/");
  });

  it("keeps search filters, which say what people look for", () => {
    expect(pagePath("/search/", "?city=mumbai&format=unipole")).toBe(
      "/search/?city=mumbai&format=unipole",
    );
    expect(pagePath("/search/", "")).toBe("/search/");
  });

  it("blanks private references in the path", () => {
    expect(pagePath("/enquiries/OH-12345/", "")).toBe("/enquiries/:ref/");
    expect(pagePath("/reply/secret-token", "")).toBe("/reply/:ref");
    expect(pagePath("/quick/abc", "")).toBe("/quick/:ref");
    expect(pagePath("/email/confirmed/", "")).toBe("/email/:ref/");
    expect(pagePath("/owner/sites/42/edit/", "")).toBe("/owner/sites/:ref/edit/");
  });

  it("leaves public pages alone", () => {
    expect(pagePath("/in/mumbai/andheri/unipole-sv-road-ab12cd/", "")).toBe(
      "/in/mumbai/andheri/unipole-sv-road-ab12cd/",
    );
    expect(pagePath("/enquire/plan/", "")).toBe("/enquire/plan/");
  });
});

describe("gaMeasurementId", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("is empty outside production, so staging and previews never send a hit", () => {
    process.env.GA_MEASUREMENT_ID = "G-ABC123XYZ";
    process.env.SITE_ENV = "staging";
    expect(gaMeasurementId()).toBe("");
  });

  it("is the id in production, and empty for anything that is not one", () => {
    process.env.SITE_ENV = "production";
    process.env.GA_MEASUREMENT_ID = "G-ABC123XYZ";
    expect(gaMeasurementId()).toBe("G-ABC123XYZ");
    process.env.GA_MEASUREMENT_ID = "UA-1234-1";
    expect(gaMeasurementId()).toBe("");
    process.env.GA_MEASUREMENT_ID = "G-ABC');alert(1);//";
    expect(gaMeasurementId()).toBe("");
  });
});

describe("gaBootScript", () => {
  it("starts with every storage denied and sends no automatic page view", () => {
    const s = gaBootScript("G-ABC123XYZ");
    expect(s).toContain("ad_storage:'denied'");
    expect(s).toContain("analytics_storage:c==='granted'?'granted':'denied'");
    expect(s).toContain("send_page_view:false");
  });
});
