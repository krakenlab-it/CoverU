import { describe, expect, it } from "vitest";
import { DEMO_API_KEY } from "@/lib/api/api-key";
import { GET as getInsurers } from "@/app/api/v1/insurers/route";
import { GET as getPlans } from "@/app/api/v1/plans/route";
import { GET as getQuotes } from "@/app/api/v1/quotes/route";
import { POST as postCoverageQa } from "@/app/api/v1/coverage/qa/route";

function authedRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      "X-API-Key": DEMO_API_KEY,
      ...(init?.headers ?? {}),
    },
  });
}

describe("API v1 routes (demo mode)", () => {
  it("GET /insurers returns demo insurers", async () => {
    const response = await getInsurers(
      authedRequest("http://localhost/api/v1/insurers"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.insurers.length).toBeGreaterThan(0);
    expect(body.data.insurers[0].is_demo).toBe(true);
    expect(body.request_id).toBeDefined();
  });

  it("GET /plans filters by insurer_id", async () => {
    const response = await getPlans(
      authedRequest(
        "http://localhost/api/v1/plans?insurer_id=a0000000-0000-4000-8000-000000000001",
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.plans.every(
      (p: { insurer_id: string }) =>
        p.insurer_id === "a0000000-0000-4000-8000-000000000001",
    )).toBe(true);
  });

  it("GET /quotes returns demo quote", async () => {
    const response = await getQuotes(
      authedRequest(
        "http://localhost/api/v1/quotes?id=d8000000-0000-4000-8000-000000000001",
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.quote.external_ref).toBe("DEMO-QUOTE-001");
  });

  it("POST /coverage/qa returns grounded answer", async () => {
    const response = await postCoverageQa(
      authedRequest("http://localhost/api/v1/coverage/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_version_id: "d1000000-0000-4000-8000-000000000001",
          question: "¿Está cubierta la hospitalización?",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe("covered");
    expect(body.data.citations.length).toBeGreaterThan(0);
    expect(body.data.policy_wording_controls).toBe(true);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await getInsurers(
      new Request("http://localhost/api/v1/insurers"),
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("missing_api_key");
  });
});
