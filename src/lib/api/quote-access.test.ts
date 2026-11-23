import { describe, expect, it } from "vitest";
import {
  canAccessOrganizationQuote,
  canRequoteQuote,
} from "@/lib/api/quote-access";

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

describe("canRequoteQuote", () => {
  it("allows re-quoting a live offer of the same tenant", () => {
    expect(
      canRequoteQuote({ organization_id: "org-1", status: "active" }, "org-1"),
    ).toBe(true);
    expect(
      canRequoteQuote({ organization_id: "org-1", status: "expired" }, "org-1"),
    ).toBe(true);
  });

  it("denies other tenants and orphan quotes", () => {
    expect(
      canRequoteQuote({ organization_id: "org-2", status: "active" }, "org-1"),
    ).toBe(false);
    expect(
      canRequoteQuote({ organization_id: null, status: "active" }, "org-1"),
    ).toBe(false);
  });

  it("denies closed quotes", () => {
    for (const status of ["accepted", "cancelled", "draft"]) {
      expect(canRequoteQuote({ organization_id: "org-1", status }, "org-1")).toBe(
        false,
      );
    }
  });
});
