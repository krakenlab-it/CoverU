import { NextResponse } from "next/server";
import {
  buildCoveruEnvDiagnostics,
  buildCoveruEnvHealthResponse,
} from "@/lib/supabase/env-diagnostics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const diagnostics = buildCoveruEnvDiagnostics({ route: "/api/health/env" });
  const body = buildCoveruEnvHealthResponse(diagnostics);

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
