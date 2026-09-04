import { describe, expect, it } from "vitest";
import {
  marketplaceFiltersToSearchParams,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";

describe("marketplace filters", () => {
  it("parses filters from search params", () => {
    const params = new URLSearchParams({
      age: "30",
      gender: "femenino",
      region: "Sierra",
      insurer_id: "a0000000-0000-4000-8000-000000000001",
      category: "hospitalizacion",
      deductible_max: "50000",
      waiting_max: "180",
      q: "maternidad",
      price_min: "50",
      price_max: "200",
      sort: "price_desc",
    });

    const filters = parseMarketplaceFilters(params);
    expect(filters.age).toBe(30);
    expect(filters.gender).toBe("femenino");
    expect(filters.region).toBe("Sierra");
    expect(filters.insurerId).toBe("a0000000-0000-4000-8000-000000000001");
    expect(filters.category).toBe("hospitalizacion");
    expect(filters.deductibleMax).toBe(50000);
    expect(filters.waitingMaxDays).toBe(180);
    expect(filters.keyword).toBe("maternidad");
    expect(filters.priceMin).toBe(50);
    expect(filters.priceMax).toBe(200);
    expect(filters.sort).toBe("price_desc");
  });

  it("serializes price range filters", () => {
    const params = marketplaceFiltersToSearchParams({
      priceMin: 40,
      priceMax: 180,
    });
    expect(params.get("price_min")).toBe("40");
    expect(params.get("price_max")).toBe("180");
  });

  it("serializes filters to URL params", () => {
    const params = marketplaceFiltersToSearchParams(
      { age: 25, gender: "masculino", sort: "price_asc" },
      ["plan-1", "plan-2"],
    );
    expect(params.get("age")).toBe("25");
    expect(params.get("gender")).toBe("masculino");
    expect(params.get("compare")).toBe("plan-1,plan-2");
    expect(params.get("sort")).toBeNull();
  });
});
