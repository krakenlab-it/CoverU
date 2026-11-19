import { describe, expect, it } from "vitest";
import { toQuoteRow } from "@/lib/quotes/supabase-quote-catalog";

const VERSION_ID = "d1000000-0000-4000-8000-000000000001";
const TARIFF_ID = "c0000000-0000-4000-8000-000000000001";
const ORG_ID = "d0000000-0000-4000-8000-000000000001";

describe("toQuoteRow", () => {
  it("maps a pinned quote, including NUMERIC values serialized as strings", () => {
    const quote = toQuoteRow({
      id: "q1",
      organization_id: ORG_ID,
      plan_version_id: VERSION_ID,
      tariff_id: TARIFF_ID,
      tariff_version_id: TARIFF_ID,
      plan_conditions_version_id: VERSION_ID,
      external_ref: "REF-1",
      status: "active",
      age: 30,
      gender: "femenino",
      region: "Sierra",
      monthly_price: "92.50",
      metadata: { source: "api_v1" },
      expires_at: null,
      is_demo: false,
      created_at: "2026-01-02T00:00:00Z",
    });

    expect(quote).toMatchObject({
      id: "q1",
      tariff_version_id: TARIFF_ID,
      plan_conditions_version_id: VERSION_ID,
      monthly_price: 92.5,
      metadata: { source: "api_v1" },
    });
  });

  it("keeps a legacy quote without pins readable", () => {
    const quote = toQuoteRow({
      id: "q2",
      organization_id: null,
      plan_version_id: VERSION_ID,
      tariff_id: null,
      tariff_version_id: null,
      plan_conditions_version_id: null,
      status: "expired",
      age: null,
      monthly_price: null,
      metadata: null,
      created_at: "2025-01-02T00:00:00Z",
    });

    expect(quote.tariff_version_id).toBeNull();
    expect(quote.plan_conditions_version_id).toBeNull();
    expect(quote.organization_id).toBeNull();
    expect(quote.monthly_price).toBeNull();
    expect(quote.metadata).toEqual({});
  });
});
