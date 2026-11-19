import { describe, expect, it } from "vitest";
import {
  countsFromPlanConditions,
  describeConditionsVersion,
  planConditionsCounts,
} from "@/lib/quotes/conditions-version";
import { EMPTY_PLAN_CONDITIONS } from "@/lib/marketplace/plan-conditions";

const VERSION_ID = "d1000000-0000-4000-8000-000000000001";

describe("planConditionsCounts", () => {
  it("counts each condition family and the total", () => {
    const counts = planConditionsCounts({
      deductibles: [{}, {}],
      coinsurance: [{}],
      copays: [{}, {}, {}],
      paymentModalities: [{}],
      ceilings: [{}],
    });

    expect(counts).toEqual({
      deductibles: 2,
      coinsurance: 1,
      copays: 3,
      paymentModalities: 1,
      ceilings: 1,
      total: 8,
    });
  });

  it("treats missing or non-array payloads as zero rows", () => {
    expect(
      planConditionsCounts({
        deductibles: null,
        coinsurance: undefined,
        copays: { error: true },
        paymentModalities: "[]",
        ceilings: [],
      }),
    ).toEqual({
      deductibles: 0,
      coinsurance: 0,
      copays: 0,
      paymentModalities: 0,
      ceilings: 0,
      total: 0,
    });
  });
});

describe("describeConditionsVersion", () => {
  it("exposes the plan version as the conditions version", () => {
    const version = describeConditionsVersion(
      VERSION_ID,
      countsFromPlanConditions(EMPTY_PLAN_CONDITIONS),
    );

    expect(version.plan_conditions_version_id).toBe(VERSION_ID);
    expect(version.plan_version_id).toBe(VERSION_ID);
    expect(version.condition_counts.total).toBe(0);
  });
});

describe("countsFromPlanConditions", () => {
  it("counts a parsed conditions payload", () => {
    const counts = countsFromPlanConditions({
      ...EMPTY_PLAN_CONDITIONS,
      deductibles: [
        {
          id: "1",
          plan_version_id: VERSION_ID,
          scope: "individual",
          basis: "por_anio",
          amount: 100,
          notes: null,
          sort_order: 1,
          is_demo: true,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });

    expect(counts.deductibles).toBe(1);
    expect(counts.total).toBe(1);
  });
});
