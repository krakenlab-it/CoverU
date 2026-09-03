"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { BENEFIT_CATEGORIES } from "@/lib/marketplace/categories";
import {
  filtersToQueryString,
  marketplaceFiltersToSearchParams,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";
import type { MarketplaceFilters } from "@/lib/marketplace/types";
import { CHILE_REGIONS, GENDER_OPTIONS } from "@/lib/regions";
import type { Insurer } from "@/lib/types/database";

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
    <aside
      aria-label="Filtros de búsqueda"
      className="rounded-2xl border border-coveru-border bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Buscar y filtrar</h2>
        {isPending && (
          <span className="text-xs text-coveru-gray" aria-live="polite">
            Actualizando…
          </span>
        )}
      </div>

      <form
        className="mt-4 space-y-4"
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
            sort: (formData.get("sort") as MarketplaceFilters["sort"]) || "price_asc",
          });
        }}
      >
        <div>
          <label htmlFor="filter-q" className="block text-sm font-medium">
            Palabra clave
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={filters.keyword ?? ""}
            placeholder="Ej. hospitalización, maternidad"
            className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="filter-age" className="block text-sm font-medium">
              Edad
            </label>
            <input
              id="filter-age"
              name="age"
              type="number"
              min={18}
              max={99}
              defaultValue={filters.age ?? ""}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
            />
          </div>
          <div>
            <label htmlFor="filter-gender" className="block text-sm font-medium">
              Género
            </label>
            <select
              id="filter-gender"
              name="gender"
              defaultValue={filters.gender ?? ""}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
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

        <div>
          <label htmlFor="filter-region" className="block text-sm font-medium">
            Región
          </label>
          <select
            id="filter-region"
            name="region"
            defaultValue={filters.region ?? ""}
            className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
          >
            <option value="">Todas</option>
            {CHILE_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-insurer" className="block text-sm font-medium">
            Aseguradora
          </label>
          <select
            id="filter-insurer"
            name="insurer_id"
            defaultValue={filters.insurerId ?? ""}
            className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
          >
            <option value="">Todas</option>
            {insurers.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-category" className="block text-sm font-medium">
            Beneficio / categoría
          </label>
          <select
            id="filter-category"
            name="category"
            defaultValue={filters.category ?? ""}
            className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
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
          <div>
            <label htmlFor="filter-deductible" className="block text-sm font-medium">
              Deducible máx. (CLP)
            </label>
            <input
              id="filter-deductible"
              name="deductible_max"
              type="number"
              min={0}
              step={1000}
              defaultValue={filters.deductibleMax ?? ""}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
            />
          </div>
          <div>
            <label htmlFor="filter-waiting" className="block text-sm font-medium">
              Carencia máx. (días)
            </label>
            <input
              id="filter-waiting"
              name="waiting_max"
              type="number"
              min={0}
              defaultValue={filters.waitingMaxDays ?? ""}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-sort" className="block text-sm font-medium">
            Ordenar por
          </label>
          <select
            id="filter-sort"
            name="sort"
            defaultValue={filters.sort ?? "price_asc"}
            className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
          >
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="deductible_asc">Deducible: menor a mayor</option>
            <option value="name_asc">Nombre A–Z</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            className="rounded-full bg-coveru-red px-5 py-2 text-sm font-semibold text-white hover:bg-coveru-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-coveru-border px-5 py-2 text-sm font-medium hover:bg-coveru-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
          >
            Limpiar
          </button>
        </div>
      </form>
    </aside>
  );
}
