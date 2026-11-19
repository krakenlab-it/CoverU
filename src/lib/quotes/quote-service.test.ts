import { describe, expect, it } from "vitest";
import {
  buildQuoteInsert,
  createQuote,
  quoteCreateSchema,
  selectQuoteTariff,
  type QuoteCatalogPort,
  type QuoteInsertRow,
} from "@/lib/quotes/quote-service";
import type { Tariff } from "@/lib/types/database";
import type { PlanVersion, Quote } from "@/lib/types/phase1";

const ORG_ID = "d0000000-0000-4000-8000-000000000001";
const OTHER_ORG_ID = "d0000000-0000-4000-8000-000000000002";
const VERSION_ID = "d1000000-0000-4000-8000-000000000001";
const NEXT_VERSION_ID = "d1000000-0000-4000-8000-000000000002";
const PLAN_ID = "b0000000-0000-4000-8000-000000000001";
const TARIFF_ID = "c0000000-0000-4000-8000-000000000001";
const RELOADED_TARIFF_ID = "c0000000-0000-4000-8000-0000000000ff";

const VERSION: PlanVersion = {
  id: VERSION_ID,
  plan_id: PLAN_ID,
  version_number: 1,
  label: "v1",
  status: "published",
  effective_from: "2026-01-01",
  effective_to: null,
  published_at: "2026-01-01T00:00:00Z",
  changelog: null,
  is_demo: false,
  created_at: "2026-01-01T00:00:00Z",
};

