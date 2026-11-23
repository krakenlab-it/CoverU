import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FUNNEL_WINDOW_DAYS,
  buildFunnelSummary,
  getFunnelSummary,
} from "@/lib/dashboard/funnel";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

const ORG_ID = "d0000000-0000-4000-8000-000000000001";

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function withSupabase() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
}

function withoutSupabase() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function todayAt(hours: number): string {
  const date = new Date();
  date.setUTCHours(hours, 0, 0, 0);
  return date.toISOString();
}

afterEach(() => {
  restoreEnv();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/admin");
  vi.resetModules();
});

describe("buildFunnelSummary", () => {
  it("returns zeroed steps with no conversion for an empty window", () => {
    const summary = buildFunnelSummary([], true);

    expect(summary.windowDays).toBe(FUNNEL_WINDOW_DAYS);
    expect(summary.isEmpty).toBe(true);
    expect(summary.totalEvents).toBe(0);
    expect(summary.steps.map((step) => step.step)).toEqual([
      "lead",
      "quote",
      "advisor_request",
    ]);
    expect(summary.steps.map((step) => step.count)).toEqual([0, 0, 0]);
  });

  it("counts each step independently", () => {
    const points = [
      { step: "lead", created_at: todayAt(10) },
      { step: "lead", created_at: todayAt(11) },
      { step: "lead", created_at: todayAt(12) },
      { step: "lead", created_at: todayAt(13) },
      { step: "quote", created_at: todayAt(10) },
      { step: "quote", created_at: todayAt(11) },
      { step: "advisor_request", created_at: todayAt(12) },
    ];

    const summary = buildFunnelSummary(points, true);
    const [lead, quote, advisor] = summary.steps;

    expect(lead?.count).toBe(4);
    expect(quote?.count).toBe(2);
    expect(advisor?.count).toBe(1);
    expect(summary.totalEvents).toBe(7);
    expect(summary.isEmpty).toBe(false);
  });

  it("keeps a zero count honest instead of hiding the step", () => {
    const summary = buildFunnelSummary(
      [{ step: "lead", created_at: todayAt(9) }],
      true,
    );
    const [, quote, advisor] = summary.steps;

    expect(quote?.count).toBe(0);
    expect(advisor?.count).toBe(0);
    expect(summary.steps).toHaveLength(3);
  });

  it("buckets events per day and includes days with no events", () => {
    const summary = buildFunnelSummary(
      [
        { step: "lead", created_at: todayAt(8) },
        { step: "quote", created_at: todayAt(9) },
        { step: "quote", created_at: todayAt(10) },
      ],
      true,
      3,
    );

    expect(summary.byDay).toHaveLength(3);
    const today = summary.byDay[summary.byDay.length - 1];
    expect(today?.counts.lead).toBe(1);
    expect(today?.counts.quote).toBe(2);
    expect(today?.counts.advisor_request).toBe(0);

    const oldest = summary.byDay[0];
    expect(oldest?.counts).toEqual({ lead: 0, quote: 0, advisor_request: 0 });
    expect(String(oldest?.date) < String(today?.date)).toBe(true);
  });

  it("ignores points whose step is unknown to the catalog", () => {
    const summary = buildFunnelSummary(
      [
        { step: "lead", created_at: todayAt(8) },
        { step: "payment", created_at: todayAt(8) },
      ],
      true,
    );

    expect(summary.totalEvents).toBe(1);
  });

  it("reports demo mode when Supabase is unconfigured", () => {
    const summary = buildFunnelSummary([], false);
    expect(summary.serviceConfigured).toBe(false);
    expect(summary.isEmpty).toBe(true);
  });
});

describe("getFunnelSummary", () => {
  it("returns an honest empty summary without Supabase", async () => {
    withoutSupabase();
    const summary = await getFunnelSummary(ORG_ID);

    expect(summary.serviceConfigured).toBe(false);
    expect(summary.isEmpty).toBe(true);
    expect(summary.totalEvents).toBe(0);
    expect(summary.error).toBeUndefined();
  });

  it("reads the org's events plus the unattributed public funnel", async () => {
    withSupabase();
    const limit = vi.fn().mockResolvedValue({
      data: [
        { step: "lead", created_at: todayAt(8) },
        { step: "quote", created_at: todayAt(9) },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const gte = vi.fn().mockReturnValue({ order });
    const or = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ or });
    const from = vi.fn().mockReturnValue({ select });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { getFunnelSummary: read } = await import("@/lib/dashboard/funnel");
    const summary = await read(ORG_ID);

    expect(from).toHaveBeenCalledWith("funnel_events");
    expect(select).toHaveBeenCalledWith("step, created_at");
    expect(or).toHaveBeenCalledWith(
      `organization_id.is.null,organization_id.eq.${ORG_ID}`,
    );
    expect(summary.steps[0]?.count).toBe(1);
    expect(summary.steps[1]?.count).toBe(1);
    expect(summary.serviceConfigured).toBe(true);
  });

  it("surfaces a read error instead of showing zero", async () => {
    withSupabase();
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: "x" } });
    const order = vi.fn().mockReturnValue({ limit });
    const gte = vi.fn().mockReturnValue({ order });
    const or = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ or });
    const from = vi.fn().mockReturnValue({ select });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { getFunnelSummary: read } = await import("@/lib/dashboard/funnel");
    const summary = await read(ORG_ID);

    expect(summary.error).toBe("No se pudieron cargar los datos del embudo.");
  });

  it("refuses a malformed organization id instead of interpolating it", async () => {
    withSupabase();
    const from = vi.fn();

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { getFunnelSummary: read } = await import("@/lib/dashboard/funnel");
    const summary = await read("not-a-uuid,organization_id.neq.x");

    expect(from).not.toHaveBeenCalled();
    expect(summary.isEmpty).toBe(true);
    expect(summary.serviceConfigured).toBe(true);
  });

  it("uses the dashboard default window", async () => {
    withSupabase();
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const gte = vi.fn().mockReturnValue({ order });
    const or = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ or });
    const from = vi.fn().mockReturnValue({ select });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { getFunnelSummary: read } = await import("@/lib/dashboard/funnel");
    const summary = await read(ORG_ID);

    expect(summary.windowDays).toBe(FUNNEL_WINDOW_DAYS);
    expect(gte).toHaveBeenCalledWith("created_at", expect.any(String));
  });
});
