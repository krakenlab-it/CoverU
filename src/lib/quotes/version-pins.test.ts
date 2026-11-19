import { describe, expect, it } from "vitest";
import {
  buildRequoteMetadata,
  diffQuoteVersionRefs,
  parseQuoteVersionRefs,
} from "@/lib/quotes/version-pins";
import type { Tariff } from "@/lib/types/database";
import type { PlanVersion, Quote } from "@/lib/types/phase1";

const TARIFF: Tariff = {
  id: "c0000000-0000-4000-8000-000000000001",
  plan_id: "b0000000-0000-4000-8000-000000000001",
  plan_version_id: "d1000000-0000-4000-8000-000000000001",
  age_min: 18,
  age_max: 65,
  gender: "femenino",
  region: "Sierra",
  monthly_price: 92.5,
  deductible: 500,
  copay_pct: 20,
  annual_limit: 10000,
  exclusions: [],
  is_demo: false,
  created_at: "2026-01-01T00:00:00Z",
};

const VERSION: PlanVersion = {
  id: "d1000000-0000-4000-8000-000000000001",
  plan_id: "b0000000-0000-4000-8000-000000000001",
  version_number: 1,
  label: "[DEMO] v1",
  status: "published",
  effective_from: "2026-01-01",
  effective_to: null,
  published_at: "2026-01-01T00:00:00Z",
  changelog: null,
  is_demo: true,
  created_at: "2026-01-01T00:00:00Z",
};

function buildQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "e9000000-0000-4000-8000-000000000001",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    plan_version_id: VERSION.id,
    tariff_id: TARIFF.id,
    tariff_version_id: TARIFF.id,
    plan_conditions_version_id: VERSION.id,
    external_ref: "DEMO-QUOTE-001",
    status: "active",
    age: 30,
    gender: "femenino",
    region: "Sierra",
    monthly_price: TARIFF.monthly_price,
    metadata: { label: "quote" },
    expires_at: null,
    is_demo: true,
    created_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("parseQuoteVersionRefs", () => {
  it("reads both pins", () => {
    expect(
      parseQuoteVersionRefs({
        tariff_version_id: TARIFF.id,
        plan_conditions_version_id: VERSION.id,
      }),
    ).toEqual({
      tariffVersionId: TARIFF.id,
      conditionsVersionId: VERSION.id,
    });
  });

  it("keeps legacy rows with null pins valid", () => {
    expect(
      parseQuoteVersionRefs({
        tariff_version_id: null,
        plan_conditions_version_id: null,
      }),
    ).toEqual({ tariffVersionId: null, conditionsVersionId: null });
  });

  it("rejects rows whose pins are not UUIDs", () => {
    expect(
      parseQuoteVersionRefs({
        tariff_version_id: "not-a-uuid",
        plan_conditions_version_id: VERSION.id,
      }),
    ).toBeNull();
  });
});

describe("diffQuoteVersionRefs", () => {
  it("reports no change when the catalog is unchanged", () => {
    const change = diffQuoteVersionRefs(buildQuote(), {
      tariff: TARIFF,
      version: VERSION,
    });

    expect(change).toMatchObject({
      changed: false,
      tariffChanged: false,
      conditionsChanged: false,
      priceChanged: false,
    });
  });

  it("detects a tariff price bump without a row change", () => {
    const repriced: Tariff = { ...TARIFF, monthly_price: 101.75 };
    const change = diffQuoteVersionRefs(buildQuote(), {
      tariff: repriced,
      version: VERSION,
    });

    expect(change.changed).toBe(true);
    expect(change.priceChanged).toBe(true);
    expect(change.tariffChanged).toBe(false);
    expect(change.next.monthlyPrice).toBe(101.75);
    expect(change.previous.monthlyPrice).toBe(92.5);
  });

  it("detects a new tariff row from a reload", () => {
    const reloaded: Tariff = {
      ...TARIFF,
      id: "c0000000-0000-4000-8000-0000000000ff",
    };
    const change = diffQuoteVersionRefs(buildQuote(), {
      tariff: reloaded,
      version: VERSION,
    });

    expect(change.tariffChanged).toBe(true);
    expect(change.conditionsChanged).toBe(false);
  });

  it("detects a conditions version bump", () => {
    const nextVersion: PlanVersion = {
      ...VERSION,
      id: "d1000000-0000-4000-8000-000000000002",
      version_number: 2,
    };
    const change = diffQuoteVersionRefs(buildQuote(), {
      tariff: TARIFF,
      version: nextVersion,
    });

    expect(change.conditionsChanged).toBe(true);
    expect(change.next.conditionsVersionId).toBe(nextVersion.id);
  });

  it("treats a legacy unpinned quote as changed", () => {
    const legacy = buildQuote({
      tariff_version_id: null,
      plan_conditions_version_id: null,
    });
    const change = diffQuoteVersionRefs(legacy, {
      tariff: TARIFF,
      version: VERSION,
    });

    expect(change.changed).toBe(true);
    expect(change.tariffChanged).toBe(true);
    expect(change.conditionsChanged).toBe(true);
  });
});

describe("buildRequoteMetadata", () => {
  it("keeps the old pins, price and original quote reference", () => {
    const previous = buildQuote({ monthly_price: 5000 });
    const repriced: Tariff = { ...TARIFF, monthly_price: 110 };
    const change = diffQuoteVersionRefs(previous, {
      tariff: repriced,
      version: VERSION,
    });

    const metadata = buildRequoteMetadata(previous, change);

    expect(metadata.re_quote_of).toBe(previous.id);
    expect(metadata.label).toBe("quote");
    expect(metadata.previous_versions).toEqual({
      tariff_version_id: TARIFF.id,
      plan_conditions_version_id: VERSION.id,
      monthly_price: 5000,
    });
    expect(metadata.version_bump).toEqual({
      tariff_changed: false,
      conditions_changed: false,
      price_changed: true,
    });
  });
});
