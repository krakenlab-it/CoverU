import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession,
    },
  })),
}));

const ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_URL"] as const;

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

describe("GET /auth/callback", () => {
  afterEach(() => {
    restoreEnv();
    exchangeCodeForSession.mockReset();
  });

  it("redirects to next path after exchanging code", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cover-u-app.vercel.app";
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const response = await GET(
      new Request(
        "https://cover-u-app.vercel.app/auth/callback?code=abc&next=/app",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cover-u-app.vercel.app/app");
  });

  it("redirects to /app when next is missing", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cover-u-app.vercel.app";

    const response = await GET(
      new Request("https://cover-u-app.vercel.app/auth/callback"),
    );

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://cover-u-app.vercel.app/app");
  });

  it("rejects open redirects", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cover-u-app.vercel.app";
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const response = await GET(
      new Request(
        "https://cover-u-app.vercel.app/auth/callback?code=abc&next=//evil.example",
      ),
    );

    expect(response.headers.get("location")).toBe("https://cover-u-app.vercel.app/app");
  });
});
