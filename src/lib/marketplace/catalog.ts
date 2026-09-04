import { CATEGORY_LABELS } from "@/lib/marketplace/categories";
import {
  deriveMatchedCategories,
  matchesCategoryWithFallback,
} from "@/lib/marketplace/category-match";
import { findMatchingTariff } from "@/lib/marketplace/tariff-match";
import type {
  ComparePlanEntry,
  MarketplaceFilters,
  MarketplacePlanResult,
  QuoteState,
  SortOption,
} from "@/lib/marketplace/types";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";
import type {
  Citation,
  CoverageClause,
  Exclusion,
  PlanVersion,
  PolicyDocument,
  WaitingPeriod,
} from "@/lib/types/phase1";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PlanVersionDetail {
  version: PlanVersion;
  plan: Plan;
  insurer: Insurer;
  coverage_clauses: CoverageClause[];
  exclusions: Exclusion[];
  waiting_periods: WaitingPeriod[];
  policy_documents: PolicyDocument[];
  citations: Citation[];
}

function getQuoteState(tariff: Tariff | null): QuoteState {
  if (!tariff) return "unavailable";
  return "quoted";
}

function buildHighlights(clauses: CoverageClause[]): string[] {
  return clauses
    .filter(
      (c) =>
        c.coverage_status === "covered" ||
        c.coverage_status === "conditional",
    )
    .slice(0, 3)
    .map((c) => c.title);
}

function buildExclusionWarnings(
  tariff: Tariff | null,
  exclusions: { title: string }[],
): string[] {
  const warnings: string[] = [];
  if (tariff?.exclusions?.length) {
    warnings.push(...tariff.exclusions.slice(0, 2));
  }
  exclusions.slice(0, 2).forEach((e) => {
    if (!warnings.includes(e.title)) warnings.push(e.title);
  });
  return warnings;
}

function buildWaitingWarnings(
  waitingPeriods: { days: number; service_category: string; notes: string | null }[],
): string[] {
  return waitingPeriods.map(
    (w) =>
      `Carencia ${w.days} días (${w.service_category.replace(/_/g, " ")})${w.notes ? `: ${w.notes}` : ""}`,
  );
}

