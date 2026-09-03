import { describe, expect, it } from "vitest";
import {
  getCompareEntries,
  searchDemoMarketplace,
} from "@/lib/marketplace/catalog";

describe("marketplace catalog", () => {
  it("returns all demo plans by default", () => {
    const results = searchDemoMarketplace({ sort: "price_asc" });
    expect(results.length).toBe(3);
    expect(results.every((r) => r.plan.is_demo)).toBe(true);
  });

  it("filters by insurer", () => {
    const results = searchDemoMarketplace({
      insurerId: "a0000000-0000-4000-8000-000000000002",
      sort: "price_asc",
    });
    expect(results).toHaveLength(1);
    expect(results[0].plan.name).toContain("Beta");
  });

  it("filters by category", () => {
    const withMaternity = searchDemoMarketplace({
      category: "maternidad",
      sort: "price_asc",
    });
    expect(withMaternity.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by keyword", () => {
    const results = searchDemoMarketplace({
      keyword: "dental",
      sort: "price_asc",
    });
    expect(results).toHaveLength(1);
    expect(results[0].plan.name).toContain("Esencial");
  });

  it("filters by age gender region for tariff match", () => {
    const results = searchDemoMarketplace({
      age: 30,
      gender: "masculino",
      region: "metropolitana",
      sort: "price_asc",
    });
    const withTariff = results.filter((r) => r.tariff != null);
    expect(withTariff.length).toBeGreaterThanOrEqual(2);
    expect(withTariff[0].monthlyPrice).toBeLessThanOrEqual(
      withTariff[withTariff.length - 1].monthlyPrice ?? 0,
    );
  });

  it("marks demo results as indicative quote state", () => {
    const results = searchDemoMarketplace({
      age: 30,
      gender: "femenino",
      region: "metropolitana",
      sort: "price_asc",
    });
    expect(results[0].quoteState).toBe("indicative");
    expect(results[0].monthlyPrice).toBeGreaterThan(0);
  });

  it("builds compare entries for selected versions", () => {
    const entries = getCompareEntries(
      [
        "d1000000-0000-4000-8000-000000000001",
        "d1000000-0000-4000-8000-000000000002",
      ],
      { age: 30, gender: "femenino", region: "metropolitana" },
    );
    expect(entries).toHaveLength(2);
    expect(entries[0].monthlyPrice).toBeGreaterThan(0);
  });
});
