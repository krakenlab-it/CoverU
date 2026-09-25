import { afterEach, describe, expect, it } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as readyGet } from "@/app/api/ready/route";

const ENV_KEYS = [
  "COVERAGE_QA_PROVIDER",
  "OPENAI_API_KEY",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_SHA",
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

describe("operational endpoints", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("GET /api/health returns ok", async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "abc123";
    const response = await healthGet();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; commit: string | null };
    expect(body.status).toBe("ok");
    expect(body.commit).toBe("abc123");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("GET /api/ready returns ready in demo mode", async () => {
    delete process.env.COVERAGE_QA_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    const response = await readyGet();
    const body = (await response.json()) as {
      status: string;
      checks: Array<{ name: string; ok: boolean }>;
    };
    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.checks.some((c) => c.name === "persistence_mode")).toBe(true);
  });

  it("stays ready outside production when openai is requested without a key", async () => {
    process.env.COVERAGE_QA_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    process.env.VERCEL_ENV = "preview";

    const response = await readyGet();
    const body = (await response.json()) as {
      status: string;
      checks: Array<{ name: string; ok: boolean; detail?: string }>;
    };
    const coverage = body.checks.find((check) => check.name === "coverage_qa_provider");

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(coverage?.ok).toBe(true);
    expect(coverage?.detail).toMatch(/OPENAI_API_KEY/);
  });

  it("stays ready when a non-demo provider has no OpenAI key", async () => {
    process.env.COVERAGE_QA_PROVIDER = "rules";
    delete process.env.OPENAI_API_KEY;
    process.env.VERCEL_ENV = "preview";

    const response = await readyGet();
    const body = (await response.json()) as { status: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
  });

  it("is not ready in production when openai is requested without a key", async () => {
    process.env.COVERAGE_QA_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    process.env.VERCEL_ENV = "production";

    const response = await readyGet();
    const body = (await response.json()) as {
      status: string;
      checks: Array<{ name: string; ok: boolean; detail?: string }>;
    };

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.checks.find((check) => check.name === "coverage_qa_provider")?.ok).toBe(
      false,
    );
  });
});
