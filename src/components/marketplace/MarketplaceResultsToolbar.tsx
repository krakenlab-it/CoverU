"use client";

import { ArrowDownUpIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getActiveFilterChips,
} from "@/lib/marketplace/active-filters";
import { parseCompareIds } from "@/lib/marketplace/compare";
import {
  filtersToQueryString,
  marketplaceFiltersToSearchParams,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";
import { formatResultsRange } from "@/lib/marketplace/pagination";
import type { MarketplaceFilters } from "@/lib/marketplace/types";
import type { Insurer } from "@/lib/types/database";

const SORT_OPTIONS: { value: NonNullable<MarketplaceFilters["sort"]>; label: string }[] = [
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "deductible_asc", label: "Deducible: menor a mayor" },
  { value: "name_asc", label: "Nombre A–Z" },
];

interface MarketplaceResultsToolbarProps {
  insurers: Insurer[];
  totalCount: number;
  startIndex: number;
  endIndex: number;
  mobileFilters?: React.ReactNode;
}

export function MarketplaceResultsToolbar({
  insurers,
  totalCount,
  startIndex,
  endIndex,
  mobileFilters,
}: MarketplaceResultsToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseMarketplaceFilters(searchParams);
  const compareIds = parseCompareIds(searchParams.get("compare"));
  const activeChips = getActiveFilterChips(filters, insurers);

  const navigate = (next: Partial<MarketplaceFilters>) => {
    const merged = { ...filters, ...next, page: 1 };
    const qs = filtersToQueryString(merged, compareIds);
    startTransition(() => {
      router.push(`/app/marketplace${qs}`);
    });
  };

  const removeFilter = (key: keyof MarketplaceFilters) => {
    const next = { ...filters, page: 1 };
    switch (key) {
      case "keyword":
        next.keyword = undefined;
        break;
      case "age":
        next.age = undefined;
        break;
      case "gender":
        next.gender = undefined;
        break;
      case "region":
        next.region = undefined;
        break;
      case "insurerId":
        next.insurerId = undefined;
        break;
      case "category":
        next.category = undefined;
        break;
      case "deductibleMax":
        next.deductibleMax = undefined;
        break;
      case "waitingMaxDays":
        next.waitingMaxDays = undefined;
        break;
      case "sort":
        next.sort = "price_asc";
        break;
      case "page":
      case "pageSize":
        break;
      default: {
        const _exhaustive: never = key;
        return _exhaustive;
      }
    }
    const qs = filtersToQueryString(next, compareIds);
    startTransition(() => {
      router.push(`/app/marketplace${qs}`);
    });
  };

  const clearAllFilters = () => {
    const params = marketplaceFiltersToSearchParams(
      { pageSize: filters.pageSize },
      compareIds,
    );
    const qs = params.toString();
    startTransition(() => {
      router.push(`/app/marketplace${qs ? `?${qs}` : ""}`);
    });
  };

  return (
    <div
      className={`sticky top-0 z-10 -mx-1 space-y-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 ${isPending ? "opacity-80" : ""}`}
      aria-label="Barra de resultados"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground" aria-live="polite">
            {totalCount === 0
              ? "Sin resultados"
              : `${totalCount} plan${totalCount !== 1 ? "es" : ""} encontrado${totalCount !== 1 ? "s" : ""}`}
          </p>
          {totalCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {formatResultsRange(startIndex, endIndex, totalCount)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mobileFilters ? <div className="lg:hidden">{mobileFilters}</div> : null}
          <div className="flex items-center gap-2">
            <label htmlFor="marketplace-sort" className="sr-only">
              Ordenar resultados
            </label>
            <Select
              value={filters.sort ?? "price_asc"}
              onValueChange={(value) =>
                navigate({ sort: value as MarketplaceFilters["sort"] })
              }
            >
              <SelectTrigger
                id="marketplace-sort"
                size="sm"
                className="min-w-[180px] rounded-full"
                aria-label="Ordenar resultados"
              >
                <ArrowDownUpIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filtros activos:</span>
          {activeChips.map((chip) => (
            <Button
              key={chip.key}
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 rounded-full px-2.5 text-xs"
              onClick={() => removeFilter(chip.key)}
              aria-label={`Quitar filtro ${chip.label}: ${chip.value}`}
            >
              <span className="text-muted-foreground">{chip.label}:</span>
              <span className="font-medium">{chip.value}</span>
              <XIcon className="size-3" aria-hidden="true" />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-full text-xs"
            onClick={clearAllFilters}
          >
            Limpiar todo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
