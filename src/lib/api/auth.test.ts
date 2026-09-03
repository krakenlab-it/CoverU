import { describe, expect, it } from "vitest";
import { DEMO_API_KEY } from "@/lib/api/api-key";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";

describe("authenticateApiKey", () => {
  it("rejects requests without API key", async () => {
    const request = new Request("http://localhost/api/v1/insurers");
    const result = await authenticateApiKey(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_api_key");
      expect(result.status).toBe(401);
    }
  });

  it("accepts demo API key in demo mode", async () => {
    const request = new Request("http://localhost/api/v1/insurers", {
      headers: { "X-API-Key": DEMO_API_KEY },
    });
    const result = await authenticateApiKey(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.isDemo).toBe(true);
      expect(result.context.scopes).toContain("read:catalog");
    }
  });

  it("rejects invalid API key in demo mode", async () => {
    const request = new Request("http://localhost/api/v1/insurers", {
      headers: { Authorization: "Bearer invalid_key" },
    });
    const result = await authenticateApiKey(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_api_key");
    }
  });

  it("accepts Bearer token format", async () => {
    const request = new Request("http://localhost/api/v1/insurers", {
      headers: { Authorization: `Bearer ${DEMO_API_KEY}` },
    });
    const result = await authenticateApiKey(request);
    expect(result.ok).toBe(true);
  });
});

describe("requireScope", () => {
  it("returns null when scope is present", () => {
    const result = requireScope(
      {
        apiKeyId: "1",
        apiClientId: "2",
        organizationId: "3",
        scopes: ["read:catalog"],
        isDemo: true,
      },
      "read:catalog",
    );
    expect(result).toBeNull();
  });

  it("returns failure when scope is missing", () => {
    const result = requireScope(
      {
        apiKeyId: "1",
        apiClientId: "2",
        organizationId: "3",
        scopes: ["read:catalog"],
        isDemo: true,
      },
      "read:quotes",
    );
    expect(result).not.toBeNull();
    if (result) {
      expect(result.code).toBe("insufficient_scope");
      expect(result.status).toBe(403);
    }
  });
});
