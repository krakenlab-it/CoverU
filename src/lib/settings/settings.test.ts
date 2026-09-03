import { describe, expect, it } from "vitest";
import {
  createOrgApiKey,
  listOrgApiKeys,
  revokeOrgApiKey,
} from "@/lib/settings/api-keys";
import { getOrgUsageSummary } from "@/lib/settings/usage";
import { getOrgRequestLogs } from "@/lib/settings/request-logs";
import {
  getOrgRateLimitPolicy,
  updateOrgRateLimitPolicy,
} from "@/lib/settings/rate-limits";

const ORG_ID = "d0000000-0000-4000-8000-000000000001";

describe("api key management without Supabase", () => {
  it("returns empty list when service role is unavailable", async () => {
    const result = await listOrgApiKeys(ORG_ID);
    expect(result.serviceConfigured).toBe(false);
    expect(result.keys).toEqual([]);
  });

  it("rejects create when service role is unavailable", async () => {
    const created = await createOrgApiKey(ORG_ID, "Test integration");
    expect(created).toEqual({
      error:
        "No se pueden crear claves API: Supabase no está configurado en este entorno.",
    });
  });

  it("rejects revoke when service role is unavailable", async () => {
    const result = await revokeOrgApiKey(ORG_ID, "missing");
    expect(result).toEqual({
      error:
        "No se pueden revocar claves API: Supabase no está configurado en este entorno.",
    });
  });
});

describe("usage summary", () => {
  it("returns honest empty state without Supabase", async () => {
    const usage = await getOrgUsageSummary(ORG_ID);
    expect(usage.isEmpty).toBe(true);
    expect(usage.serviceConfigured).toBe(false);
    expect(usage.totalRequests).toBe(0);
    expect(usage.byEndpoint).toHaveLength(0);
  });
});

describe("request logs", () => {
  it("returns honest empty state without Supabase", async () => {
    const logs = await getOrgRequestLogs(ORG_ID);
    expect(logs.isEmpty).toBe(true);
    expect(logs.serviceConfigured).toBe(false);
    expect(logs.logs).toHaveLength(0);
  });
});

describe("rate limit policy", () => {
  it("displays env defaults without Supabase", async () => {
    const policy = await getOrgRateLimitPolicy(ORG_ID);
    expect(policy.requestsPerWindow).toBeGreaterThan(0);
    expect(policy.windowMs).toBeGreaterThan(0);
    expect(policy.serviceConfigured).toBe(false);
    expect(policy.source).toBe("env");
  });

  it("rejects org override without Supabase", async () => {
    const update = await updateOrgRateLimitPolicy(ORG_ID, "user-1", {
      requestsPerWindow: 250,
      windowMs: 120000,
    });
    expect(update).toEqual({
      error:
        "No se pueden guardar límites: Supabase no está configurado en este entorno.",
    });
  });
});
