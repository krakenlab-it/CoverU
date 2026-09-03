"use client";

import { useEffect } from "react";
import {
  type CoveruEnvDiagnostics,
  logCoveruEnv,
} from "@/lib/supabase/env-diagnostics";

export function serializeCoveruEnvDiagnostics(
  diagnostics: CoveruEnvDiagnostics,
): string {
  return JSON.stringify(diagnostics);
}

export function useLogCoveruEnv(
  diagnostics: CoveruEnvDiagnostics,
  level: "info" | "warn" = "info",
  enabled = true,
): void {
  const payloadKey = serializeCoveruEnvDiagnostics(diagnostics);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    logCoveruEnv(JSON.parse(payloadKey) as CoveruEnvDiagnostics, level);
  }, [payloadKey, enabled, level]);
}