function matchesKeyword(
  plan: Plan,
  insurer: Insurer,
  clauses: CoverageClause[],
  keyword: string,
): boolean {
  const haystack = [
    plan.name,
    plan.description ?? "",
    plan.coverage_summary ?? "",
    insurer.name,
    ...clauses.map((c) => `${c.title} ${c.description ?? ""} ${c.category}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function sortResults(
  results: MarketplacePlanResult[],
  sort: SortOption,
): MarketplacePlanResult[] {
  const copy = [...results];
  switch (sort) {
    case "price_asc":
      return copy.sort(
        (a, b) => (a.monthlyPrice ?? Infinity) - (b.monthlyPrice ?? Infinity),
      );
    case "price_desc":
      return copy.sort(
        (a, b) => (b.monthlyPrice ?? -1) - (a.monthlyPrice ?? -1),
      );
    case "deductible_asc":
      return copy.sort(
        (a, b) =>
          (a.tariff?.deductible ?? Infinity) -
          (b.tariff?.deductible ?? Infinity),
      );
    case "name_asc":
      return copy.sort((a, b) => a.plan.name.localeCompare(b.plan.name));
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

function buildResult(
  plan: Plan,
  insurer: Insurer,
  planVersion: PlanVersion,
  clauses: CoverageClause[],
  exclusions: Exclusion[],
  waitingPeriods: WaitingPeriod[],
  tariff: Tariff | null,
  filters: MarketplaceFilters,
): MarketplacePlanResult | null {
  if (
    filters.category &&
    !matchesCategoryWithFallback(clauses, filters.category, plan, tariff)
  ) {
    return null;
  }

  if (
    filters.keyword &&
    !matchesKeyword(plan, insurer, clauses, filters.keyword)
  ) {
    return null;
  }

  const maxWaiting = waitingPeriods.length
    ? Math.max(...waitingPeriods.map((w) => w.days))
    : null;

  if (
    filters.waitingMaxDays != null &&
    maxWaiting != null &&
    maxWaiting > filters.waitingMaxDays
  ) {
    return null;
  }

  if (
    filters.deductibleMax != null &&
    tariff?.deductible != null &&
    tariff.deductible > filters.deductibleMax
  ) {
    return null;
  }

  const quoteState = getQuoteState(tariff);

  return {
    plan,
    insurer,
    tariff,
    planVersion,
    quoteState,
    monthlyPrice: tariff?.monthly_price ?? null,
    coverageHighlights: buildHighlights(clauses),
    exclusionWarnings: buildExclusionWarnings(tariff, exclusions),
    waitingPeriodWarnings: buildWaitingWarnings(waitingPeriods),
    matchedCategories: deriveMatchedCategories(clauses, plan, tariff),
    maxWaitingDays: maxWaiting,
  };
}

type VersionRow = PlanVersion & {
  plan: Plan & { insurer: Insurer };
};

export async function searchMarketplace(
  filters: MarketplaceFilters,
): Promise<MarketplacePlanResult[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: versions, error } = await supabase
    .from("plan_versions")
    .select("*, plan:plans!inner(*, insurer:insurers(*))")
    .eq("status", "published");

  if (error || !versions?.length) return [];

  const versionRows = versions as VersionRow[];
  const versionIds = versionRows.map((v) => v.id);
  const planIds = [...new Set(versionRows.map((v) => v.plan_id))];

  const [
    { data: allClauses },
    { data: allExclusions },
    { data: allWaiting },
    { data: allTariffs },
  ] = await Promise.all([
    supabase
      .from("coverage_clauses")
      .select("*")
      .in("plan_version_id", versionIds)
      .order("sort_order"),
    supabase
      .from("exclusions")
      .select("*")
      .in("plan_version_id", versionIds)
      .order("sort_order"),
    supabase.from("waiting_periods").select("*").in("plan_version_id", versionIds),
    supabase.from("tariffs").select("*").in("plan_id", planIds),
  ]);

  const clausesByVersion = groupBy(allClauses ?? [], "plan_version_id");
  const exclusionsByVersion = groupBy(allExclusions ?? [], "plan_version_id");
  const waitingByVersion = groupBy(allWaiting ?? [], "plan_version_id");
  const tariffsByPlan = groupBy(allTariffs ?? [], "plan_id");

  const results: MarketplacePlanResult[] = [];

  for (const version of versionRows) {
    const plan = version.plan;
    const insurer = plan.insurer;

    if (filters.insurerId && plan.insurer_id !== filters.insurerId) continue;

    const clauses = (clausesByVersion.get(version.id) ??
      []) as CoverageClause[];
    const exclusions = (exclusionsByVersion.get(version.id) ??
      []) as Exclusion[];
    const waitingPeriods = (waitingByVersion.get(version.id) ??
      []) as WaitingPeriod[];
    const planTariffs = (tariffsByPlan.get(plan.id) ?? []) as Tariff[];
    const tariff = findMatchingTariff(planTariffs, {
      age: filters.age,
      gender: filters.gender,
      region: filters.region,
    });

    const result = buildResult(
      plan,
      insurer,
      version,
      clauses,
      exclusions,
      waitingPeriods,
      tariff,
      filters,
    );
    if (result) results.push(result);
  }

  return sortResults(results, filters.sort ?? "price_asc");
}

function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const id = String(item[key]);
    const list = map.get(id) ?? [];
    list.push(item);
    map.set(id, list);
  }
  return map;
}

export async function listInsurers(): Promise<Insurer[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("insurers")
    .select("*")
    .order("name");

  if (error || !data) return [];
  return data;
}

export async function getCompareEntries(
  planVersionIds: string[],
  filters: MarketplaceFilters,
): Promise<ComparePlanEntry[]> {
  const entries: ComparePlanEntry[] = [];

  for (const planVersionId of planVersionIds) {
    const detail = await getPlanVersionDetailForMarketplace(planVersionId);
    if (!detail) continue;

    const planTariffs = await fetchTariffsForPlan(detail.plan.id);
    const tariff = findMatchingTariff(planTariffs, {
      age: filters.age,
      gender: filters.gender,
      region: filters.region,
    });

    entries.push({
      planVersionId,
      plan: detail.plan,
      insurer: detail.insurer,
      planVersion: detail.version,
      tariff,
      quoteState: getQuoteState(tariff),
      monthlyPrice: tariff?.monthly_price ?? null,
    });
  }

  return entries;
}

async function fetchTariffsForPlan(planId: string): Promise<Tariff[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("tariffs")
    .select("*")
    .eq("plan_id", planId);

  return (data ?? []) as Tariff[];
}

export async function getPlanVersionDetailForMarketplace(
  planVersionId: string,
): Promise<PlanVersionDetail | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: version, error } = await supabase
    .from("plan_versions")
    .select(
      `
      *,
      plan:plans (
        *,
        insurer:insurers (*)
      )
    `,
    )
    .eq("id", planVersionId)
    .maybeSingle();

  if (error || !version) return null;

  if (version.status !== "published") return null;

  const plan = version.plan as Plan & { insurer: Insurer };
  const insurer = plan.insurer;

  const [
    { data: coverage_clauses },
    { data: exclusions },
    { data: waiting_periods },
    { data: policy_documents },
  ] = await Promise.all([
    supabase
      .from("coverage_clauses")
      .select("*")
      .eq("plan_version_id", planVersionId)
      .order("sort_order"),
    supabase
      .from("exclusions")
      .select("*")
      .eq("plan_version_id", planVersionId)
      .order("sort_order"),
    supabase
      .from("waiting_periods")
      .select("*")
      .eq("plan_version_id", planVersionId),
    supabase
      .from("policy_documents")
      .select("*")
      .eq("plan_version_id", planVersionId),
  ]);

  const docIds = (policy_documents ?? []).map((d) => d.id);
  let citations: Citation[] = [];

  if (docIds.length > 0) {
    const { data: citationRows } = await supabase
      .from("citations")
      .select("*")
      .in("policy_document_id", docIds);
    citations = (citationRows ?? []) as Citation[];
  }

  return {
    version: version as PlanVersion,
    plan,
    insurer,
    coverage_clauses: (coverage_clauses ?? []) as CoverageClause[],
    exclusions: (exclusions ?? []) as Exclusion[],
    waiting_periods: (waiting_periods ?? []) as WaitingPeriod[],
    policy_documents: (policy_documents ?? []) as PolicyDocument[],
    citations,
  };
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}

export async function listPublishedPlanVersions(): Promise<PlanVersion[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("plan_versions")
    .select("*")
    .eq("status", "published")
    .order("version_number", { ascending: false });

  return (data ?? []) as PlanVersion[];
}
