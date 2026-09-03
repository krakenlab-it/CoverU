import Link from "next/link";
import { CompareMatrix } from "@/components/marketplace/CompareMatrix";
import { DemoAlert } from "@/components/platform/DemoAlert";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { PageHeader } from "@/components/platform/PageHeader";
import { Button } from "@/components/ui/button";
import { buildAppMetadata } from "@/lib/seo/metadata";
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

export const metadata = buildAppMetadata(
  "Comparar planes",
  "Comparación lado a lado de planes seleccionados en CoverÜ.",
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
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Panel", href: "/app/marketplace" },
              { label: "Marketplace", href: `/app/marketplace${filtersQuery}` },
              { label: "Comparar" },
            ]}
          />
        }
        title="Comparar planes"
        description={`Comparación lado a lado de hasta ${MAX_COMPARE_PLANS} planes seleccionados.`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/app/marketplace${filtersQuery}`}>← Volver al marketplace</Link>
          </Button>
        }
      />

      <DemoAlert compact />

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
