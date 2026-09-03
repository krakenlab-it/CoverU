import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface RequestLogRow {
  id: string;
  requestId: string;
  createdAt: string;
  method: string;
  path: string;
  statusCode: number | null;
  durationMs: number | null;
  keyPrefix: string | null;
}

export interface RequestLogsResult {
  logs: RequestLogRow[];
  windowHours: number;
  isDemo: boolean;
  demoMode: boolean;
  isEmpty: boolean;
  error?: string;
}

const LOG_WINDOW_HOURS = 24;
const LOG_LIMIT = 100;

type UsageLogDbRow = {
  id: string;
  request_id: string;
  method: string;
  path: string;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
  api_keys: { key_prefix: string } | { key_prefix: string }[] | null;
};

function mapRow(row: UsageLogDbRow): RequestLogRow {
  const keyRelation = row.api_keys;
  const keyPrefix = Array.isArray(keyRelation)
    ? (keyRelation[0]?.key_prefix ?? null)
    : (keyRelation?.key_prefix ?? null);

  return {
    id: row.id,
    requestId: row.request_id,
    createdAt: row.created_at,
    method: row.method,
    path: row.path,
    statusCode: row.status_code,
    durationMs: row.duration_ms,
    keyPrefix,
  };
}

export async function getOrgRequestLogs(
  organizationId: string,
  isDemo: boolean,
): Promise<RequestLogsResult> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const since = new Date(
    Date.now() - LOG_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  if (!supabase && !admin) {
    return {
      logs: [],
      windowHours: LOG_WINDOW_HOURS,
      isDemo: true,
      demoMode: true,
      isEmpty: true,
    };
  }

  const client = admin ?? supabase;
  if (!client) {
    return {
      logs: [],
      windowHours: LOG_WINDOW_HOURS,
      isDemo,
      demoMode: true,
      isEmpty: true,
    };
  }

  const { data, error } = await client
    .from("api_usage_logs")
    .select(
      "id, request_id, method, path, status_code, duration_ms, created_at, api_keys ( key_prefix )",
    )
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(LOG_LIMIT);

  if (error) {
    return {
      logs: [],
      windowHours: LOG_WINDOW_HOURS,
      isDemo,
      demoMode: !admin,
      isEmpty: true,
      error: "No se pudieron cargar los registros de solicitudes.",
    };
  }

  const logs = (data ?? []).map((row) => mapRow(row as UsageLogDbRow));

  return {
    logs,
    windowHours: LOG_WINDOW_HOURS,
    isDemo,
    demoMode: !admin,
    isEmpty: logs.length === 0,
  };
}
