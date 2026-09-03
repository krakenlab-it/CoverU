import { getRateLimiter } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getDemoRateLimitOverride,
  setDemoRateLimitOverride,
} from "@/lib/settings/demo-store";
import { hasServiceRole } from "@/lib/settings/session";

export interface RateLimitPolicy {
  requestsPerWindow: number;
  windowMs: number;
  windowLabel: string;
  source: "env" | "organization" | "demo";
  remaining: number | null;
  resetAt: string | null;
  isDemo: boolean;
  demoMode: boolean;
}

export interface RateLimitUpdateInput {
  requestsPerWindow: number;
  windowMs: number;
}

const DEFAULT_LIMIT = Number(process.env.API_RATE_LIMIT ?? "100");
const DEFAULT_WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS ?? "60000");

function formatWindowLabel(windowMs: number): string {
  if (windowMs % 3600000 === 0) {
    const hours = windowMs / 3600000;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  if (windowMs % 60000 === 0) {
    const minutes = windowMs / 60000;
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  }
  return `${Math.round(windowMs / 1000)} segundos`;
}

async function readOrgSettings(organizationId: string): Promise<{
  requests: number;
  windowMs: number;
  source: RateLimitPolicy["source"];
} | null> {
  if (!hasServiceRole()) {
    const override = getDemoRateLimitOverride(organizationId);
    if (!override) return null;
    return {
      requests: override.rate_limit_requests,
      windowMs: override.rate_limit_window_ms,
      source: "demo",
    };
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("organization_settings")
    .select("rate_limit_requests, rate_limit_window_ms")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;

  return {
    requests: data.rate_limit_requests,
    windowMs: data.rate_limit_window_ms,
    source: "organization",
  };
}

export async function getOrgRateLimitPolicy(
  organizationId: string,
  isDemo: boolean,
): Promise<RateLimitPolicy> {
  const supabase = await createClient();
  const demoMode = !supabase;
  const orgSettings = await readOrgSettings(organizationId);

  const requestsPerWindow = orgSettings?.requests ?? DEFAULT_LIMIT;
  const windowMs = orgSettings?.windowMs ?? DEFAULT_WINDOW_MS;
  const source = orgSettings?.source ?? "env";

  let remaining: number | null = null;
  let resetAt: string | null = null;

  try {
    const probe = await getRateLimiter().check(`org-display:${organizationId}`);
    remaining = probe.remaining;
    resetAt = new Date(probe.resetAt).toISOString();
  } catch {
    remaining = null;
    resetAt = null;
  }

  return {
    requestsPerWindow,
    windowMs,
    windowLabel: formatWindowLabel(windowMs),
    source,
    remaining,
    resetAt,
    isDemo: isDemo || demoMode,
    demoMode,
  };
}

export async function updateOrgRateLimitPolicy(
  organizationId: string,
  userId: string,
  input: RateLimitUpdateInput,
): Promise<{ ok: true } | { error: string }> {
  if (
    input.requestsPerWindow < 1 ||
    input.requestsPerWindow > 10000 ||
    input.windowMs < 1000 ||
    input.windowMs > 86400000
  ) {
    return { error: "Valores de límite fuera de rango permitido." };
  }

  if (!hasServiceRole()) {
    setDemoRateLimitOverride(
      organizationId,
      input.requestsPerWindow,
      input.windowMs,
    );
    return { ok: true };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Servicio no disponible." };
  }

  const { error } = await admin.from("organization_settings").upsert(
    {
      organization_id: organizationId,
      rate_limit_requests: input.requestsPerWindow,
      rate_limit_window_ms: input.windowMs,
      updated_at: new Date().toISOString(),
      updated_by: userId === "demo-user" ? null : userId,
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    return { error: "No se pudo guardar la configuración." };
  }

  return { ok: true };
}
