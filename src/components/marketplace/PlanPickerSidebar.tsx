"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/coverage/tariff-snapshot";
import { formatCatalogDisplayName } from "@/lib/marketplace/display";
import {
  asistenteFiltersToSearchParams,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";
import {
  isPlanFavorite,
  readPlanFavorites,
  togglePlanFavorite,
} from "@/lib/marketplace/plan-favorites";
import type { MarketplaceFilters, MarketplacePlanResult } from "@/lib/marketplace/types";
import type { Insurer } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface PlanPickerSidebarProps {
  results: MarketplacePlanResult[];
  insurers: Insurer[];
  selectedPlanVersionId?: string;
}

function buildHref(
  filters: MarketplaceFilters,
  planVersionId: string,
): string {
  const params = asistenteFiltersToSearchParams(filters, planVersionId);
  const qs = params.toString();
  return `/app/asistente-cobertura${qs ? `?${qs}` : ""}`;
}

export function PlanPickerSidebar({
  results,
  insurers,
  selectedPlanVersionId,
}: PlanPickerSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filters = parseMarketplaceFilters(searchParams);

  const [keywordDraft, setKeywordDraft] = useState(filters.keyword ?? "");
  const [priceMinDraft, setPriceMinDraft] = useState(
    filters.priceMin != null ? String(filters.priceMin) : "",
  );
  const [priceMaxDraft, setPriceMaxDraft] = useState(
    filters.priceMax != null ? String(filters.priceMax) : "",
  );
  const [favorites, setFavorites] = useState<string[]>(() => readPlanFavorites());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const navigateWithFilters = useCallback(
    (next: Partial<MarketplaceFilters>, planVersionId?: string) => {
      const merged = { ...filters, ...next };
      const params = asistenteFiltersToSearchParams(
        merged,
        planVersionId ?? selectedPlanVersionId,
      );
      const qs = params.toString();
      startTransition(() => {
        router.push(`/app/asistente-cobertura${qs ? `?${qs}` : ""}`);
      });
    },
    [filters, router, selectedPlanVersionId],
  );

  const toggleInsurer = (insurerId: string) => {
    navigateWithFilters({
      insurerId: filters.insurerId === insurerId ? undefined : insurerId,
    });
  };

  const applyKeyword = useCallback(() => {
    const trimmed = keywordDraft.trim();
    if (trimmed === (filters.keyword ?? "")) return;
    navigateWithFilters({ keyword: trimmed || undefined });
  }, [filters.keyword, keywordDraft, navigateWithFilters]);

  useEffect(() => {
    const trimmed = keywordDraft.trim();
    if (trimmed === (filters.keyword ?? "")) return;

    const timer = window.setTimeout(() => {
      navigateWithFilters({ keyword: trimmed || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keywordDraft, filters.keyword, navigateWithFilters]);

  const applyPriceRange = () => {
    const priceMin = priceMinDraft ? Number(priceMinDraft) : undefined;
    const priceMax = priceMaxDraft ? Number(priceMaxDraft) : undefined;
    navigateWithFilters({
      priceMin: priceMin != null && !Number.isNaN(priceMin) ? priceMin : undefined,
      priceMax: priceMax != null && !Number.isNaN(priceMax) ? priceMax : undefined,
    });
  };

  const clearFilters = () => {
    setKeywordDraft("");
    setPriceMinDraft("");
    setPriceMaxDraft("");
    setFavoritesOnly(false);
    const params = asistenteFiltersToSearchParams(
      {},
      selectedPlanVersionId,
    );
    const qs = params.toString();
    startTransition(() => {
      router.push(`/app/asistente-cobertura${qs ? `?${qs}` : ""}`);
    });
  };

  const handleToggleFavorite = (
    event: React.MouseEvent,
    planVersionId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const next = togglePlanFavorite(planVersionId);
    setFavorites(next);
  };

  const visibleResults = useMemo(() => {
    if (!favoritesOnly) return results;
    return results.filter((result) =>
      isPlanFavorite(result.planVersion.id, favorites),
    );
  }, [favorites, favoritesOnly, results]);

  const hasActiveFilters =
    Boolean(filters.insurerId) ||
    Boolean(filters.keyword) ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    favoritesOnly;

  return (
    <aside
      className="flex max-h-[calc(100vh-10rem)] flex-col rounded-2xl border border-coveru-border bg-white p-4"
      aria-label="Selector de plan activo"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Plan activo</h2>
        {isPending ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Actualizando…
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan-picker-search" className="text-xs">
            Buscar por nombre
          </Label>
          <Input
            id="plan-picker-search"
            type="search"
            value={keywordDraft}
            onChange={(event) => setKeywordDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyKeyword();
              }
            }}
            placeholder="Ej. SIGMA, GMM, Austro"
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Aseguradora</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por aseguradora">
            {insurers.map((insurer) => {
              const active = filters.insurerId === insurer.id;
              return (
                <button
                  key={insurer.id}
                  type="button"
                  onClick={() => toggleInsurer(insurer.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  <span
                    className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase"
                    aria-hidden="true"
                  >
                    {insurer.name.slice(0, 1)}
                  </span>
                  {insurer.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Precio mensual (USD)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              step={1}
              value={priceMinDraft}
              onChange={(event) => setPriceMinDraft(event.target.value)}
              onBlur={applyPriceRange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPriceRange();
                }
              }}
              placeholder="Mín."
              aria-label="Precio mínimo mensual"
              className="h-9"
            />
            <Input
              type="number"
              min={0}
              step={1}
              value={priceMaxDraft}
              onChange={(event) => setPriceMaxDraft(event.target.value)}
              onBlur={applyPriceRange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPriceRange();
                }
              }}
              placeholder="Máx."
              aria-label="Precio máximo mensual"
              className="h-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFavoritesOnly((current) => !current)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              favoritesOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
            aria-pressed={favoritesOnly}
          >
            <Star
              className={cn("size-3.5", favoritesOnly && "fill-current")}
              aria-hidden="true"
            />
            Solo guardados
          </button>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-2 text-xs"
              onClick={clearFilters}
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {visibleResults.length} de {results.length} planes
      </p>

      <ul className="mt-2 -mx-1 flex-1 space-y-1 overflow-y-auto px-1 pb-1">
        {visibleResults.length === 0 ? (
          <li className="rounded-lg px-3 py-6 text-center text-sm text-muted-foreground">
            {favoritesOnly
              ? "No hay planes guardados con estos filtros."
              : "Ningún plan coincide con los filtros."}
          </li>
        ) : (
          visibleResults.map((result) => {
            const active = result.planVersion.id === selectedPlanVersionId;
            const favorite = isPlanFavorite(result.planVersion.id, favorites);
            return (
              <li key={result.planVersion.id}>
                <Link
                  href={buildHref(filters, result.planVersion.id)}
                  className={cn(
                    "group flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <button
                    type="button"
                    onClick={(event) =>
                      handleToggleFavorite(event, result.planVersion.id)
                    }
                    className={cn(
                      "mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-primary",
                      favorite && "text-primary",
                    )}
                    aria-label={
                      favorite
                        ? `Quitar ${result.plan.name} de guardados`
                        : `Guardar ${result.plan.name}`
                    }
                    aria-pressed={favorite}
                  >
                    <Star
                      className={cn("size-3.5", favorite && "fill-current")}
                    />
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {formatCatalogDisplayName(result.plan.name)}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-coveru-gray">
                      <span>{formatCatalogDisplayName(result.insurer.name)}</span>
                      {result.monthlyPrice != null ? (
                        <span>{formatUsd(result.monthlyPrice)}/mes</span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
