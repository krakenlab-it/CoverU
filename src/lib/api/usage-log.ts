import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiAuthContext } from "@/lib/types/phase1";

export interface UsageLogMetadata {
  planVersionId?: string | null;
  planId?: string | null;
  metadata?: Record<string, unknown>;
}

interface InsertUsageLogParams {
  organizationId: string;
  apiKeyId?: string | null;
  requestId: string;
  request: Request;
  statusCode: number;
  durationMs: number;
  context?: UsageLogMetadata;
}

export async function insertUsageLog({
  organizationId,
  apiKeyId = null,
  requestId,
  request,
  statusCode,
  durationMs,
  context,
}: InsertUsageLogParams): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const url = new URL(request.url);
  await supabase.from("api_usage_logs").insert({
    api_key_id: apiKeyId,
    organization_id: organizationId,
    request_id: requestId,
    method: request.method,
    path: url.pathname,
    status_code: statusCode,
    duration_ms: durationMs,
    ip_address:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: request.headers.get("user-agent"),
    plan_version_id: context?.planVersionId ?? null,
    plan_id: context?.planId ?? null,
    metadata: context?.metadata ?? null,
  });
}

export async function logApiUsage(
  context: ApiAuthContext,
  requestId: string,
  request: Request,
  statusCode: number,
  durationMs: number,
  usageMetadata?: UsageLogMetadata,
): Promise<void> {
  await insertUsageLog({
    organizationId: context.organizationId,
    apiKeyId: context.apiKeyId,
    requestId,
    request,
    statusCode,
    durationMs,
    context: usageMetadata,
  });
}

export async function logSessionApiUsage(
  organizationId: string,
  requestId: string,
  request: Request,
  statusCode: number,
  durationMs: number,
  usageMetadata?: UsageLogMetadata,
): Promise<void> {
  await insertUsageLog({
    organizationId,
    requestId,
    request,
    statusCode,
    durationMs,
    context: usageMetadata,
  });
}
