import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/env/route";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("GET /api/health/env", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("returns safe diagnostics without leaking secret values", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.full-secret-part";
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role-secret";

    const response = await GET();
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      hasUrl: true,
      urlHost: "abc123.supabase.co",
      hasAnonKey: true,
      anonLength: 53,
      anonPrefix: "eyJhbGci",
      hasServiceRole: true,
    });
    expect(serialized).not.toContain("full-secret-part");
    expect(serialized).not.toContain("service-role-secret");
  });

  it("reports missing configuration in test environment", async () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      ok: false,
      hasUrl: false,
      urlHost: null,
      hasAnonKey: false,
      anonLength: 0,
      anonPrefix: "empty",
      hasServiceRole: false,
    });
  });
});
