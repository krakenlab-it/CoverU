import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/compare/route";
import type { PublicQuoteResult } from "@/lib/quoters/types";

function request(query: string): Request {
  return new Request(`http://localhost/api/compare?${query}`);
}

describe("GET /api/compare", () => {
  it("returns catalog quotes for a valid Ecuador profile", async () => {
    const response = await GET(request("age=30&gender=femenino&region=Sierra"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as PublicQuoteResult;
    expect(body.request).toEqual({
      age: 30,
      gender: "femenino",
      region: "Sierra",
    });
    expect(body.offers.length).toBeGreaterThan(0);
    expect(body.source).toBe("bundled-catalog");
    expect(body.offers[0]?.monthlyPrice).toBeGreaterThan(0);
  });

  it("rejects Chile-era region values", async () => {
    const response = await GET(request("age=30&gender=femenino&region=metropolitana"));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Parámetros inválidos");
    expect(body.details.region).toBeDefined();
  });

  it("rejects the internal any gender", async () => {
    const response = await GET(request("age=30&gender=any&region=Nacional"));
    expect(response.status).toBe(400);
  });

  it("rejects ages outside the quotable range", async () => {
    const before = await GET(request("age=17&gender=femenino&region=Nacional"));
    const after = await GET(request("age=100&gender=femenino&region=Nacional"));

    expect(before.status).toBe(400);
    expect(after.status).toBe(400);
  });

  it("is not cacheable, so tariff changes are visible immediately", async () => {
    const response = await GET(request("age=30&gender=femenino&region=Nacional"));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /api/compare — funnel events", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/analytics/emit");
    vi.resetModules();
  });

  it("records the quote step with the number of plans priced", async () => {
    const emit = vi.fn().mockResolvedValue(undefined);

    vi.resetModules();
    vi.doMock("@/lib/analytics/emit", () => ({ emitFunnelEvent: emit }));

    const { GET: getWithEmitter } = await import("@/app/api/compare/route");
    const response = await getWithEmitter(
      request("age=30&gender=femenino&region=Sierra"),
    );
    const body = (await response.json()) as PublicQuoteResult;

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith({
      step: "quote",
      source: "compare",
      properties: { offerCount: body.totalOffers },
    });
    // The payload carries a count only — no profile and no health data.
    expect(Object.keys(emit.mock.calls[0]?.[0]?.properties ?? {})).toEqual([
      "offerCount",
    ]);
  });

  it("emits no event for a rejected profile", async () => {
    const emit = vi.fn().mockResolvedValue(undefined);

    vi.resetModules();
    vi.doMock("@/lib/analytics/emit", () => ({ emitFunnelEvent: emit }));

    const { GET: getWithEmitter } = await import("@/app/api/compare/route");
    const response = await getWithEmitter(
      request("age=12&gender=femenino&region=Nacional"),
    );

    expect(response.status).toBe(400);
    expect(emit).not.toHaveBeenCalled();
  });

  it("emits no event when the profile prices no plans", async () => {
    const emit = vi.fn().mockResolvedValue(undefined);

    vi.resetModules();
    vi.doMock("@/lib/analytics/emit", () => ({ emitFunnelEvent: emit }));
    vi.doMock("@/lib/quoters/public-quote", () => ({
      getPublicQuote: async () => ({
        request: { age: 30, gender: "femenino", region: "Nacional" },
        offers: [],
        totalOffers: 0,
        source: "bundled-catalog",
      }),
    }));

    const { GET: getWithEmitter } = await import("@/app/api/compare/route");
    await getWithEmitter(request("age=30&gender=femenino&region=Nacional"));

    expect(emit).not.toHaveBeenCalled();

    vi.doUnmock("@/lib/quoters/public-quote");
  });

  it("still returns the quote when the event insert fails", async () => {
    const funnelInsert = vi.fn().mockResolvedValue({ error: { message: "rls" } });
    const tariffQuery = {
      select: () => tariffQuery,
      eq: () => tariffQuery,
      order: () => tariffQuery,
      range: async () => ({ data: null, error: { message: "no remote catalog" } }),
    };
    const from = vi.fn((table: string) =>
      table === "funnel_events" ? { insert: funnelInsert } : tariffQuery,
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { GET: getWithEmitter } = await import("@/app/api/compare/route");
    const response = await getWithEmitter(
      request("age=30&gender=femenino&region=Nacional"),
    );
    const body = (await response.json()) as PublicQuoteResult;

    // A broken analytics insert must not cost the visitor their quote.
    expect(response.status).toBe(200);
    expect(body.offers.length).toBeGreaterThan(0);
    expect(funnelInsert).toHaveBeenCalled();

    vi.doUnmock("@/lib/supabase/admin");
  });
});
