import { afterEach, describe, expect, it, vi } from "vitest";
import { hiddenFromSearch, internalDocsShown, siteEnv } from "./env";

describe("which environment this is", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("trusts a known SITE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ENV", "staging");
    expect(siteEnv()).toBe("staging");
    expect(internalDocsShown()).toBe(true);
  });

  it("counts a production build without SITE_ENV as production, so the internal reference stays hidden", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ENV", "");
    expect(siteEnv()).toBe("production");
    expect(internalDocsShown()).toBe(false);
  });

  it("counts an unknown SITE_ENV the same way", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ENV", "prod");
    expect(internalDocsShown()).toBe(false);
  });

  it("shows the internal reference on a development machine and in tests", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SITE_ENV", "");
    expect(siteEnv()).toBe("local");
    expect(internalDocsShown()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ENV", "test");
    expect(internalDocsShown()).toBe(true);
  });

  it("hides it in production even when other settings say otherwise", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SITE_ENV", "production");
    expect(internalDocsShown()).toBe(false);
  });

  it("hides previews and staging from search engines, and nothing else", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const [env, hidden] of [
      ["preview", true],
      ["staging", true],
      ["production", false],
      ["test", false],
      ["", false],
    ] as const) {
      vi.stubEnv("SITE_ENV", env);
      expect(hiddenFromSearch(), env || "unset").toBe(hidden);
    }
  });
});
