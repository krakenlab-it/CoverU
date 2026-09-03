import { describe, expect, it } from "vitest";
import {
  DEMO_INSURERS,
  DEMO_PLANS,
  DEMO_QUOTES,
  DEMO_ORG_ID,
  getDemoPlanVersionDetail,
  getDemoQuote,
} from "@/lib/demo-api-data";

describe("demo API data", () => {
  it("has valid UUID-format IDs for insurers", () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const insurer of DEMO_INSURERS) {
      expect(insurer.id).toMatch(uuidRegex);
      expect(insurer.is_demo).toBe(true);
      expect(insurer.name).toContain("[DEMO]");
    }
  });

  it("filters plans by insurer", () => {
    const alphaPlans = DEMO_PLANS.filter(
      (p) => p.insurer_id === DEMO_INSURERS[0].id,
    );
    expect(alphaPlans.length).toBe(2);
  });

  it("returns plan version detail with coverage clauses", () => {
    const detail = getDemoPlanVersionDetail(
      "d1000000-0000-4000-8000-000000000001",
    );
    expect(detail).not.toBeNull();
    expect(detail?.coverage_clauses.length).toBeGreaterThan(0);
    expect(detail?.citations.length).toBeGreaterThan(0);
  });

  it("enforces tenant isolation on quotes", () => {
    const quote = DEMO_QUOTES[0];
    expect(getDemoQuote(quote.id, DEMO_ORG_ID)).not.toBeNull();
    expect(
      getDemoQuote(quote.id, "00000000-0000-4000-8000-000000000099"),
    ).toBeNull();
  });
});
