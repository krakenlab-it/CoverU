import { afterEach, describe, expect, it } from "vitest";
import {
  createDemoApiKey,
  listDemoApiKeys,
  resetDemoSettingsStore,
  revokeDemoApiKey,
} from "@/lib/settings/demo-store";
import {
  createOrgApiKey,
  listOrgApiKeys,
  revokeOrgApiKey,
} from "@/lib/settings/api-keys";
import { getOrgUsageSummary } from "@/lib/settings/usage";
import {
  getOrgRateLimitPolicy,
  updateOrgRateLimitPolicy,
} from "@/lib/settings/rate-limits";
import { DEMO_ORG_ID } from "@/lib/demo-api-data";
import { hashApiKey } from "@/lib/api/api-key";

const ORG_ID = DEMO_ORG_ID;

afterEach(() => {
  resetDemoSettingsStore();
});

describe("api key management (demo store)", () => {
  it("lists prefix, name, and status without exposing full keys", async () => {
    const result = await listOrgApiKeys(ORG_ID);
    expect(result.demoMode).toBe(true);
    expect(result.keys.length).toBeGreaterThan(0);
    expect(result.keys[0].keyPrefix).toMatch(/…$/);
    expect(result.keys[0].name).toContain("DEMO");
  });

  it("creates a key showing plaintext once and stores hash only", async () => {
    const created = await createOrgApiKey(ORG_ID, "Test integration", true);
    expect("rawKey" in created).toBe(true);
    if (!("rawKey" in created)) return;

    expect(created.rawKey).toMatch(/^cov_/);
    expect(created.rawKey).not.toContain("…");

    const listed = listDemoApiKeys();
    const stored = listed.find((key) => key.id === created.key.id);
    expect(stored).toBeDefined();
    expect(stored?.key_hash).toBe(hashApiKey(created.rawKey));
    expect(stored?.key_hash).not.toBe(created.rawKey);
  });

  it("revokes a key in demo mode", async () => {
    const { record } = createDemoApiKey("To revoke");
    const result = await revokeOrgApiKey(ORG_ID, record.id);
    expect(result).toEqual({ ok: true });

    const listed = listDemoApiKeys();
    expect(listed.find((key) => key.id === record.id)?.status).toBe("revoked");
    expect(revokeDemoApiKey(record.id)).toBe(true);
  });
});

describe("usage summary", () => {
  it("returns honest empty state in demo mode", async () => {
    const usage = await getOrgUsageSummary(ORG_ID, true);
    expect(usage.isEmpty).toBe(true);
    expect(usage.demoMode).toBe(true);
    expect(usage.totalRequests).toBe(0);
    expect(usage.byEndpoint).toHaveLength(0);
  });

  it("surfaces error state without inventing metrics", async () => {
    const usage = await getOrgUsageSummary(ORG_ID, false);
    if (usage.error) {
      expect(usage.isEmpty).toBe(true);
      expect(usage.totalRequests).toBe(0);
    } else {
      expect(usage.totalRequests).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("rate limit policy", () => {
  it("displays env defaults in demo mode", async () => {
    const policy = await getOrgRateLimitPolicy(ORG_ID, true);
    expect(policy.requestsPerWindow).toBeGreaterThan(0);
    expect(policy.windowMs).toBeGreaterThan(0);
    expect(policy.demoMode).toBe(true);
  });

  it("persists org override in demo memory store", async () => {
    const update = await updateOrgRateLimitPolicy(ORG_ID, "demo-user", {
      requestsPerWindow: 250,
      windowMs: 120000,
    });
    expect(update).toEqual({ ok: true });

    const policy = await getOrgRateLimitPolicy(ORG_ID, true);
    expect(policy.requestsPerWindow).toBe(250);
    expect(policy.windowMs).toBe(120000);
    expect(policy.source).toBe("demo");
  });
});
