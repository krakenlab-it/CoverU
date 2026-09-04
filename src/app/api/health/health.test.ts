import { describe, expect, it } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as readyGet } from "@/app/api/ready/route";

describe("operational endpoints", () => {
  it("GET /api/health returns ok", async () => {
    const response = await healthGet();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("GET /api/ready returns ready in demo mode", async () => {
    const response = await readyGet();
    const body = (await response.json()) as {
      status: string;
      checks: Array<{ name: string; ok: boolean }>;
    };
    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.checks.some((c) => c.name === "persistence_mode")).toBe(true);
  });
});
