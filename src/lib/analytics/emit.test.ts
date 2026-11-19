import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emitFunnelEvent,
  type FunnelEventWriteOutcome,
  type FunnelEventWriter,
} from "@/lib/analytics/emit";
import type { FunnelEventRow } from "@/lib/analytics/funnel-events";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function withoutSupabase() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function withSupabase() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
}

/** Recording writer double. `rows` holds exactly what the emitter asked to persist. */
function createWriter(outcome: FunnelEventWriteOutcome = { status: "recorded" }) {
  const rows: FunnelEventRow[] = [];
  const writer: FunnelEventWriter = async (row) => {
    rows.push(row);
    return outcome;
  };
  return { rows, writer };
}

afterEach(() => {
  restoreEnv();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/admin");
  vi.resetModules();
});

describe("emitFunnelEvent", () => {
  it("writes one row for a valid lead event", async () => {
    withSupabase();
    const { rows, writer } = createWriter();

    await emitFunnelEvent(
      { step: "lead", source: "contacto", properties: { intent: "contact" } },
      { writer },
    );

    expect(rows).toEqual([
      {
        organization_id: null,
        step: "lead",
        source: "contacto",
        lead_intent: "contact",
        offer_count: null,
      },
    ]);
  });

  it("attributes the row to an organization when one is given", async () => {
    withSupabase();
    const { rows, writer } = createWriter();

    await emitFunnelEvent(
      { step: "quote", source: "api", properties: {} },
      { writer, organizationId: "d0000000-0000-4000-8000-000000000001" },
    );

    expect(rows[0]?.organization_id).toBe(
      "d0000000-0000-4000-8000-000000000001",
    );
  });

  it("drops a health-data payload without touching the database", async () => {
    withSupabase();
    const { rows, writer } = createWriter();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await emitFunnelEvent(
      {
        step: "lead",
        source: "cotizador",
        properties: { intent: "quote", diagnosis: "diabetes" },
      },
      { writer },
    );

    expect(rows).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });

  it("drops an event for a step that does not exist yet", async () => {
    withSupabase();
    const { rows, writer } = createWriter();
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await emitFunnelEvent(
      { step: "payment", source: "compare", properties: {} },
      { writer },
    );

    expect(rows).toHaveLength(0);
  });

  it("does not throw when the insert returns an error", async () => {
    withSupabase();
    const { writer } = createWriter({ status: "failed", message: "boom" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      emitFunnelEvent(
        { step: "quote", source: "compare", properties: { offerCount: 3 } },
        { writer },
      ),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalled();
  });

  it("does not throw when the insert rejects", async () => {
    withSupabase();
    const writer: FunnelEventWriter = async () => {
      throw new Error("network down");
    };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      emitFunnelEvent(
        { step: "advisor_request", source: "cotizador", properties: {} },
        { writer },
      ),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalled();
  });

  it("is a no-op in demo mode, when Supabase is unconfigured", async () => {
    withoutSupabase();

    // Default writer path: no client, so nothing is persisted and nothing throws.
    await expect(
      emitFunnelEvent({
        step: "quote",
        source: "compare",
        properties: { offerCount: 1 },
      }),
    ).resolves.toBeUndefined();
  });

  it("inserts through the service-role client by default", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { emitFunnelEvent: emit } = await import("@/lib/analytics/emit");
    await emit({ step: "quote", source: "compare", properties: { offerCount: 5 } });

    expect(from).toHaveBeenCalledWith("funnel_events");
    expect(insert).toHaveBeenCalledWith({
      organization_id: null,
      step: "quote",
      source: "compare",
      lead_intent: null,
      offer_count: 5,
    });
  });

  it("swallows a default-writer insert error", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "rls" } });
    const from = vi.fn().mockReturnValue({ insert });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { emitFunnelEvent: emit } = await import("@/lib/analytics/emit");
    await expect(
      emit({ step: "quote", source: "compare", properties: {} }),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalled();
  });

  it("skips the insert when the default writer has no client", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => null,
    }));

    const { emitFunnelEvent: emit } = await import("@/lib/analytics/emit");
    await emit({ step: "quote", source: "compare", properties: {} });

    expect(error).not.toHaveBeenCalled();
  });
});

describe("emitFunnelEvent — payload hygiene", () => {
  it("never writes a key outside the five table columns", async () => {
    withSupabase();
    const { rows, writer } = createWriter();

    await emitFunnelEvent(
      { step: "lead", source: "cotizador", properties: { intent: "quote" } },
      { writer },
    );

    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(
      ["lead_intent", "offer_count", "organization_id", "source", "step"].sort(),
    );
  });
});
