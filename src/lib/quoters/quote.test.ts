import { describe, expect, it } from "vitest";
import {
  buildQuotesFromCatalog,
  isQuoteAge,
  isQuoteGender,
  selectPlanTariffs,
  type CatalogQuoteInput,
} from "@/lib/quoters/quote";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";

const INSURER_BMI: Insurer = {
  id: "ins-bmi",
  name: "BMI",
  slug: "bmi",
  logo_url: "/insurers/bmi.png",
  is_demo: false,
  created_at: "2026-09-03T17:36:27Z",
};

const INSURER_OTRO: Insurer = {
  id: "ins-otro",
  name: "Otra",
  slug: "otra",
  logo_url: null,
  is_demo: false,
  created_at: "2026-09-03T17:36:27Z",
};

function plan(overrides: Partial<Plan> & Pick<Plan, "id">): Plan {
  return {
    insurer_id: INSURER_BMI.id,
    name: "Plan de prueba",
    description: null,
    coverage_summary: null,
    is_demo: false,
    created_at: "2026-09-03T17:36:27Z",
    ...overrides,
  };
}

function tariff(overrides: Partial<Tariff> & Pick<Tariff, "id" | "plan_id">): Tariff {
  return {
    age_min: 18,
    age_max: 99,
    gender: "any",
    region: "Nacional",
    monthly_price: 100,
    deductible: 5000,
    copay_pct: null,
    annual_limit: 50000,
    exclusions: null,
    grupo_asegurado: "titular",
    is_demo: false,
    created_at: "2026-09-03T17:36:27Z",
    ...overrides,
  };
}

function catalog(overrides: Partial<CatalogQuoteInput> = {}): CatalogQuoteInput {
  return {
    insurers: [INSURER_BMI],
    plans: [plan({ id: "plan-1", name: "Plan 1" })],
    tariffs: [tariff({ id: "t-1", plan_id: "plan-1" })],
    ...overrides,
  };
}

describe("quote guards", () => {
  it("accepts only the two selectable genders", () => {
    expect(isQuoteGender("femenino")).toBe(true);
    expect(isQuoteGender("masculino")).toBe(true);
    expect(isQuoteGender("any")).toBe(false);
    expect(isQuoteGender("otro")).toBe(false);
  });

  it("bounds quotable ages", () => {
    expect(isQuoteAge(18)).toBe(true);
    expect(isQuoteAge(99)).toBe(true);
    expect(isQuoteAge(17)).toBe(false);
    expect(isQuoteAge(100)).toBe(false);
    expect(isQuoteAge(30.5)).toBe(false);
  });
});

describe("selectPlanTariffs", () => {
  it("prefers the requested region over a national row", () => {
    const selected = selectPlanTariffs(
      [
        tariff({ id: "nacional", plan_id: "plan-1", region: "Nacional", monthly_price: 90 }),
        tariff({ id: "sierra", plan_id: "plan-1", region: "Sierra", monthly_price: 120 }),
      ],
      { age: 30, gender: "femenino", region: "Sierra" },
    );

    expect(selected.get("plan-1")?.tariff.id).toBe("sierra");
  });

  it("falls back to a national row when the region has no prices", () => {
    const selected = selectPlanTariffs(
      [tariff({ id: "nacional", plan_id: "plan-1", region: "Nacional" })],
      { age: 30, gender: "femenino", region: "Costa" },
    );

    expect(selected.get("plan-1")?.tariff.id).toBe("nacional");
  });

  it("rejects rows priced for another region", () => {
    const selected = selectPlanTariffs(
      [tariff({ id: "austro", plan_id: "plan-1", region: "Austro" })],
      { age: 30, gender: "femenino", region: "Costa" },
    );

    expect(selected.size).toBe(0);
  });

  it("prefers a gender-specific row over an any row at the same price", () => {
    const selected = selectPlanTariffs(
      [
        tariff({ id: "any", plan_id: "plan-1", gender: "any", monthly_price: 100 }),
        tariff({ id: "fem", plan_id: "plan-1", gender: "femenino", monthly_price: 100 }),
      ],
      { age: 30, gender: "femenino", region: "Nacional" },
    );

    expect(selected.get("plan-1")?.tariff.id).toBe("fem");
  });

  it("breaks ties on the lowest monthly price", () => {
    const selected = selectPlanTariffs(
      [
        tariff({ id: "caro", plan_id: "plan-1", gender: "any", monthly_price: 140 }),
        tariff({ id: "barato", plan_id: "plan-1", gender: "any", monthly_price: 110 }),
      ],
      { age: 30, gender: "masculino", region: "Nacional" },
    );

    expect(selected.get("plan-1")?.tariff.id).toBe("barato");
  });

  it("skips age bands that do not contain the requested age", () => {
    const selected = selectPlanTariffs(
      [tariff({ id: "joven", plan_id: "plan-1", age_min: 18, age_max: 23 })],
      { age: 40, gender: "femenino", region: "Nacional" },
    );

    expect(selected.size).toBe(0);
  });

  it("skips child-only rows and load-blocked rows", () => {
    const selected = selectPlanTariffs(
      [
        tariff({ id: "nino", plan_id: "plan-1", grupo_asegurado: "nino_solo" }),
        tariff({ id: "bloqueada", plan_id: "plan-2", load_blocked: true }),
      ],
      { age: 30, gender: "femenino", region: "Nacional" },
    );

    expect(selected.size).toBe(0);
  });

  it("keeps the cheapest plan per plan when several age bands match", () => {
    const selected = selectPlanTariffs(
      [
        tariff({ id: "a", plan_id: "plan-1", age_min: 24, age_max: 31, monthly_price: 130 }),
        tariff({ id: "b", plan_id: "plan-1", age_min: 32, age_max: 49, monthly_price: 160 }),
      ],
      { age: 31, gender: "femenino", region: "Nacional" },
    );

    expect(selected.get("plan-1")?.tariff.id).toBe("a");
  });
});

