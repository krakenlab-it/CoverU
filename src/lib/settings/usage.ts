import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface UsageLogEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number | null;
  durationMs: number | null;
  createdAt: string;
}

export interface UsageSummary {
  totalRequests: number;
  windowHours: number;
  byEndpoint: { path: string; count: number }[];
  byStatus: { status: number; count: number }[];
  recentLogs: UsageLogEntry[];
  isDemo: boolean;
  demoMode: boolean;
  isEmpty: boolean;
  error?: string;
}

const USAGE_WINDOW_HOURS = 24;

function aggregateLogs(
  logs: UsageLogEntry[],
  isDemo: boolean,
  demoMode: boolean,
  error?: string,
): UsageSummary {
  const byEndpointMap = new Map<string, number>();
  const byStatusMap = new Map<number, number>();

  for (const log of logs) {
    byEndpointMap.set(log.path, (byEndpointMap.get(log.path) ?? 0) + 1);
    if (log.statusCode != null) {
      byStatusMap.set(
        log.statusCode,
        (byStatusMap.get(log.statusCode) ?? 0) + 1,
      );
    }
  }

  const byEndpoint = [...byEndpointMap.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byStatus = [...byStatusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRequests: logs.length,
    windowHours: USAGE_WINDOW_HOURS,
    byEndpoint,
    byStatus,
    recentLogs: logs.slice(0, 20),
    isDemo,
    demoMode,
    isEmpty: logs.length === 0,
    error,
  };
}

export async function getOrgUsageSummary(
  organizationId: string,
  isDemo: boolean,
): Promise<UsageSummary> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const since = new Date(
    Date.now() - USAGE_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  if (!supabase && !admin) {
    return aggregateLogs([], true, true);
  }

  const client = admin ?? supabase;
  if (!client) {
    return aggregateLogs([], isDemo, true);
  }

  const { data, error } = await client
    .from("api_usage_logs")
    .select("id, method, path, status_code, duration_ms, created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return aggregateLogs([], isDemo, !admin, "No se pudo cargar el uso de la API.");
  }

  const logs: UsageLogEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    method: row.method,
    path: row.path,
    statusCode: row.status_code,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  }));

  return aggregateLogs(logs, isDemo, !admin);
}
