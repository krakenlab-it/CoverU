import { describe, expect, it } from "vitest";
import { GET as catalogGET } from "@/app/api/app/catalog/route";
import { GET as planVersionGET } from "@/app/api/app/plan-versions/[id]/route";
import { POST as coveragePOST } from "@/app/api/app/coverage/qa/route";

describe("app internal API routes", () => {
  it("GET /api/app/catalog requires session", async () => {
    const req = new Request(
      "http://localhost/api/app/catalog?age=30&gender=femenino&region=Sierra",
    );
    const res = await catalogGET(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/app/plan-versions/:id requires session", async () => {
    const req = new Request("http://localhost/api/app/plan-versions/x");
    const res = await planVersionGET(req, {
      params: Promise.resolve({
        id: "00000000-0000-4000-8000-000000000001",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/app/coverage/qa requires session", async () => {
    const req = new Request("http://localhost/api/app/coverage/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_version_id: "00000000-0000-4000-8000-000000000001",
        question: "¿Está cubierta la hospitalización?",
      }),
    });
    const res = await coveragePOST(req);
    expect(res.status).toBe(401);
  });
});