const TARIFF: Tariff = {
  id: TARIFF_ID,
  plan_id: PLAN_ID,
  plan_version_id: VERSION_ID,
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

function buildQuoteRow(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "e9000000-0000-4000-8000-000000000001",
    organization_id: ORG_ID,
    plan_version_id: VERSION_ID,
    tariff_id: TARIFF_ID,
    tariff_version_id: TARIFF_ID,
    plan_conditions_version_id: VERSION_ID,
    external_ref: null,
    status: "active",
    age: 30,
    gender: "femenino",
    region: "Sierra",
    monthly_price: TARIFF.monthly_price,
    metadata: {},
    expires_at: null,
    is_demo: false,
    created_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

interface FakeCatalogOptions {
  version?: PlanVersion | null;
  tariffs?: Tariff[];
  previousQuote?: Quote | null;
}

function fakeCatalog(options: FakeCatalogOptions = {}): {
  port: QuoteCatalogPort;
  inserted: QuoteInsertRow[];
} {
  const inserted: QuoteInsertRow[] = [];
  const version = options.version === undefined ? VERSION : options.version;
  const tariffs = options.tariffs ?? [TARIFF];
  const previousQuote = options.previousQuote ?? null;

  const port: QuoteCatalogPort = {
    async getPlanVersion(id) {
      if (!version || version.id !== id) return null;
      return version;
    },
    async listTariffs() {
      return tariffs;
    },
    async getQuote(id) {
      return previousQuote && previousQuote.id === id ? previousQuote : null;
    },
    async insertQuote(row) {
      inserted.push(row);
      return buildQuoteRow({
        plan_version_id: row.plan_version_id,
        tariff_id: row.tariff_id,
        tariff_version_id: row.tariff_version_id,
        plan_conditions_version_id: row.plan_conditions_version_id,
        monthly_price: row.monthly_price,
        metadata: row.metadata,
      });
    },
  };

  return { port, inserted };
}

describe("quoteCreateSchema", () => {
  it("accepts the minimal payload", () => {
    const parsed = quoteCreateSchema.safeParse({
      plan_version_id: VERSION_ID,
      age: 30,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-UUID plan version and an out-of-range age", () => {
    expect(
      quoteCreateSchema.safeParse({ plan_version_id: "pv-1", age: 30 }).success,
    ).toBe(false);
    expect(
      quoteCreateSchema.safeParse({ plan_version_id: VERSION_ID, age: 200 })
        .success,
    ).toBe(false);
  });

  it("rejects a region outside the tariff matrix", () => {
    expect(
      quoteCreateSchema.safeParse({
        plan_version_id: VERSION_ID,
        age: 30,
        region: "metropolitana",
      }).success,
    ).toBe(false);
  });
});

describe("selectQuoteTariff", () => {
  it("picks the tariff row matching age, gender and region", () => {
    const selected = selectQuoteTariff(
      [TARIFF, { ...TARIFF, id: RELOADED_TARIFF_ID, age_min: 66, age_max: 99 }],
      { age: 30, gender: "femenino", region: "Sierra" },
    );
    expect(selected?.id).toBe(TARIFF_ID);
  });

  it("returns null when nothing matches", () => {
    expect(
      selectQuoteTariff([TARIFF], { age: 10, gender: "femenino", region: "Sierra" }),
    ).toBeNull();
  });
});

describe("createQuote", () => {
  it("pins the tariff row and conditions version on a new quote", async () => {
    const { port, inserted } = fakeCatalog();

    const result = await createQuote(port, ORG_ID, {
      plan_version_id: VERSION_ID,
      age: 30,
      gender: "femenino",
      region: "Sierra",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.versionChange).toBeNull();
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      organization_id: ORG_ID,
      plan_version_id: VERSION_ID,
      tariff_id: TARIFF_ID,
      tariff_version_id: TARIFF_ID,
      plan_conditions_version_id: VERSION_ID,
      monthly_price: TARIFF.monthly_price,
      status: "active",
      is_demo: false,
    });
    expect(result.quote.tariff_version_id).toBe(TARIFF_ID);
    expect(result.quote.plan_conditions_version_id).toBe(VERSION_ID);
  });

  it("404s for an unknown or unpublished plan version", async () => {
    const missing = fakeCatalog({ version: null });
    const unpublished = fakeCatalog({
      version: { ...VERSION, status: "draft" },
    });

    const missingResult = await createQuote(missing.port, ORG_ID, {
      plan_version_id: VERSION_ID,
      age: 30,
    });
    const draftResult = await createQuote(unpublished.port, ORG_ID, {
      plan_version_id: VERSION_ID,
      age: 30,
    });

    expect(missingResult).toMatchObject({ ok: false, status: 404 });
    expect(draftResult).toMatchObject({ ok: false, status: 404 });
    expect(draftResult.ok === false && draftResult.message).toContain(
      "no publicada",
    );
  });

  it("422s when no tariff covers the requested profile", async () => {
    const { port, inserted } = fakeCatalog();

    const result = await createQuote(port, ORG_ID, {
      plan_version_id: VERSION_ID,
      age: 10,
      gender: "femenino",
      region: "Sierra",
    });

    expect(result).toMatchObject({ ok: false, status: 422, code: "tariff_not_found" });
    expect(inserted).toHaveLength(0);
  });

  describe("re-quoting after a version bump", () => {
    it("records the bump and leaves the original quote untouched", async () => {
      const previous = buildQuoteRow({
        monthly_price: 5000,
        metadata: { label: "original" },
      });
      const reloaded: Tariff = {
        ...TARIFF,
        id: RELOADED_TARIFF_ID,
        monthly_price: 118.25,
      };
      const { port, inserted } = fakeCatalog({
        tariffs: [reloaded],
        previousQuote: previous,
      });

      const result = await createQuote(port, ORG_ID, {
        plan_version_id: VERSION_ID,
        age: 30,
        gender: "femenino",
        region: "Sierra",
        requote_of: previous.id,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.versionChange).toMatchObject({
        changed: true,
        tariffChanged: true,
        priceChanged: true,
        conditionsChanged: false,
        previous: { monthlyPrice: 5000 },
        next: { monthlyPrice: 118.25 },
      });

      const row = inserted[0];
      expect(row.tariff_version_id).toBe(RELOADED_TARIFF_ID);
      expect(row.monthly_price).toBe(118.25);
      expect(row.metadata).toMatchObject({
        source: "api_v1_requote",
        re_quote_of: previous.id,
        previous_versions: {
          tariff_version_id: previous.tariff_version_id,
          plan_conditions_version_id: previous.plan_conditions_version_id,
          monthly_price: 5000,
        },
        version_bump: {
          tariff_changed: true,
          conditions_changed: false,
          price_changed: true,
        },
      });

      // The stored original keeps its own pins and price.
      expect(previous.tariff_version_id).toBe(TARIFF_ID);
      expect(previous.monthly_price).toBe(5000);
    });

    it("reproduces the quote when the catalog did not change", async () => {
      const previous = buildQuoteRow();
      const { port, inserted } = fakeCatalog({ previousQuote: previous });

      const result = await createQuote(port, ORG_ID, {
        plan_version_id: VERSION_ID,
        age: 30,
        gender: "femenino",
        region: "Sierra",
        requote_of: previous.id,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.versionChange).toMatchObject({
        changed: false,
        tariffChanged: false,
        conditionsChanged: false,
        priceChanged: false,
      });
      expect(inserted[0].monthly_price).toBe(previous.monthly_price);
      expect(inserted[0].tariff_version_id).toBe(previous.tariff_version_id);
    });

    it("detects a conditions-version bump", async () => {
      const previous = buildQuoteRow();
      const nextVersion: PlanVersion = {
        ...VERSION,
        id: NEXT_VERSION_ID,
        version_number: 2,
      };
      const { port, inserted } = fakeCatalog({
        version: nextVersion,
        tariffs: [{ ...TARIFF, plan_version_id: NEXT_VERSION_ID }],
        previousQuote: previous,
      });

      const result = await createQuote(port, ORG_ID, {
        plan_version_id: NEXT_VERSION_ID,
        age: 30,
        gender: "femenino",
        region: "Sierra",
        requote_of: previous.id,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.versionChange?.conditionsChanged).toBe(true);
      expect(inserted[0].plan_conditions_version_id).toBe(NEXT_VERSION_ID);
    });

    it("404s when the source quote belongs to another tenant", async () => {
      const previous = buildQuoteRow({ organization_id: OTHER_ORG_ID });
      const { port, inserted } = fakeCatalog({ previousQuote: previous });

      const result = await createQuote(port, ORG_ID, {
        plan_version_id: VERSION_ID,
        age: 30,
        requote_of: previous.id,
      });

      expect(result).toMatchObject({ ok: false, status: 404 });
      expect(inserted).toHaveLength(0);
    });

    it("404s when the source quote is closed", async () => {
      const previous = buildQuoteRow({ status: "accepted" });
      const { port, inserted } = fakeCatalog({ previousQuote: previous });

      const result = await createQuote(port, ORG_ID, {
        plan_version_id: VERSION_ID,
        age: 30,
        requote_of: previous.id,
      });

      expect(result).toMatchObject({ ok: false, status: 404 });
      expect(inserted).toHaveLength(0);
    });
  });
});

describe("buildQuoteInsert", () => {
  it("writes the pricing snapshot next to the version pins", () => {
    const row = buildQuoteInsert(
      ORG_ID,
      VERSION,
      TARIFF,
      { plan_version_id: VERSION_ID, age: 30, external_ref: "REF-1" },
    );

    expect(row.metadata).toMatchObject({
      source: "api_v1",
      versions: {
        tariff_version_id: TARIFF_ID,
        plan_conditions_version_id: VERSION_ID,
      },
      pricing_snapshot: {
        tariff_id: TARIFF_ID,
        monthly_price: 92.5,
        age_min: 18,
        age_max: 65,
        region: "Sierra",
        deductible: 500,
        annual_limit: 10000,
      },
    });
    expect(row.external_ref).toBe("REF-1");
  });
});
