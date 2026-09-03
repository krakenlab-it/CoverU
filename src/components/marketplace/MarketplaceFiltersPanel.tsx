"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BENEFIT_CATEGORIES } from "@/lib/marketplace/categories";
import {
  filtersToQueryString,
  marketplaceFiltersToSearchParams,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";
import type { MarketplaceFilters } from "@/lib/marketplace/types";
import { DEMO_REGIONS, GENDER_OPTIONS } from "@/lib/regions";
import type { Insurer } from "@/lib/types/database";
import { motion } from "@/lib/motion";

interface MarketplaceFiltersPanelProps {
  insurers: Insurer[];
  compareIds?: string[];
}

export function MarketplaceFiltersPanel({
  insurers,
  compareIds = [],
}: MarketplaceFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseMarketplaceFilters(searchParams);

  const applyFilters = useCallback(
    (next: Partial<MarketplaceFilters>) => {
      const merged = { ...filters, ...next };
      const qs = filtersToQueryString(merged, compareIds);
      startTransition(() => {
        router.push(`/app/marketplace${qs}`);
      });
    },
    [filters, compareIds, router],
  );

  const clearFilters = () => {
    const params = marketplaceFiltersToSearchParams({}, compareIds);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/app/marketplace${qs ? `?${qs}` : ""}`);
    });
  };

  return (
    <aside aria-label="Filtros de búsqueda">
      <Card className={motion.panel}>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Buscar y filtrar</CardTitle>
          {isPending ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Actualizando…
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              applyFilters({
                keyword: String(formData.get("q") ?? "").trim() || undefined,
                age: formData.get("age")
                  ? Number(formData.get("age"))
                  : undefined,
                gender: String(formData.get("gender") || "") || undefined,
                region: String(formData.get("region") || "") || undefined,
                insurerId: String(formData.get("insurer_id") || "") || undefined,
                category: String(formData.get("category") || "") || undefined,
                deductibleMax: formData.get("deductible_max")
                  ? Number(formData.get("deductible_max"))
                  : undefined,
                waitingMaxDays: formData.get("waiting_max")
                  ? Number(formData.get("waiting_max"))
                  : undefined,
                sort:
                  (formData.get("sort") as MarketplaceFilters["sort"]) ||
                  "price_asc",
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="filter-q">Palabra clave</Label>
              <Input
                id="filter-q"
                name="q"
                type="search"
                defaultValue={filters.keyword ?? ""}
                placeholder="Ej. hospitalización, maternidad"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="filter-age">Edad</Label>
                <Input
                  id="filter-age"
                  name="age"
                  type="number"
                  min={18}
                  max={99}
                  defaultValue={filters.age ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-gender">Género</Label>
                <select
                  id="filter-gender"
                  name="gender"
                  defaultValue={filters.gender ?? ""}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">Cualquiera</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-region">Provincia</Label>
              <select
                id="filter-region"
                name="region"
                defaultValue={filters.region ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Todas</option>
                {DEMO_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-insurer">Aseguradora</Label>
              <select
                id="filter-insurer"
                name="insurer_id"
                defaultValue={filters.insurerId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Todas</option>
                {insurers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-category">Beneficio / categoría</Label>
              <select
                id="filter-category"
                name="category"
                defaultValue={filters.category ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Todas</option>
                {BENEFIT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="filter-deductible">Deducible máx. (demo)</Label>
                <Input
                  id="filter-deductible"
                  name="deductible_max"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={filters.deductibleMax ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-waiting">Carencia máx. (días)</Label>
                <Input
                  id="filter-waiting"
                  name="waiting_max"
                  type="number"
                  min={0}
                  defaultValue={filters.waitingMaxDays ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-sort">Ordenar por</Label>
              <select
                id="filter-sort"
                name="sort"
                defaultValue={filters.sort ?? "price_asc"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="deductible_asc">Deducible: menor a mayor</option>
                <option value="name_asc">Nombre A–Z</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" variant="brand" className="rounded-full">
                Aplicar filtros
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </aside>
  );
}
