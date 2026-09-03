import { describe, expect, it } from "vitest";
import { findMatchingTariff } from "@/lib/marketplace/tariff-match";
import type { Tariff } from "@/lib/types/database";

const SAMPLE_TARIFFS: Tariff[] = [
  {
    id: "t1",
    plan_id: "p1",
    age_min: 18,
    age_max: 65,
    gender: "femenino",
    region: "Sierra",
    monthly_price: 100,
    deductible: 500,
    copay_pct: 20,
    annual_limit: 10000,
    exclusions: [],
    is_demo: false,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "t2",
    plan_id: "p1",
    age_min: 18,
    age_max: 65,
    gender: "any",
    region: "any",
    monthly_price: 120,
    deductible: 500,
    copay_pct: 20,
    annual_limit: 10000,
    exclusions: [],
    is_demo: false,
    created_at: "2025-01-01T00:00:00Z",
  },
];

describe("tariff matching", () => {
  it("returns null when no tariffs match filters", () => {
    const result = findMatchingTariff(SAMPLE_TARIFFS, {
      age: 10,
      gender: "masculino",
      region: "Austro",
    });
    expect(result).toBeNull();
  });

  it("prefers more specific tariff rows", () => {
    const result = findMatchingTariff(SAMPLE_TARIFFS, {
      age: 30,
      gender: "femenino",
      region: "Sierra",
    });
    expect(result?.id).toBe("t1");
  });

  it("falls back to generic gender/region rows", () => {
    const result = findMatchingTariff(SAMPLE_TARIFFS, {
      age: 30,
      gender: "masculino",
      region: "Costa",
    });
    expect(result?.id).toBe("t2");
  });
});

describe("searchMarketplace without Supabase", () => {
  it("returns empty catalog when admin client is unavailable", async () => {
    const { searchMarketplace } = await import("@/lib/marketplace/catalog");
    const results = await searchMarketplace({ sort: "price_asc" });
    expect(results).toEqual([]);
  });
});
