"use client";

import {
  Building2Icon,
  CircleDollarSignIcon,
  MapPinIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { countActiveFilters } from "@/lib/marketplace/active-filters";
import { BENEFIT_CATEGORIES } from "@/lib/marketplace/categories";
import {
  filtersToQueryString,
  marketplaceFiltersToSearchParams,
  parseMarketplaceFilters,
  parseTariffRegion,
} from "@/lib/marketplace/filters";
import type { MarketplaceFilters } from "@/lib/marketplace/types";
import { TARIFF_REGIONS } from "@/lib/catalog-enums";
import { GENDER_OPTIONS } from "@/lib/regions";
import type { Insurer } from "@/lib/types/database";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MarketplaceFiltersPanelProps {
  insurers: Insurer[];
  compareIds?: string[];
  className?: string;
  onApplied?: () => void;
}

const selectTriggerClass =
  "w-full rounded-lg border-input bg-background shadow-xs";

function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

export function MarketplaceFiltersPanel({
  insurers,
  compareIds = [],
  className,
  onApplied,
}: MarketplaceFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseMarketplaceFilters(searchParams);
  const activeFilterCount = countActiveFilters(filters);

  const applyFilters = useCallback(
    (next: Partial<MarketplaceFilters>) => {
      const merged = { ...filters, ...next, page: 1 };
      const qs = filtersToQueryString(merged, compareIds);
      startTransition(() => {
        router.push(`/app/marketplace${qs}`);
        onApplied?.();
      });
    },
    [compareIds, filters, onApplied, router],
  );

  const clearFilters = () => {
    const params = marketplaceFiltersToSearchParams(
      { pageSize: filters.pageSize },
      compareIds,
    );
    const qs = params.toString();
    startTransition(() => {
      router.push(`/app/marketplace${qs ? `?${qs}` : ""}`);
      onApplied?.();
    });
  };

  return (
    <aside aria-label="Filtros de búsqueda" className={className}>
      <Card className={cn(motion.panel, "overflow-hidden border-border/80 shadow-sm")}>
        <CardHeader className="space-y-3 border-b border-border/60 bg-muted/30 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontalIcon className="size-4 text-primary" aria-hidden="true" />
                Buscar y filtrar
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ajusta el perfil y los criterios del catálogo.
              </p>
            </div>
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </div>
          {isPending ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Actualizando resultados…
            </span>
          ) : null}
        </CardHeader>

        <CardContent className="p-4">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              applyFilters({
                keyword: String(formData.get("q") ?? "").trim() || undefined,
                age: formData.get("age")
                  ? Number(formData.get("age"))
                  : undefined,
                deductibleMax: formData.get("deductible_max")
                  ? Number(formData.get("deductible_max"))
                  : undefined,
                waitingMaxDays: formData.get("waiting_max")
                  ? Number(formData.get("waiting_max"))
                  : undefined,
              });
            }}
          >
            <FilterSection title="Búsqueda" icon={<SearchIcon className="size-3.5" aria-hidden="true" />}>
              <div className="space-y-2">
                <Label htmlFor="filter-q">Palabra clave</Label>
                <Input
                  id="filter-q"
                  name="q"
                  type="search"
                  defaultValue={filters.keyword ?? ""}
                  placeholder="Ej. hospitalización, maternidad"
                  className="rounded-lg"
                />
              </div>
            </FilterSection>

            <Separator />

            <FilterSection title="Perfil del asegurado" icon={<UserIcon className="size-3.5" aria-hidden="true" />}>
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
                    placeholder="Ej. 35"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-gender">Género</Label>
                  <Select
                    value={filters.gender ?? "any"}
                    onValueChange={(value) =>
                      applyFilters({
                        gender: value === "any" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger id="filter-gender" className={selectTriggerClass}>
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquiera</SelectItem>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-region">Región</Label>
                <Select
                  value={filters.region ?? "any"}
                  onValueChange={(value) =>
                    applyFilters({
                      region: value === "any" ? undefined : parseTariffRegion(value),
                    })
                  }
                >
                  <SelectTrigger id="filter-region" className={selectTriggerClass}>
                    <MapPinIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Todas</SelectItem>
                    {TARIFF_REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterSection>

            <Separator />

            <FilterSection title="Plan y cobertura" icon={<SparklesIcon className="size-3.5" aria-hidden="true" />}>
              <div className="space-y-2">
                <Label htmlFor="filter-insurer">Aseguradora</Label>
                <Select
                  value={filters.insurerId ?? "any"}
                  onValueChange={(value) =>
                    applyFilters({
                      insurerId: value === "any" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger id="filter-insurer" className={selectTriggerClass}>
                    <Building2Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Todas</SelectItem>
                    {insurers.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-category">Beneficio / categoría</Label>
                <Select
                  value={filters.category ?? "any"}
                  onValueChange={(value) =>
                    applyFilters({
                      category: value === "any" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger id="filter-category" className={selectTriggerClass}>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Todas</SelectItem>
                    {BENEFIT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterSection>

            <Separator />

            <FilterSection title="Límites económicos" icon={<CircleDollarSignIcon className="size-3.5" aria-hidden="true" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="filter-deductible">Deducible máx.</Label>
                  <Input
                    id="filter-deductible"
                    name="deductible_max"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={filters.deductibleMax ?? ""}
                    placeholder="Ej. 50000"
                    className="rounded-lg"
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
                    placeholder="Ej. 180"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </FilterSection>

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <Button type="submit" variant="brand" className="flex-1 rounded-full">
                <SearchIcon aria-hidden="true" />
                Aplicar filtros
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
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
