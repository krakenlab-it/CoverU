import { NextResponse } from "next/server";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/api/response";

export const dynamic = "force-dynamic";

interface ReadinessCheck {
  name: string;
  ok: boolean;
  detail?: string;
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

  const coverageProvider = process.env.COVERAGE_QA_PROVIDER ?? "demo";
  checks.push({
    name: "coverage_qa_provider",
    ok: coverageProvider === "demo" || Boolean(process.env.OPENAI_API_KEY),
    detail:
      coverageProvider === "demo"
        ? "demo provider (no external AI)"
        : "openai configured",
  });

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
