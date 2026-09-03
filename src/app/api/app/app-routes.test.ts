import { describe, expect, it } from "vitest";
import { GET as catalogGET } from "@/app/api/app/catalog/route";
import { GET as planVersionGET } from "@/app/api/app/plan-versions/[id]/route";
import { POST as coveragePOST } from "@/app/api/app/coverage/qa/route";

describe("app internal API routes", () => {
  it("GET /api/app/catalog returns marketplace results", async () => {
    const req = new Request(
      "http://localhost/api/app/catalog?age=30&gender=femenino&region=metropolitana",
    );
    const res = await catalogGET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.results.length).toBeGreaterThan(0);
    expect(json.data.isDemo).toBe(true);
  });

  it("GET /api/app/plan-versions/:id returns plan detail", async () => {
    const req = new Request("http://localhost/api/app/plan-versions/x");
    const res = await planVersionGET(req, {
      params: Promise.resolve({
        id: "d1000000-0000-4000-8000-000000000001",
      }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.version.id).toBe(
      "d1000000-0000-4000-8000-000000000001",
    );
    expect(json.data.coverage_clauses.length).toBeGreaterThan(0);
  });

  it("POST /api/app/coverage/qa returns grounded answer", async () => {
    const req = new Request("http://localhost/api/app/coverage/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_version_id: "d1000000-0000-4000-8000-000000000001",
        question: "¿Está cubierta la hospitalización?",
      }),
    });
    const res = await coveragePOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("covered");
    expect(json.data.citations.length).toBeGreaterThan(0);
    expect(json.data.policy_wording_controls).toBe(true);
  });

  it("POST /api/app/coverage/qa abstains for unknown topics", async () => {
    const req = new Request("http://localhost/api/app/coverage/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_version_id: "d1000000-0000-4000-8000-000000000001",
        question: "¿Cubren vacaciones en la luna?",
      }),
    });
    const res = await coveragePOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("unknown");
    expect(json.data.abstained).toBe(true);
  });
});
