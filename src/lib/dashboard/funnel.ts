/**
 * Funnel reporting for the app dashboard.
 *
 * Counts come from public.funnel_events only — the same rows the emitter writes
 * — so the dashboard cannot drift from what was recorded. Rows are read with
 * the service role, which bypasses RLS, so the organization filter is applied
 * explicitly and mirrors the `funnel_events_org_read` policy: the caller's
 * organization plus the unattributed public funnel (`organization_id IS NULL`).
 */
import { FUNNEL_STEPS, type FunnelStep } from "@/lib/analytics/funnel-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/settings/session";

export const FUNNEL_WINDOW_DAYS = 30;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const FUNNEL_STEP_LABELS: Record<FunnelStep, string> = {
  lead: "Lead capturado",
  quote: "Cotización",
  advisor_request: "Solicitud de asesor",
};

export interface FunnelStepCount {
  step: FunnelStep;
  label: string;
  count: number;
}

export interface FunnelDayCount {
  date: string;
  counts: Record<FunnelStep, number>;
}

export interface FunnelSummary {
  windowDays: number;
  steps: FunnelStepCount[];
  byDay: FunnelDayCount[];
  totalEvents: number;
  serviceConfigured: boolean;
  isEmpty: boolean;
  error?: string;
}

export interface FunnelEventPoint {
  step: string;
  created_at: string;
}

function isFunnelStep(value: string): value is FunnelStep {
  return (FUNNEL_STEPS as readonly string[]).includes(value);
}

function emptyCounts(): Record<FunnelStep, number> {
  return { lead: 0, quote: 0, advisor_request: 0 };
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Pure aggregation over raw event points, newest last. Days with no events are
 * included as zeros so a gap in the funnel is visible rather than skipped.
 */
export function buildFunnelSummary(
  points: FunnelEventPoint[],
  serviceConfigured: boolean,
  windowDays = FUNNEL_WINDOW_DAYS,
): FunnelSummary {
  const totals = emptyCounts();
  const byDay = new Map<string, Record<FunnelStep, number>>();

  const now = new Date();
  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    byDay.set(dayKey(date), emptyCounts());
  }

  for (const point of points) {
    if (!isFunnelStep(point.step)) continue;
    totals[point.step] += 1;

    const bucket = byDay.get(point.created_at.slice(0, 10));
    if (bucket) bucket[point.step] += 1;
  }

  const steps: FunnelStepCount[] = FUNNEL_STEPS.map((step) => ({
    step,
    label: FUNNEL_STEP_LABELS[step],
    count: totals[step],
  }));

  const totalEvents = FUNNEL_STEPS.reduce((sum, step) => sum + totals[step], 0);

  return {
    windowDays,
    steps,
    byDay: [...byDay.entries()].map(([date, counts]) => ({ date, counts })),
    totalEvents,
    serviceConfigured,
    isEmpty: totalEvents === 0,
  };
}

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Funnel counts for the dashboard. Returns an honest empty summary when Supabase
 * is unconfigured (demo mode) instead of inventing numbers.
 */
export async function getFunnelSummary(
  organizationId: string,
  windowDays = FUNNEL_WINDOW_DAYS,
): Promise<FunnelSummary> {
  if (!hasServiceRole()) {
    return buildFunnelSummary([], false, windowDays);
  }

  const admin = createAdminClient();
  if (!admin) {
    return buildFunnelSummary([], false, windowDays);
  }

  // The id comes from the session, but it is interpolated into a PostgREST
  // filter, so an unexpected value is rejected rather than passed through.
  if (!UUID_PATTERN.test(organizationId)) {
    return buildFunnelSummary([], true, windowDays);
  }

  const { data, error } = await admin
    .from("funnel_events")
    .select("step, created_at")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .gte("created_at", sinceIso(windowDays))
    .order("created_at", { ascending: true })
    .limit(10_000);

  if (error) {
    return {
      ...buildFunnelSummary([], true, windowDays),
      error: "No se pudieron cargar los datos del embudo.",
    };
  }

  return buildFunnelSummary(
    (data ?? []).map((row) => ({
      step: String(row.step),
      created_at: String(row.created_at),
    })),
    true,
    windowDays,
  );
}
