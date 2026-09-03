import { describe, expect, it } from "vitest";
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

  it("returns service unavailable when Supabase is not configured", async () => {
    const request = new Request("http://localhost/api/v1/insurers", {
      headers: { "X-API-Key": "cov_test_key_1234567890abcdef" },
    });
    const result = await authenticateApiKey(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("service_unavailable");
      expect(result.status).toBe(503);
    }
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
        isDemo: false,
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
        isDemo: false,
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
