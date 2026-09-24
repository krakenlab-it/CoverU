import { NextResponse } from "next/server";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/api/response";
import { getCoverageQaProvider } from "@/lib/coverage/agent/provider";

export const dynamic = "force-dynamic";

interface ReadinessCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

/**
 * Matches getCoverageQaProvider(): openai runs only when the key is present.
 * A missing key falls back to the rules engine, which can still serve Preview.
 * Production must not advertise openai without the key.
 */
function coverageProviderCheck(): ReadinessCheck {
  const configured = (process.env.COVERAGE_QA_PROVIDER ?? "demo").trim();
  const effective = getCoverageQaProvider();
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

  if (effective === "openai") {
    return {
      name: "coverage_qa_provider",
      ok: true,
      detail: "openai",
    };
  }

  if (configured === "openai" && !hasOpenAiKey) {
    const production = process.env.VERCEL_ENV === "production";
    return {
      name: "coverage_qa_provider",
      ok: !production,
      detail: production
        ? "Production set COVERAGE_QA_PROVIDER=openai but OPENAI_API_KEY is missing"
        : "rules fallback; OPENAI_API_KEY is not set in this environment",
    };
  }

  return {
    name: "coverage_qa_provider",
    ok: true,
    detail:
      configured === "demo"
        ? "demo provider (no external AI)"
        : `rules (${configured})`,
  };
}

export async function GET() {
  const requestId = generateRequestId();
  const checks: ReadinessCheck[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const demoMode = !supabaseUrl || !supabaseKey;

  checks.push({
    name: "runtime",
    ok: true,
    detail: "Next.js process responding",
  });

  checks.push({
    name: "persistence_mode",
    ok: true,
    detail: demoMode ? "demo" : "supabase",
  });

  if (!demoMode) {
    checks.push({
      name: "supabase_config",
      ok: Boolean(supabaseUrl && supabaseKey),
      detail: "Public Supabase env vars present",
    });
  }

  checks.push(coverageProviderCheck());

  const ready = checks.every((check) => check.ok);
  const status = ready ? 200 : 503;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
      request_id: requestId,
    },
    {
      status,
      headers: {
        [REQUEST_ID_HEADER]: requestId,
        "Cache-Control": "no-store",
      },
    },
  );
}
