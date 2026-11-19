import { afterEach, describe, expect, it, vi } from "vitest";

const ORG_ID = "d0000000-0000-4000-8000-000000000001";
const QUOTE_ID = "c0000000-0000-4000-8000-000000000001";

interface QuoteRow {
  id: string;
  organization_id: string | null;
}

interface SupabaseOptions {
  quote: QuoteRow | null;
  /** Simulates the funnel insert failing at the database or the network layer. */
  funnelInsert?: () => Promise<{ error: { message: string } | null }>;
}

/**
 * Minimal PostgREST double: `quotes` answers the read, `funnel_events` records
 * inserts. Every other table is unreachable because authentication and the rate
 * limiter are mocked — an unexpected call throws instead of passing silently.
 */
function createSupabase({ quote, funnelInsert }: SupabaseOptions) {
  const funnelRows: Record<string, unknown>[] = [];

  const quotesQuery = {
    select: () => quotesQuery,
    eq: () => quotesQuery,
    maybeSingle: async () => ({ data: quote, error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === "quotes") return quotesQuery;
    if (table === "funnel_events") {
      return {
        insert: async (row: Record<string, unknown>) => {
          if (funnelInsert) return funnelInsert();
          funnelRows.push(row);
          return { error: null };
        },
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  return { supabase: { from }, funnelRows };
}

function loadRoute(options: SupabaseOptions) {
  const { supabase, funnelRows } = createSupabase(options);

  vi.resetModules();
  vi.doMock("@/lib/supabase/admin", () => ({
    createAdminClient: () => supabase,
  }));
  vi.doMock("@/lib/supabase/config", () => ({
    isSupabaseAdminConfigured: () => true,
    isSupabaseAuthConfigured: () => false,
  }));
  vi.doMock("@/lib/api/auth", () => ({
    authenticateApiKey: async () => ({
      ok: true,
      context: {
        apiKeyId: "k0000000-0000-4000-8000-000000000001",
        apiClientId: "a0000000-0000-4000-8000-000000000001",
        organizationId: ORG_ID,
        scopes: ["read:quotes"],
        isDemo: false,
      },
    }),
    requireScope: () => null,
  }));
  vi.doMock("@/lib/settings/rate-limits", () => ({
    getEffectiveRateLimit: async () => ({ limit: 100, windowMs: 60_000 }),
  }));
  vi.doMock("@/lib/api/usage-log", () => ({
    logApiUsage: async () => undefined,
    insertUsageLog: async () => undefined,
    logSessionApiUsage: async () => undefined,
  }));

  return { funnelRows, route: import("@/app/api/v1/quotes/route") };
}

function authedRequest(): Request {
  return new Request(`http://localhost/api/v1/quotes?id=${QUOTE_ID}`, {
    headers: { "X-API-Key": "cov_test_key_1234567890abcdef" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/admin");
  vi.doUnmock("@/lib/supabase/config");
  vi.doUnmock("@/lib/api/auth");
  vi.doUnmock("@/lib/settings/rate-limits");
  vi.doUnmock("@/lib/api/usage-log");
  vi.resetModules();
});

describe("GET /api/v1/quotes — funnel events", () => {
  it("records the quote step attributed to the calling organization", async () => {
    const { funnelRows, route } = loadRoute({
      quote: { id: QUOTE_ID, organization_id: ORG_ID },
    });
    const { GET } = await route;

    const response = await GET(authedRequest());

    expect(response.status).toBe(200);
    expect(funnelRows).toEqual([
      {
        organization_id: ORG_ID,
        step: "quote",
        source: "api",
        lead_intent: null,
        offer_count: null,
      },
    ]);
  });

  it("emits no event for a quote outside the caller's organization", async () => {
    const { funnelRows, route } = loadRoute({
      quote: {
        id: QUOTE_ID,
        organization_id: "d0000000-0000-4000-8000-0000000000ff",
      },
    });
    const { GET } = await route;

    const response = await GET(authedRequest());

    expect(response.status).toBe(404);
    expect(funnelRows).toHaveLength(0);
  });

  it("never sends the quote body or a health field to the event table", async () => {
    const { funnelRows, route } = loadRoute({
      quote: { id: QUOTE_ID, organization_id: ORG_ID },
    });
    const { GET } = await route;

    await GET(authedRequest());

    expect(JSON.stringify(funnelRows)).not.toMatch(
      /diagnos|medic|condition|symptom|age|gender/i,
    );
  });

  it("returns the quote when the event insert fails", async () => {
    const { route } = loadRoute({
      quote: { id: QUOTE_ID, organization_id: ORG_ID },
      funnelInsert: async () => ({ error: { message: "rls" } }),
    });
    const { GET } = await route;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(authedRequest());

    expect(response.status).toBe(200);
    expect(error).toHaveBeenCalled();
  });
});
