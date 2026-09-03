import { describe, expect, it } from "vitest";
import { userBelongsToOrg } from "@/lib/auth/org";
import type { OrgMembership } from "@/lib/auth/org";

describe("tenant isolation", () => {
  const memberships: OrgMembership[] = [
    {
      organizationId: "d0000000-0000-4000-8000-000000000001",
      role: "admin",
      organizationName: "[DEMO] Org",
      isDemo: true,
    },
  ];

  it("returns true for matching org", () => {
    expect(
      userBelongsToOrg(
        memberships,
        "d0000000-0000-4000-8000-000000000001",
      ),
    ).toBe(true);
  });

  it("returns false for different org", () => {
    expect(
      userBelongsToOrg(
        memberships,
        "00000000-0000-4000-8000-000000000099",
      ),
    ).toBe(false);
  });
});
