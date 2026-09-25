import { describe, expect, it } from "vitest";
import { canAccessOrganizationQuote } from "@/lib/api/quote-access";

describe("canAccessOrganizationQuote", () => {
  it("allows the owning organization", () => {
    expect(canAccessOrganizationQuote("org-1", "org-1")).toBe(true);
  });

  it("denies other organizations and orphan quotes", () => {
    expect(canAccessOrganizationQuote("org-2", "org-1")).toBe(false);
    expect(canAccessOrganizationQuote(null, "org-1")).toBe(false);
    expect(canAccessOrganizationQuote(undefined, "org-1")).toBe(false);
  });
});