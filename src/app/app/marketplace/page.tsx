import { Suspense } from "react";
import { MarketplaceFiltersPanel } from "@/components/marketplace/MarketplaceFiltersPanel";
import { MarketplaceResultsGrid } from "@/components/marketplace/MarketplaceResultsGrid";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { ErrorState } from "@/components/platform/ErrorState";
import { PageHeader } from "@/components/platform/PageHeader";
import { LoadingState } from "@/components/platform/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { getDemoInsurers, searchMarketplace } from "@/lib/marketplace/catalog";
import { parseCompareIds } from "@/lib/marketplace/compare";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";
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
  const insurers = getDemoInsurers();

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

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <MarketplaceFiltersPanel insurers={insurers} compareIds={compareIds} />
      </Suspense>
      <div>
        <PageHeader
          breadcrumbs={
            <Breadcrumbs
              items={[
                { label: "Panel", href: "/app/marketplace" },
                { label: "Marketplace" },
              ]}
            />
          }
          title="Marketplace de seguros"
          description="Busca, filtra y compara planes de salud. Todos los datos mostrados son de demostración."
          className="mb-4"
        />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <MarketplaceResultsGrid results={results} filters={filters} />
        </Suspense>
      </div>
    </div>
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
