import { Suspense } from "react";
import { MarketplaceResultsSection } from "@/components/marketplace/MarketplaceResultsSection";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { ErrorState } from "@/components/platform/ErrorState";
import { PageHeader } from "@/components/platform/PageHeader";
import { LoadingState } from "@/components/platform/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { listInsurers, searchMarketplace } from "@/lib/marketplace/catalog";
import { parseCompareIds } from "@/lib/marketplace/compare";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";
import { paginateArray } from "@/lib/marketplace/pagination";
import type { MarketplacePlanResult } from "@/lib/marketplace/types";

export const metadata = buildAppMetadata(
  "Marketplace",
  "Busca, filtra y compara planes de salud en el panel CoverÜ.",
);

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

function MarketplaceSkeleton() {
  return <LoadingState label="Cargando marketplace" />;
}

async function MarketplaceContent({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const filters = parseMarketplaceFilters(searchParams);
  const compareIds = parseCompareIds(searchParams.get("compare"));
  const insurers = await listInsurers();

  let results: MarketplacePlanResult[];
  let error: string | null = null;

  try {
    results = await searchMarketplace(filters);
  } catch {
    error = "No se pudo cargar el catálogo. Intenta de nuevo.";
    results = [];
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const pagination = paginateArray(results, filters.page, filters.pageSize);
  const isCatalogEmpty = results.length === 0 && !hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Panel", href: "/app" },
              { label: "Marketplace" },
            ]}
          />
        }
        title="Marketplace de seguros"
        description="Busca, filtra y compara planes de salud publicados en el catálogo."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <MarketplaceResultsSection
          results={results}
          filters={filters}
          pagination={pagination}
          insurers={insurers}
          compareIds={compareIds}
          isCatalogEmpty={isCatalogEmpty}
        />
      </Suspense>
    </div>
  );
}

function hasActiveFilters(filters: ReturnType<typeof parseMarketplaceFilters>): boolean {
  return Boolean(
    filters.keyword ||
      filters.age != null ||
      filters.gender ||
      filters.region ||
      filters.insurerId ||
      filters.category ||
      filters.deductibleMax != null ||
      filters.waitingMaxDays != null,
  );
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = toSearchParams(raw);

  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceContent searchParams={params} />
    </Suspense>
  );
}
