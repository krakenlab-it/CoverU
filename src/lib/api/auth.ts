import type { ApiAuthContext } from "@/lib/types/phase1";
import {
  DEMO_API_KEY,
  extractKeyPrefix,
  hashApiKey,
  verifyApiKey,
} from "@/lib/api/api-key";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ApiAuthResult {
  ok: true;
  context: ApiAuthContext;
}

export interface ApiAuthFailure {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export type AuthenticateApiKeyResult = ApiAuthResult | ApiAuthFailure;

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const apiKeyHeader = request.headers.get("x-api-key");
  return apiKeyHeader?.trim() ?? null;
}

/** Demo auth context when Supabase is not configured */
const DEMO_AUTH_CONTEXT: ApiAuthContext = {
  apiKeyId: "f0000000-0000-4000-8000-000000000001",
  apiClientId: "e0000000-0000-4000-8000-000000000001",
  organizationId: "d0000000-0000-4000-8000-000000000001",
  scopes: ["read:catalog", "read:quotes", "read:coverage"],
  isDemo: true,
};

export async function authenticateApiKey(
  request: Request,
): Promise<AuthenticateApiKeyResult> {
  const rawKey = extractBearerToken(request);

  if (!rawKey) {
    return {
      ok: false,
      code: "missing_api_key",
      message: "Se requiere API key en Authorization: Bearer o X-API-Key",
      status: 401,
    };
  }

  const supabase = createAdminClient();

  if (!supabase) {
    if (rawKey === DEMO_API_KEY) {
      return { ok: true, context: DEMO_AUTH_CONTEXT };
    }
    return {
      ok: false,
      code: "invalid_api_key",
      message: "API key inválida (modo demo)",
      status: 401,
    };
  }

  const prefix = extractKeyPrefix(rawKey);

  const { data: keyRecord, error } = await supabase
    .from("api_keys")
    .select(
      `
      id,
      api_client_id,
      key_hash,
      status,
      scopes,
      expires_at,
      api_client:api_clients (
        id,
        organization_id,
        status,
        is_demo
      )
    `,
    )
    .eq("key_prefix", prefix)
    .eq("status", "active")
    .maybeSingle();

  if (error || !keyRecord) {
    return {
      ok: false,
      code: "invalid_api_key",
      message: "API key inválida o revocada",
      status: 401,
    };
  }

  if (!verifyApiKey(rawKey, keyRecord.key_hash)) {
    return {
      ok: false,
      code: "invalid_api_key",
      message: "API key inválida o revocada",
      status: 401,
    };
  }

  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return {
      ok: false,
      code: "expired_api_key",
      message: "API key expirada",
      status: 401,
    };
  }

  const client = keyRecord.api_client as unknown as {
    id: string;
    organization_id: string;
    status: string;
    is_demo: boolean;
  } | null;

  if (!client || client.status !== "active") {
    return {
      ok: false,
      code: "client_suspended",
      message: "Cliente API suspendido o revocado",
      status: 403,
    };
  }

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  return {
    ok: true,
    context: {
      apiKeyId: keyRecord.id,
      apiClientId: client.id,
      organizationId: client.organization_id,
      scopes: keyRecord.scopes ?? [],
      isDemo: client.is_demo,
    },
  };
}

export function requireScope(
  context: ApiAuthContext,
  scope: string,
): ApiAuthFailure | null {
  if (!context.scopes.includes(scope)) {
    return {
      ok: false,
      code: "insufficient_scope",
      message: `Se requiere el scope: ${scope}`,
      status: 403,
    };
  }
  return null;
}

export async function logApiUsage(
  context: ApiAuthContext,
  requestId: string,
  request: Request,
  statusCode: number,
  durationMs: number,
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const url = new URL(request.url);
  await supabase.from("api_usage_logs").insert({
    api_key_id: context.apiKeyId,
    organization_id: context.organizationId,
    request_id: requestId,
    method: request.method,
    path: url.pathname,
    status_code: statusCode,
    duration_ms: durationMs,
    ip_address:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: request.headers.get("user-agent"),
  });
}

/** Exported for tests */
export { hashApiKey, DEMO_API_KEY };
