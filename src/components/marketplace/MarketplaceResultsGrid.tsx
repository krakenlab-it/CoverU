"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareBar } from "@/components/marketplace/CompareBar";
import { MarketplacePagination } from "@/components/marketplace/MarketplacePagination";
import { MarketplacePlanCard } from "@/components/marketplace/MarketplacePlanCard";
import { EmptyState } from "@/components/platform/EmptyState";
import {
  canAddToCompare,
  parseCompareIds,
  serializeCompareIds,
  toggleCompareId,
} from "@/lib/marketplace/compare";
import { filtersToQueryString } from "@/lib/marketplace/filters";
import type { MarketplaceFilters, MarketplacePlanResult } from "@/lib/marketplace/types";
import type { PaginatedSlice } from "@/lib/marketplace/pagination";
import { motion } from "@/lib/motion";

interface MarketplaceResultsGridProps {
  results: MarketplacePlanResult[];
  filters: MarketplaceFilters;
  pagination: PaginatedSlice<MarketplacePlanResult>;
}

export function MarketplaceResultsGrid({
  results,
  filters,
  pagination,
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

  if (pagination.totalCount === 0) {
    return (
      <EmptyState
        title="No hay planes que coincidan"
        description="Prueba ajustar los filtros de edad, región, categoría o palabras clave."
        showIllustration
      />
    );
  }

  return (
    <>
      <div className={`grid gap-5 md:grid-cols-2 xl:grid-cols-3 ${motion.fadeIn}`}>
        {pagination.items.map((result) => {
          const { planVersion, plan, insurer, tariff } = result;
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
              monthlyPrice={result.monthlyPrice}
              quoteState={result.quoteState}
              deductible={tariff?.deductible}
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

      <MarketplacePagination
        totalCount={pagination.totalCount}
        page={pagination.page}
        pageSize={pagination.pageSize}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        totalPages={pagination.totalPages}
      />

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
