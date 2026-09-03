"use client";

import Link from "next/link";
import { MAX_COMPARE_PLANS, MIN_COMPARE_PLANS } from "@/lib/marketplace/compare";
import { filtersToQueryString } from "@/lib/marketplace/filters";
import type { MarketplaceFilters } from "@/lib/marketplace/types";

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
      className="sticky bottom-0 z-20 border-t border-coveru-border bg-white p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            Comparar ({compareIds.length}/{MAX_COMPARE_PLANS})
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {compareIds.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="inline-flex items-center gap-1 rounded-full bg-coveru-light px-3 py-1 text-xs font-medium hover:bg-coveru-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
                  aria-label={`Quitar ${planNames[id] ?? "plan"} de la comparación`}
                >
                  {planNames[id] ?? id.slice(0, 8)}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-coveru-border px-4 py-2 text-sm font-medium hover:bg-coveru-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
          >
            Limpiar
          </button>
          {canCompare ? (
            <Link
              href={compareHref}
              className="rounded-full bg-coveru-red px-4 py-2 text-sm font-semibold text-white hover:bg-coveru-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
            >
              Ver comparación
            </Link>
          ) : (
            <span className="self-center text-xs text-coveru-gray">
              Selecciona al menos {MIN_COMPARE_PLANS} planes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
