import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/settings/session";
import type { RequestLogRow } from "@/lib/settings/request-logs";

export interface CatalogCounts {
  insurers: number;
  publishedPlans: number;
  tariffs: number;
}

export interface UsageWindowSummary {
  totalRequests: number;
  windowHours: number;
}

export interface UsageByDay {
  date: string;
  count: number;
}

export interface DashboardAnalytics {
  catalog: CatalogCounts;
  usage24h: UsageWindowSummary;
  usage7d: UsageWindowSummary;
  usageByDay: UsageByDay[];
  recentActivity: RequestLogRow[];
  serviceConfigured: boolean;
  isEmpty: boolean;
  error?: string;
}

const HOURS_24 = 24;
const HOURS_7D = 24 * 7;

function emptyAnalytics(serviceConfigured: boolean, error?: string): DashboardAnalytics {
  return {
    catalog: { insurers: 0, publishedPlans: 0, tariffs: 0 },
    usage24h: { totalRequests: 0, windowHours: HOURS_24 },
    usage7d: { totalRequests: 0, windowHours: HOURS_7D },
    usageByDay: [],
    recentActivity: [],
    serviceConfigured,
    isEmpty: true,
    error,
  };
}

function sinceIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function buildUsageByDay(
  logs: { created_at: string }[],
  days = 7,
): UsageByDay[] {
  const counts = new Map<string, number>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    counts.set(key, 0);
  }

  for (const log of logs) {
    const key = log.created_at.slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

type ActivityRow = {
  id: string;
  request_id: string;
  method: string;
  path: string;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
  plan_version_id: string | null;
  plan_id: string | null;
  api_keys: { key_prefix: string } | { key_prefix: string }[] | null;
};

function mapActivityRow(row: ActivityRow): RequestLogRow {
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
    planVersionId: row.plan_version_id,
    planId: row.plan_id,
  };
}

export async function getDashboardAnalytics(
  organizationId: string,
): Promise<DashboardAnalytics> {
  if (!hasServiceRole()) {
    return emptyAnalytics(false);
  }

  const admin = createAdminClient();
  if (!admin) {
    return emptyAnalytics(false);
  }

  const since7d = sinceIso(HOURS_7D);
  const since24h = sinceIso(HOURS_24);

  const [
    insurersResult,
    plansResult,
    tariffsResult,
    logs7dResult,
    recentResult,
  ] = await Promise.all([
    admin.from("insurers").select("id", { count: "exact", head: true }),
    admin
      .from("plan_versions")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    admin.from("tariffs").select("id", { count: "exact", head: true }),
    admin
      .from("api_usage_logs")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", since7d),
    admin
      .from("api_usage_logs")
      .select(
        "id, request_id, method, path, status_code, duration_ms, created_at, plan_version_id, plan_id, api_keys ( key_prefix )",
      )
      .eq("organization_id", organizationId)
      .gte("created_at", since7d)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (logs7dResult.error) {
    return emptyAnalytics(true, "No se pudieron cargar las analíticas del panel.");
  }

  const logs7d = logs7dResult.data ?? [];
  const logs24h = logs7d.filter((log) => log.created_at >= since24h);
  const recentActivity = (recentResult.data ?? []).map((row) =>
    mapActivityRow(row as ActivityRow),
  );

  const catalog: CatalogCounts = {
    insurers: insurersResult.count ?? 0,
    publishedPlans: plansResult.count ?? 0,
    tariffs: tariffsResult.count ?? 0,
  };

  const hasCatalog = catalog.insurers > 0 || catalog.publishedPlans > 0;
  const hasUsage = logs7d.length > 0;

  return {
    catalog,
    usage24h: { totalRequests: logs24h.length, windowHours: HOURS_24 },
    usage7d: { totalRequests: logs7d.length, windowHours: HOURS_7D },
    usageByDay: buildUsageByDay(logs7d),
    recentActivity,
    serviceConfigured: true,
    isEmpty: !hasCatalog && !hasUsage,
  };
}
