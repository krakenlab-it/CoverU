import {
  DEMO_INSURERS,
  DEMO_PLANS,
  DEMO_PLAN_VERSIONS,
  findMatchingTariff,
  getDemoPlanVersionDetail,
  getLatestPlanVersionForPlan,
} from "@/lib/demo-api-data";
import { CATEGORY_LABELS } from "@/lib/marketplace/categories";
import type {
  ComparePlanEntry,
  MarketplaceFilters,
  MarketplacePlanResult,
  QuoteState,
  SortOption,
} from "@/lib/marketplace/types";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";
import type { CoverageClause, PlanVersion } from "@/lib/types/phase1";
import { createAdminClient } from "@/lib/supabase/admin";

function getQuoteState(tariff: Tariff | null): QuoteState {
  if (!tariff) return "unavailable";
  if (tariff.is_demo) return "indicative";
  return "quoted";
}

function buildHighlights(clauses: CoverageClause[]): string[] {
  return clauses
    .filter((c) => c.coverage_status === "covered" || c.coverage_status === "conditional")
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

function matchesCategory(clauses: CoverageClause[], category: string): boolean {
  return clauses.some(
    (c) =>
      c.category === category &&
      (c.coverage_status === "covered" || c.coverage_status === "conditional"),
  );
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

function buildDemoResult(
  plan: Plan,
  insurer: Insurer,
  planVersion: PlanVersion,
  filters: MarketplaceFilters,
): MarketplacePlanResult | null {
  const detail = getDemoPlanVersionDetail(planVersion.id);
  if (!detail) return null;

  const clauses = detail.coverage_clauses;
  const waitingPeriods = detail.waiting_periods;

  if (filters.category && !matchesCategory(clauses, filters.category)) {
    return null;
  }

  if (filters.keyword && !matchesKeyword(plan, insurer, clauses, filters.keyword)) {
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

  const tariff = findMatchingTariff(plan.id, {
    age: filters.age,
    gender: filters.gender,
    region: filters.region,
  });

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
    exclusionWarnings: buildExclusionWarnings(
      tariff,
      detail.exclusions,
    ),
    waitingPeriodWarnings: buildWaitingWarnings(waitingPeriods),
    matchedCategories: clauses
      .filter((c) => c.coverage_status !== "not_covered")
      .map((c) => c.category),
    maxWaitingDays: maxWaiting,
  };
}

export function searchDemoMarketplace(
  filters: MarketplaceFilters,
): MarketplacePlanResult[] {
  let plans = [...DEMO_PLANS];

  if (filters.insurerId) {
    plans = plans.filter((p) => p.insurer_id === filters.insurerId);
  }

  const results: MarketplacePlanResult[] = [];

  for (const plan of plans) {
    const insurer = DEMO_INSURERS.find((i) => i.id === plan.insurer_id);
    if (!insurer) continue;

    const planVersion = getLatestPlanVersionForPlan(plan.id);
    if (!planVersion) continue;

    const result = buildDemoResult(plan, insurer, planVersion, filters);
    if (result) results.push(result);
  }

  return sortResults(results, filters.sort ?? "price_asc");
}

export async function searchMarketplace(
  filters: MarketplaceFilters,
): Promise<MarketplacePlanResult[]> {
  const supabase = createAdminClient();
  if (!supabase) {
    return searchDemoMarketplace(filters);
  }

  // Fallback to demo when Supabase is configured but catalog isn't fully wired
  return searchDemoMarketplace(filters);
}

export function getDemoInsurers() {
  return DEMO_INSURERS;
}

export function getCompareEntries(
  planVersionIds: string[],
  filters: MarketplaceFilters,
): ComparePlanEntry[] {
  const entries: ComparePlanEntry[] = [];

  for (const planVersionId of planVersionIds) {
    const detail = getDemoPlanVersionDetail(planVersionId);
    if (!detail?.plan || !detail.insurer || !detail.version) continue;

    const tariff = findMatchingTariff(detail.plan.id, {
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

export function getPlanVersionDetailForMarketplace(planVersionId: string) {
  return getDemoPlanVersionDetail(planVersionId);
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}

export function listPublishedPlanVersions(): PlanVersion[] {
  return DEMO_PLAN_VERSIONS.filter((v) => v.status === "published");
}
