import { Suspense } from "react";
import { MarketplaceFiltersPanel } from "@/components/marketplace/MarketplaceFiltersPanel";
import { MarketplaceResultsGrid } from "@/components/marketplace/MarketplaceResultsGrid";
import { getDemoInsurers, searchMarketplace } from "@/lib/marketplace/catalog";
import { parseCompareIds } from "@/lib/marketplace/compare";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";
import type { MarketplacePlanResult } from "@/lib/marketplace/types";

export const metadata = {
  title: "Marketplace",
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
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
        <MarketplaceFiltersPanel insurers={insurers} compareIds={compareIds} />
      </Suspense>
      <div>
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Marketplace de seguros</h1>
          <p className="mt-1 text-sm text-coveru-gray">
            Busca, filtra y compara planes de salud. Todos los datos mostrados
            son de demostración.
          </p>
        </header>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white" />}>
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
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-white" />
          <div className="h-96 rounded-2xl bg-white" />
        </div>
      }
    >
      <MarketplaceContent searchParams={params} />
    </Suspense>
  );
}