describe("buildQuotesFromCatalog", () => {
  it("sorts offers cheapest first and reports the source", () => {
    const result = buildQuotesFromCatalog(
      catalog({
        plans: [
          plan({ id: "plan-1", name: "Caro" }),
          plan({ id: "plan-2", name: "Barato" }),
        ],
        tariffs: [
          tariff({ id: "t-1", plan_id: "plan-1", monthly_price: 200 }),
          tariff({ id: "t-2", plan_id: "plan-2", monthly_price: 80 }),
        ],
      }),
      { age: 30, gender: "femenino", region: "Nacional" },
      "bundled-catalog",
    );

    expect(result.offers.map((offer) => offer.planId)).toEqual([
      "plan-2",
      "plan-1",
    ]);
    expect(result.totalOffers).toBe(2);
    expect(result.source).toBe("bundled-catalog");
  });

  it("quotes one offer per plan even with several matching rows", () => {
    const result = buildQuotesFromCatalog(
      catalog({
        tariffs: [
          tariff({ id: "t-1", plan_id: "plan-1", gender: "any", monthly_price: 120 }),
          tariff({ id: "t-2", plan_id: "plan-1", gender: "femenino", monthly_price: 110 }),
          tariff({
            id: "t-3",
            plan_id: "plan-1",
            region: "Sierra",
            monthly_price: 90,
          }),
        ],
      }),
      { age: 30, gender: "femenino", region: "Sierra" },
      "supabase",
    );

    expect(result.offers).toHaveLength(1);
    expect(result.offers[0]?.monthlyPrice).toBe(90);
  });

  it("drops plans whose status is not active", () => {
    const result = buildQuotesFromCatalog(
      catalog({ plans: [plan({ id: "plan-1", status: "archived" })] }),
      { age: 30, gender: "femenino", region: "Nacional" },
      "supabase",
    );

    expect(result.offers).toHaveLength(0);
  });

  it("drops offers whose insurer is missing from the catalog payload", () => {
    const result = buildQuotesFromCatalog(
      catalog({
        plans: [plan({ id: "plan-1", insurer_id: INSURER_OTRO.id })],
      }),
      { age: 30, gender: "femenino", region: "Nacional" },
      "supabase",
    );

    expect(result.offers).toHaveLength(0);
  });

  it("marks demo rows and keeps real rows unmarked", () => {
    const result = buildQuotesFromCatalog(
      catalog({
        plans: [
          plan({ id: "plan-1", name: "Real" }),
          plan({ id: "plan-2", name: "Demo", is_demo: true }),
        ],
        tariffs: [
          tariff({ id: "t-1", plan_id: "plan-1" }),
          tariff({ id: "t-2", plan_id: "plan-2", is_demo: true }),
        ],
      }),
      { age: 30, gender: "femenino", region: "Nacional" },
      "supabase",
    );

    const byId = new Map(result.offers.map((offer) => [offer.planId, offer]));
    expect(byId.get("plan-1")?.isDemo).toBe(false);
    expect(byId.get("plan-2")?.isDemo).toBe(true);
  });

  it("carries the tariff dimensions the card renders", () => {
    const result = buildQuotesFromCatalog(
      catalog({
        tariffs: [
          tariff({
            id: "t-1",
            plan_id: "plan-1",
            region: "Costa",
            age_min: 24,
            age_max: 31,
            gender: "femenino",
            deductible: 2500,
            annual_limit: 120000,
          }),
        ],
      }),
      { age: 30, gender: "femenino", region: "Costa" },
      "supabase",
    );

    expect(result.offers[0]).toMatchObject({
      region: "Costa",
      ageMin: 24,
      ageMax: 31,
      gender: "femenino",
      deductible: 2500,
      annualLimit: 120000,
      insurerName: "BMI",
      insurerSlug: "bmi",
    });
  });
});
