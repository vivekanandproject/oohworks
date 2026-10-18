import { afterEach, describe, expect, it, vi } from "vitest";
import { mayEmail } from "./email-allowlist";

describe("who may get a real email", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("anyone, in production", () => {
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("EMAIL_ALLOWLIST", "team@ohworks.com");
    expect(mayEmail("owner@example.com")).toBe(true);
  });

  it("nobody, in staging or a preview without an allowlist", () => {
    for (const env of ["staging", "preview", "test"]) {
      vi.stubEnv("SITE_ENV", env);
      vi.stubEnv("EMAIL_ALLOWLIST", "");
      expect(mayEmail("owner@example.com"), env).toBe(false);
    }
  });

  it("only listed addresses and domains, in staging", () => {
    vi.stubEnv("SITE_ENV", "staging");
    vi.stubEnv("EMAIL_ALLOWLIST", " Tester@Example.com , @ohworks.com ");
    expect(mayEmail("tester@example.com")).toBe(true);
    expect(mayEmail("vc@ohworks.com")).toBe(true);
    expect(mayEmail("someone@example.com")).toBe(false);
    expect(mayEmail("a@notohworks.com")).toBe(false);
  });

  it("anyone on a development machine with no list, as before", () => {
    vi.stubEnv("SITE_ENV", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_ALLOWLIST", "");
    expect(mayEmail("owner@example.com")).toBe(true);
  });
});
