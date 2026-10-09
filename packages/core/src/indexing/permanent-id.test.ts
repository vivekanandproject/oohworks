import { describe, expect, it } from "vitest";
import { isPermanentId, permanentIdFromSlug } from "./permanent-id";

describe("permanent id", () => {
  it("accepts the documented example", () => {
    expect(isPermanentId("ow8k3x2")).toBe(true);
  });
  it("rejects ambiguous characters and wrong length", () => {
    expect(isPermanentId("owil0u1")).toBe(false);
    expect(isPermanentId("ow8k3x")).toBe(false);
  });
  it("extracts the id from a unit slug", () => {
    expect(permanentIdFromSlug("hoarding-80-feet-road-ow8k3x2")).toBe("ow8k3x2");
    expect(permanentIdFromSlug("hoarding-80-feet-road")).toBeNull();
  });
});
