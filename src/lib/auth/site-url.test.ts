import { afterEach, describe, expect, it } from "vitest";
import { buildAuthCallbackUrl, getAuthSiteUrl } from "@/lib/auth/site-url";

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_URL",
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

describe("getAuthSiteUrl", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    delete process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://cover-u-app.vercel.app/";

    expect(getAuthSiteUrl()).toBe("https://cover-u-app.vercel.app");
  });

  it("falls back to VERCEL_URL with https", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "cover-u-app.vercel.app";

    expect(getAuthSiteUrl()).toBe("https://cover-u-app.vercel.app");
  });

  it("falls back to localhost when no env is set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;

    expect(getAuthSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("buildAuthCallbackUrl", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("builds callback URL with next path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cover-u-app.vercel.app";

    expect(buildAuthCallbackUrl("/app")).toBe(
      "https://cover-u-app.vercel.app/auth/callback?next=%2Fapp",
    );
    expect(buildAuthCallbackUrl("/actualizar-contrasena")).toBe(
      "https://cover-u-app.vercel.app/auth/callback?next=%2Factualizar-contrasena",
    );
  });
});
