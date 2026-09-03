import { describe, expect, it } from "vitest";
import { GET as getInsurers } from "@/app/api/v1/insurers/route";
import { POST as postCoverageQa } from "@/app/api/v1/coverage/qa/route";

function authedRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      "X-API-Key": "cov_test_key_1234567890abcdef",
      ...(init?.headers ?? {}),
    },
  });
}

describe("API v1 routes without Supabase", () => {
  it("GET /insurers returns service unavailable", async () => {
    const response = await getInsurers(
      authedRequest("http://localhost/api/v1/insurers"),
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("service_unavailable");
  });

  it("rejects unauthenticated requests", async () => {
    const response = await getInsurers(
      new Request("http://localhost/api/v1/insurers"),
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("missing_api_key");
  });

  it("POST /coverage/qa returns service unavailable", async () => {
    const response = await postCoverageQa(
      authedRequest("http://localhost/api/v1/coverage/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_version_id: "00000000-0000-4000-8000-000000000001",
          question: "¿Está cubierta la hospitalización?",
        }),
      }),
    );
    expect(response.status).toBe(503);
  });
});
