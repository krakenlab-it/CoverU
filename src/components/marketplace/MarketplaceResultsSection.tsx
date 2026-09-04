"use client";

import { MarketplaceFiltersPanel } from "@/components/marketplace/MarketplaceFiltersPanel";
import { MarketplaceMobileFilters } from "@/components/marketplace/MarketplaceMobileFilters";
import { MarketplaceResultsGrid } from "@/components/marketplace/MarketplaceResultsGrid";
import { MarketplaceResultsToolbar } from "@/components/marketplace/MarketplaceResultsToolbar";
import { EmptyState } from "@/components/platform/EmptyState";
import type { MarketplaceFilters, MarketplacePlanResult } from "@/lib/marketplace/types";
import type { PaginatedSlice } from "@/lib/marketplace/pagination";
import type { Insurer } from "@/lib/types/database";

interface MarketplaceResultsSectionProps {
  results: MarketplacePlanResult[];
  filters: MarketplaceFilters;
  pagination: PaginatedSlice<MarketplacePlanResult>;
  insurers: Insurer[];
  compareIds: string[];
  isCatalogEmpty: boolean;
}

export function MarketplaceResultsSection({
  results,
  filters,
  pagination,
  insurers,
  compareIds,
  isCatalogEmpty,
}: MarketplaceResultsSectionProps) {
  if (isCatalogEmpty) {
    return (
      <EmptyState
        title="Catálogo vacío"
        description="Aún no hay planes publicados con tarifas cargadas. Cuando se importen los datos de aseguradoras, aparecerán aquí."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="hidden w-full shrink-0 lg:block lg:w-80 lg:sticky lg:top-4 lg:self-start">
        <MarketplaceFiltersPanel insurers={insurers} compareIds={compareIds} />
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <MarketplaceResultsToolbar
          insurers={insurers}
          totalCount={pagination.totalCount}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          mobileFilters={
            <MarketplaceMobileFilters insurers={insurers} compareIds={compareIds} />
          }
        />

        <MarketplaceResultsGrid
          results={results}
          filters={filters}
          pagination={pagination}
        />
      </div>
    </div>
  );
}
