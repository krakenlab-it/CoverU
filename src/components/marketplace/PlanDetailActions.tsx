"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  canAddToCompare,
  parseCompareIds,
  toggleCompareId,
} from "@/lib/marketplace/compare";
import { filtersToQueryString } from "@/lib/marketplace/filters";
import type { MarketplaceFilters } from "@/lib/marketplace/types";

interface PlanDetailActionsProps {
  planVersionId: string;
  filters: MarketplaceFilters;
  backQuery: string;
}

export function PlanDetailActions({
  planVersionId,
  filters,
  backQuery,
}: PlanDetailActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareIds = parseCompareIds(searchParams.get("compare"));
  const isInCompare = compareIds.includes(planVersionId);
  const addCheck = canAddToCompare(compareIds, planVersionId);
  const compareDisabled = !isInCompare && !addCheck.allowed;

  const handleToggleCompare = () => {
    const nextIds = toggleCompareId(compareIds, planVersionId);
    const qs = filtersToQueryString(filters, nextIds);
    router.push(`/app/marketplace/plans/${planVersionId}${qs}`);
  };

  const compareHref = `/app/marketplace/compare${filtersToQueryString(
    filters,
    compareIds.length >= 2 ? compareIds : [...compareIds, planVersionId].slice(0, 4),
  )}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild className="rounded-full">
        <Link href={`/app/marketplace${backQuery}`}>← Marketplace</Link>
      </Button>
      <Button
        type="button"
        variant={isInCompare ? "secondary" : "brand"}
        size="sm"
        className="rounded-full"
        onClick={handleToggleCompare}
        disabled={compareDisabled}
        aria-pressed={isInCompare}
        title={compareDisabled ? addCheck.reason : undefined}
      >
        {isInCompare ? "En comparación" : "Comparar"}
      </Button>
      {compareIds.length >= 2 && (
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link href={compareHref}>Ver comparación</Link>
        </Button>
      )}
      <Button variant="ghost" size="sm" asChild className="rounded-full">
        <a href="#asistente-cobertura">
          Consultar asistente
        </a>
      </Button>
    </div>
  );
}
