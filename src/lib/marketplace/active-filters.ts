import { getTariffRegionLabel } from "@/lib/catalog-enums";
import { CATEGORY_LABELS } from "@/lib/marketplace/categories";
import type { MarketplaceFilters } from "@/lib/marketplace/types";
import { GENDER_OPTIONS } from "@/lib/regions";
import type { Insurer } from "@/lib/types/database";

export interface ActiveFilterChip {
  key: keyof MarketplaceFilters;
  label: string;
  value: string;
}

const SORT_LABELS: Record<NonNullable<MarketplaceFilters["sort"]>, string> = {
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
  deductible_asc: "Deducible: menor a mayor",
  name_asc: "Nombre A–Z",
};

function getGenderLabel(value: string): string {
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value;
}

export function getActiveFilterChips(
  filters: MarketplaceFilters,
  insurers: Insurer[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.keyword) {
    chips.push({
      key: "keyword",
      label: "Búsqueda",
      value: filters.keyword,
    });
  }

  if (filters.age != null) {
    chips.push({
      key: "age",
      label: "Edad",
      value: `${filters.age} años`,
    });
  }

  if (filters.gender) {
    chips.push({
      key: "gender",
      label: "Género",
      value: getGenderLabel(filters.gender),
    });
  }

  if (filters.region) {
    chips.push({
      key: "region",
      label: "Región",
      value: getTariffRegionLabel(filters.region),
    });
  }

  if (filters.insurerId) {
    const insurer = insurers.find((i) => i.id === filters.insurerId);
    chips.push({
      key: "insurerId",
      label: "Aseguradora",
      value: insurer?.name ?? filters.insurerId,
    });
  }

  if (filters.category) {
    chips.push({
      key: "category",
      label: "Categoría",
      value: CATEGORY_LABELS[filters.category] ?? filters.category,
    });
  }

  if (filters.deductibleMax != null) {
    chips.push({
      key: "deductibleMax",
      label: "Deducible máx.",
      value: `$${filters.deductibleMax.toLocaleString("es-CL")}`,
    });
  }

  if (filters.waitingMaxDays != null) {
    chips.push({
      key: "waitingMaxDays",
      label: "Carencia máx.",
      value: `${filters.waitingMaxDays} días`,
    });
  }

  if (filters.sort && filters.sort !== "price_asc") {
    chips.push({
      key: "sort",
      label: "Orden",
      value: SORT_LABELS[filters.sort],
    });
  }

  return chips;
}

export function countActiveFilters(filters: MarketplaceFilters): number {
  let count = 0;
  if (filters.keyword) count += 1;
  if (filters.age != null) count += 1;
  if (filters.gender) count += 1;
  if (filters.region) count += 1;
  if (filters.insurerId) count += 1;
  if (filters.category) count += 1;
  if (filters.deductibleMax != null) count += 1;
  if (filters.waitingMaxDays != null) count += 1;
  if (filters.sort && filters.sort !== "price_asc") count += 1;
  return count;
}
