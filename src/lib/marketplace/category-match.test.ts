import { describe, expect, it } from "vitest";
import {
  getCategoryFallbackSignal,
  matchesCategoryFromClauses,
  matchesCategoryWithFallback,
} from "@/lib/marketplace/category-match";
import type { Plan, Tariff } from "@/lib/types/database";
import type { CoverageClause } from "@/lib/types/phase1";

const basePlan: Plan = {
  id: "p1",
  insurer_id: "i1",
  name: "Plan GMM Tarifa 10K",
  description: "producto=GMM; region=Sierra",
  coverage_summary: null,
  is_demo: false,
  created_at: "2025-01-01T00:00:00Z",
};

const maternidadPlan: Plan = {
  ...basePlan,
  name: "ConfiPlus Maternidad Sierra",
  description: "Incluye maternidad en red preferente",
};

const baseTariff: Tariff = {
  id: "t1",
  plan_id: "p1",
  age_min: 18,
  age_max: 65,
  gender: "any",
  region: "Sierra",
  monthly_price: 100,
  deductible: null,
  copay_pct: null,
  annual_limit: null,
  exclusions: null,
  is_demo: false,
  created_at: "2025-01-01T00:00:00Z",
};

const coveredClause: CoverageClause = {
  id: "c1",
  plan_version_id: "v1",
  category: "maternidad",
  title: "Maternidad",
  description: null,
  coverage_status: "covered",
  conditions: null,
  sort_order: 1,
  is_demo: false,
  created_at: "2025-01-01T00:00:00Z",
};

describe("matchesCategoryFromClauses", () => {
  it("matches covered clause categories", () => {
    expect(matchesCategoryFromClauses([coveredClause], "maternidad")).toBe(
      true,
    );
  });
});

describe("matchesCategoryWithFallback", () => {
  it("uses coverage clauses when present", () => {
    expect(
      matchesCategoryWithFallback(
        [coveredClause],
        "maternidad",
        basePlan,
        baseTariff,
      ),
    ).toBe(true);
  });

  it("does not wipe catalog for maternidad when clauses are empty and tariff has maternidad=Si", () => {
    expect(
      matchesCategoryWithFallback([], "maternidad", basePlan, {
        ...baseTariff,
        maternidad: "Si",
      }),
    ).toBe(true);
  });

  it("excludes plans with maternidad=No when filtering maternidad and clauses are empty", () => {
    expect(
      matchesCategoryWithFallback([], "maternidad", basePlan, {
        ...baseTariff,
        maternidad: "No",
      }),
    ).toBe(false);
  });

  it("falls back to plan text when clauses are empty", () => {
    expect(
      matchesCategoryWithFallback([], "maternidad", maternidadPlan, {
        ...baseTariff,
        maternidad: null,
      }),
    ).toBe(true);
  });

  it("keeps tariff-only rows when category signal is inconclusive", () => {
    expect(
      matchesCategoryWithFallback([], "hospitalizacion", basePlan, baseTariff),
    ).toBe(true);
  });
});

describe("getCategoryFallbackSignal", () => {
  it("returns inconclusive for sparse non-maternidad plans", () => {
    expect(
      getCategoryFallbackSignal(basePlan, baseTariff, "hospitalizacion"),
    ).toBe("inconclusive");
  });
});
