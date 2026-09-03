"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareBar } from "@/components/marketplace/CompareBar";
import { MarketplacePlanCard } from "@/components/marketplace/MarketplacePlanCard";
import {
  canAddToCompare,
  parseCompareIds,
  serializeCompareIds,
  toggleCompareId,
} from "@/lib/marketplace/compare";
import { filtersToQueryString } from "@/lib/marketplace/filters";
import type { MarketplaceFilters, MarketplacePlanResult } from "@/lib/marketplace/types";

interface MarketplaceResultsGridProps {
  results: MarketplacePlanResult[];
  filters: MarketplaceFilters;
}

export function MarketplaceResultsGrid({
  results,
  filters,
}: MarketplaceResultsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareIds = useMemo(
    () => parseCompareIds(searchParams.get("compare")),
    [searchParams],
  );

  const planNames = useMemo(
    () =>
      Object.fromEntries(
        results.map((r) => [r.planVersion.id, r.plan.name]),
      ),
    [results],
  );

  const updateCompare = useCallback(
    (nextIds: string[]) => {
      const qs = filtersToQueryString(filters, nextIds);
      router.push(`/app/marketplace${qs}`);
    },
    [filters, router],
  );

  const handleToggle = (planVersionId: string) => {
    updateCompare(toggleCompareId(compareIds, planVersionId));
  };

  const handleRemove = (id: string) => {
    updateCompare(compareIds.filter((c) => c !== id));
  };

  const handleClear = () => updateCompare([]);

  if (results.length === 0) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-dashed border-coveru-border bg-white p-10 text-center"
      >
        <p className="text-lg font-semibold">No hay planes que coincidan</p>
        <p className="mt-2 text-sm text-coveru-gray">
          Prueba ajustar los filtros de edad, región, categoría o palabras clave.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-coveru-gray" aria-live="polite">
        {results.length} plan{results.length !== 1 ? "es" : ""} encontrado
        {results.length !== 1 ? "s" : ""}
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => {
          const { planVersion, plan, insurer } = result;
          const isSelected = compareIds.includes(planVersion.id);
          const addCheck = canAddToCompare(compareIds, planVersion.id);

          const detailQs = filtersToQueryString(filters, compareIds);
          const detailHref = `/app/marketplace/plans/${planVersion.id}${detailQs}`;

          return (
            <MarketplacePlanCard
              key={planVersion.id}
              planVersionId={planVersion.id}
              planName={plan.name}
              insurerName={insurer.name}
              isDemo={plan.is_demo}
              monthlyPrice={result.monthlyPrice}
              quoteState={result.quoteState}
              coverageHighlights={result.coverageHighlights}
              exclusionWarnings={result.exclusionWarnings}
              waitingPeriodWarnings={result.waitingPeriodWarnings}
              isSelectedForCompare={isSelected}
              compareDisabledReason={
                !isSelected && !addCheck.allowed ? addCheck.reason : undefined
              }
              detailHref={detailHref}
              onToggleCompare={() => handleToggle(planVersion.id)}
            />
          );
        })}
      </div>

      <CompareBar
        compareIds={compareIds}
        filters={filters}
        planNames={planNames}
        onRemove={handleRemove}
        onClear={handleClear}
      />
    </>
  );
}

export { serializeCompareIds, parseCompareIds };
