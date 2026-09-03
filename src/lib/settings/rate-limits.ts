import { getRateLimiter } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/settings/session";

export interface RateLimitPolicy {
  requestsPerWindow: number;
  windowMs: number;
  windowLabel: string;
  source: "env" | "organization";
  remaining: number | null;
  resetAt: string | null;
  serviceConfigured: boolean;
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
  if (!hasServiceRole()) return null;

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
): Promise<RateLimitPolicy> {
  const serviceConfigured = hasServiceRole();
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
    serviceConfigured,
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
    return {
      error:
        "No se pueden guardar límites: Supabase no está configurado en este entorno.",
    };
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
      updated_by: userId,
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    return { error: "No se pudo guardar la configuración." };
  }

  return { ok: true };
}
