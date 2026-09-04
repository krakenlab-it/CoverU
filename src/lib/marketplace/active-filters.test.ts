import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  getActiveFilterChips,
} from "@/lib/marketplace/active-filters";
import type { Insurer } from "@/lib/types/database";

const insurers: Insurer[] = [
  {
    id: "ins-1",
    name: "Aseguradora Alpha",
    slug: "alpha",
    logo_url: null,
    is_demo: false,
    created_at: "2025-01-01T00:00:00Z",
  },
];

describe("marketplace active filters", () => {
  it("builds chips for active filters", () => {
    const chips = getActiveFilterChips(
      {
        keyword: "maternidad",
        age: 30,
        gender: "femenino",
        region: "Sierra",
        insurerId: "ins-1",
        category: "hospitalizacion",
        deductibleMax: 50000,
        waitingMaxDays: 180,
        sort: "price_desc",
      },
      insurers,
    );

    expect(chips).toHaveLength(9);
    expect(chips.find((c) => c.key === "keyword")?.value).toBe("maternidad");
    expect(chips.find((c) => c.key === "insurerId")?.value).toBe(
      "Aseguradora Alpha",
    );
  });

  it("counts active filters excluding default sort", () => {
    expect(countActiveFilters({ sort: "price_asc" })).toBe(0);
    expect(countActiveFilters({ age: 25, sort: "name_asc" })).toBe(2);
  });
});
