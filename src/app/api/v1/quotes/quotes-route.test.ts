import { describe, expect, it, vi } from "vitest";

const catalog = vi.hoisted(() => ({
  getPlanVersion: vi.fn(),
  listTariffs: vi.fn(),
  getQuote: vi.fn(),
  insertQuote: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseAdminConfigured: () => true,
}));

vi.mock("@/lib/api/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/auth")>(
    "@/lib/api/auth",
  );
  return {
    ...actual,
    authenticateApiKey: async () => ({
      ok: true,
      context: {
        apiKeyId: "key-1",
        apiClientId: "client-1",
        organizationId: ORG_ID,
        scopes: ["read:catalog", "read:quotes", "write:quotes"],
        isDemo: false,
      },
    }),
  };
});

vi.mock("@/lib/api/usage-log", () => ({
  logApiUsage: async () => undefined,
}));

vi.mock("@/lib/quotes/supabase-quote-catalog", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/quotes/supabase-quote-catalog")
  >("@/lib/quotes/supabase-quote-catalog");
  return {
    ...actual,
    createQuoteCatalog: () => catalog,
  };
});

const ORG_ID = "d0000000-0000-4000-8000-000000000001";
const VERSION_ID = "d1000000-0000-4000-8000-000000000001";
const PLAN_ID = "b0000000-0000-4000-8000-000000000001";
const TARIFF_ID = "c0000000-0000-4000-8000-000000000001";

const VERSION = {
  id: VERSION_ID,
  plan_id: PLAN_ID,
  version_number: 1,
  label: "v1",
  status: "published" as const,
  effective_from: null,
  effective_to: null,
  published_at: "2026-01-01T00:00:00Z",
  changelog: null,
  is_demo: false,
  created_at: "2026-01-01T00:00:00Z",
};

const TARIFF = {
  id: TARIFF_ID,
  plan_id: PLAN_ID,
  plan_version_id: VERSION_ID,
  age_min: 18,
  age_max: 65,
  gender: "femenino" as const,
  region: "Sierra" as const,
  monthly_price: 92.5,
  deductible: 500,
  copay_pct: 20,
  annual_limit: 10000,
  exclusions: [],
  is_demo: false,
  created_at: "2026-01-01T00:00:00Z",
};

const STORED_QUOTE = {
  id: "e9000000-0000-4000-8000-000000000001",
  organization_id: ORG_ID,
  plan_version_id: VERSION_ID,
  tariff_id: TARIFF_ID,
  tariff_version_id: TARIFF_ID,
  plan_conditions_version_id: VERSION_ID,
  external_ref: null,
  status: "active" as const,
  age: 30,
  gender: "femenino",
  region: "Sierra",
  monthly_price: 92.5,
  metadata: {},
  expires_at: null,
  is_demo: false,
  created_at: "2026-01-02T00:00:00Z",
};

function quoteRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "cov_test_key_1234567890abcdef",
    },
    body: JSON.stringify(body),
  });
}

async function loadRoute() {
  return import("@/app/api/v1/quotes/route");
}

describe("POST /api/v1/quotes", () => {
  it("creates a quote with both version pins", async () => {
    catalog.getPlanVersion.mockResolvedValue(VERSION);
    catalog.listTariffs.mockResolvedValue([TARIFF]);
    catalog.insertQuote.mockResolvedValue(STORED_QUOTE);

    const { POST } = await loadRoute();
    const response = await POST(
      quoteRequest({ plan_version_id: VERSION_ID, age: 30, gender: "femenino" }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.quote.tariff_version_id).toBe(TARIFF_ID);
    expect(body.data.quote.plan_conditions_version_id).toBe(VERSION_ID);
    expect(body.data.versions).toEqual({
      plan_version_id: VERSION_ID,
      plan_conditions_version_id: VERSION_ID,
      tariff_version_id: TARIFF_ID,
    });
    expect(body.data.re_quote).toBeNull();
  });

  it("returns the version change when re-quoting", async () => {
    catalog.getPlanVersion.mockResolvedValue(VERSION);
    catalog.listTariffs.mockResolvedValue([
      { ...TARIFF, id: "c0000000-0000-4000-8000-0000000000ff", monthly_price: 118.25 },
    ]);
    catalog.getQuote.mockResolvedValue({
      ...STORED_QUOTE,
      monthly_price: 5000,
    });
    catalog.insertQuote.mockImplementation(async (row: { monthly_price: number }) => ({
      ...STORED_QUOTE,
      tariff_version_id: "c0000000-0000-4000-8000-0000000000ff",
      monthly_price: row.monthly_price,
    }));

    const { POST } = await loadRoute();
    const response = await POST(
      quoteRequest({
        plan_version_id: VERSION_ID,
        age: 30,
        requote_of: STORED_QUOTE.id,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.re_quote).toMatchObject({
      changed: true,
      tariffChanged: true,
      priceChanged: true,
      previous: { monthlyPrice: 5000 },
      next: { monthlyPrice: 118.25 },
    });
  });

  it("rejects an invalid payload", async () => {
    const { POST } = await loadRoute();
    const response = await POST(quoteRequest({ plan_version_id: "nope", age: 30 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("validation_error");
  });

  it("rejects invalid JSON", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/v1/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "cov_test_key_1234567890abcdef",
        },
        body: "{not json",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the plan version is unknown", async () => {
    catalog.getPlanVersion.mockResolvedValue(null);

    const { POST } = await loadRoute();
    const response = await POST(quoteRequest({ plan_version_id: VERSION_ID, age: 30 }));

    expect(response.status).toBe(404);
  });

  it("returns 422 when no tariff covers the profile", async () => {
    catalog.getPlanVersion.mockResolvedValue(VERSION);
    catalog.listTariffs.mockResolvedValue([TARIFF]);

    const { POST } = await loadRoute();
    const response = await POST(
      quoteRequest({ plan_version_id: VERSION_ID, age: 10, gender: "masculino" }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("tariff_not_found");
  });
});
