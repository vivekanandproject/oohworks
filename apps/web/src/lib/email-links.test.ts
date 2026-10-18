import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { availabilityDayFresh, checkLinkKey, emailLink, linkKey } from "./email-links";

describe("signed links in emails", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret");
    vi.stubEnv("SITE_URL", "https://ohworks.example");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("opens only the record and the purpose it was made for", () => {
    const key = linkKey("confirm-follow", 7);
    expect(checkLinkKey("confirm-follow", 7, key)).toBe(true);
    expect(checkLinkKey("confirm-follow", 8, key)).toBe(false);
    expect(checkLinkKey("unfollow", 7, key)).toBe(false);
    expect(checkLinkKey("confirm-follow", 7, "0".repeat(32))).toBe(false);
    expect(checkLinkKey("confirm-follow", 7, "not hex")).toBe(false);
  });

  it("cannot be made without the site's secret", () => {
    const key = linkKey("unsubscribe", 3);
    vi.stubEnv("PAYLOAD_SECRET", "another-secret");
    expect(checkLinkKey("unsubscribe", 3, key)).toBe(false);
  });

  it("points at this site, and an availability link carries its day and lasts two weeks", () => {
    const now = Date.parse("2026-10-19T04:00:00Z");
    const url = new URL(emailLink("availability", 12, now));
    expect(url.origin + url.pathname).toBe("https://ohworks.example/api/email-link/");
    const day = url.searchParams.get("d")!;
    expect(day).toBe("2026-10-19");
    expect(checkLinkKey("availability", 12, url.searchParams.get("k")!, day)).toBe(true);
    expect(checkLinkKey("availability", 12, url.searchParams.get("k")!, "2026-10-20")).toBe(false);
    expect(availabilityDayFresh(day, now + 13 * 864e5)).toBe(true);
    expect(availabilityDayFresh(day, now + 15 * 864e5)).toBe(false);
    expect(availabilityDayFresh("2026-13-01", now)).toBe(false);
  });
});
