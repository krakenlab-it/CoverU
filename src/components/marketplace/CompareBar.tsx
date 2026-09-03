"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MAX_COMPARE_PLANS, MIN_COMPARE_PLANS } from "@/lib/marketplace/compare";
import { filtersToQueryString } from "@/lib/marketplace/filters";
import type { MarketplaceFilters } from "@/lib/marketplace/types";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface CompareBarProps {
  compareIds: string[];
  filters: MarketplaceFilters;
  planNames: Record<string, string>;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function CompareBar({
  compareIds,
  filters,
  planNames,
  onRemove,
  onClear,
}: CompareBarProps) {
  if (compareIds.length === 0) return null;

  const compareHref = `/app/marketplace/compare${filtersToQueryString(filters, compareIds)}`;
  const canCompare = compareIds.length >= MIN_COMPARE_PLANS;

  return (
    <div
      role="region"
      aria-label="Barra de comparación"
      aria-live="polite"
      className={cn(
        "sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-0 sm:rounded-t-xl",
        motion.slideUp,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            Comparar ({compareIds.length}/{MAX_COMPARE_PLANS})
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {compareIds.map((id) => (
              <li key={id}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onRemove(id)}
                  aria-label={`Quitar ${planNames[id] ?? "plan"} de la comparación`}
                >
                  {planNames[id] ?? id.slice(0, 8)}
                  <span aria-hidden="true">×</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={onClear}>
            Limpiar
          </Button>
          {canCompare ? (
            <Button variant="brand" className="rounded-full" asChild>
              <Link href={compareHref}>Ver comparación</Link>
            </Button>
          ) : (
            <span className="self-center text-xs text-muted-foreground">
              Selecciona al menos {MIN_COMPARE_PLANS} planes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
