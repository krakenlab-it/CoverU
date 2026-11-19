import { describe, expect, it } from "vitest";
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
