import { describe, expect, it } from "vitest";
import type { RequestLogRow } from "@/lib/settings/request-logs";

function planLinkForLog(log: RequestLogRow): string | null {
  if (log.planVersionId) {
    return `/app/marketplace/plans/${log.planVersionId}`;
  }
  return null;
}

describe("request log plan links", () => {
  it("builds marketplace plan link when plan_version_id is present", () => {
    const log: RequestLogRow = {
      id: "1",
      requestId: "req-1",
      createdAt: "2026-09-04T00:00:00.000Z",
      method: "POST",
      path: "/api/app/coverage/qa",
      statusCode: 200,
      durationMs: 42,
      keyPrefix: null,
      planVersionId: "11111111-1111-1111-1111-111111111111",
      planId: null,
    };

    expect(planLinkForLog(log)).toBe(
      "/app/marketplace/plans/11111111-1111-1111-1111-111111111111",
    );
  });

  it("returns null when no plan reference exists", () => {
    const log: RequestLogRow = {
      id: "2",
      requestId: "req-2",
      createdAt: "2026-09-04T00:00:00.000Z",
      method: "GET",
      path: "/api/app/catalog",
      statusCode: 200,
      durationMs: 10,
      keyPrefix: "cov_ab",
      planVersionId: null,
      planId: null,
    };

    expect(planLinkForLog(log)).toBeNull();
  });
});

describe("dashboard analytics empty shape", () => {
  it("defines honest empty catalog counts", async () => {
    const { getDashboardAnalytics } = await import("@/lib/dashboard/analytics");
    const result = await getDashboardAnalytics(
      "00000000-0000-0000-0000-000000000000",
    );

    expect(result.serviceConfigured).toBe(false);
    expect(result.catalog).toEqual({
      insurers: 0,
      publishedPlans: 0,
      tariffs: 0,
    });
    expect(result.usage24h.totalRequests).toBe(0);
    expect(result.usage7d.totalRequests).toBe(0);
    expect(result.recentActivity).toEqual([]);
    expect(result.isEmpty).toBe(true);
  });
});
