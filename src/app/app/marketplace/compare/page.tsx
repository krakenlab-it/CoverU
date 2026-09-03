import Link from "next/link";
import { CompareMatrix } from "@/components/marketplace/CompareMatrix";
import { DemoBanner } from "@/components/marketplace/DemoBanner";
import {
  getCompareEntries,
  getPlanVersionDetailForMarketplace,
} from "@/lib/marketplace/catalog";
import { MAX_COMPARE_PLANS } from "@/lib/marketplace/compare";
import {
  filtersToQueryString,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";
import { parseCompareIds } from "@/lib/marketplace/compare";
import type {
  CoverageClause,
  Exclusion,
  WaitingPeriod,
} from "@/lib/types/phase1";

export const metadata = {
  title: "Comparar planes",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = toSearchParams(raw);
  const filters = parseMarketplaceFilters(params);
  const compareIds = parseCompareIds(params.get("compare"));
  const filtersQuery = filtersToQueryString(filters, compareIds);

  const entries = getCompareEntries(compareIds, filters);

  const clausesByPlan: Record<string, CoverageClause[]> = {};
  const exclusionsByPlan: Record<string, Exclusion[]> = {};
  const waitingByPlan: Record<string, WaitingPeriod[]> = {};

  for (const id of compareIds) {
    const detail = getPlanVersionDetailForMarketplace(id);
    if (detail) {
      clausesByPlan[id] = detail.coverage_clauses;
      exclusionsByPlan[id] = detail.exclusions;
      waitingByPlan[id] = detail.waiting_periods;
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comparar planes</h1>
          <p className="mt-1 text-sm text-coveru-gray">
            Comparación lado a lado de hasta {MAX_COMPARE_PLANS} planes
            seleccionados.
          </p>
        </div>
        <Link
          href={`/app/marketplace${filtersQuery}`}
          className="text-sm font-semibold text-coveru-red hover:text-coveru-red-dark"
        >
          ← Volver al marketplace
        </Link>
      </header>

      <DemoBanner compact />

      <CompareMatrix
        entries={entries}
        clausesByPlan={clausesByPlan}
        exclusionsByPlan={exclusionsByPlan}
        waitingByPlan={waitingByPlan}
        filtersQuery={filtersQuery}
      />
    </div>
  );
}
