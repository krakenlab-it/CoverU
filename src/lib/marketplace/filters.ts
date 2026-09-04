import { TARIFF_REGIONS, type TariffRegion } from "@/lib/catalog-enums";
import {
  normalizePage,
  normalizePageSize,
} from "@/lib/marketplace/pagination";
import type { SortOption, MarketplaceFilters } from "@/lib/marketplace/types";

const SORT_OPTIONS: SortOption[] = [
  "price_asc",
  "price_desc",
  "deductible_asc",
  "name_asc",
];

const TARIFF_REGION_VALUES = TARIFF_REGIONS.map((r) => r.value);

export function parseTariffRegion(value: string | null): TariffRegion | undefined {
  if (!value) return undefined;
  return TARIFF_REGION_VALUES.includes(value as TariffRegion)
    ? (value as TariffRegion)
    : undefined;
}

export function parseMarketplaceFilters(
  searchParams: URLSearchParams,
): MarketplaceFilters {
  const ageRaw = searchParams.get("age");
  const deductibleRaw = searchParams.get("deductible_max");
  const waitingRaw = searchParams.get("waiting_max");

  const sortRaw = searchParams.get("sort");
  const sort = SORT_OPTIONS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : "price_asc";

  const pageRaw = searchParams.get("page");
  const pageSizeRaw = searchParams.get("page_size");

  return {
    insurerId: searchParams.get("insurer_id") ?? undefined,
    age: ageRaw ? Number(ageRaw) : undefined,
    gender: searchParams.get("gender") ?? undefined,
    region: parseTariffRegion(searchParams.get("region")),
    category: searchParams.get("category") ?? undefined,
    deductibleMax: deductibleRaw ? Number(deductibleRaw) : undefined,
    waitingMaxDays: waitingRaw ? Number(waitingRaw) : undefined,
    keyword: searchParams.get("q")?.trim() || undefined,
    sort,
    page: pageRaw ? normalizePage(Number(pageRaw)) : undefined,
    pageSize: pageSizeRaw ? normalizePageSize(Number(pageSizeRaw)) : undefined,
  };
}

export function marketplaceFiltersToSearchParams(
  filters: MarketplaceFilters,
  compareIds?: string[],
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.insurerId) params.set("insurer_id", filters.insurerId);
  if (filters.age != null && !Number.isNaN(filters.age))
    params.set("age", String(filters.age));
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.region) params.set("region", filters.region);
  if (filters.category) params.set("category", filters.category);
  if (filters.deductibleMax != null && !Number.isNaN(filters.deductibleMax))
    params.set("deductible_max", String(filters.deductibleMax));
  if (filters.waitingMaxDays != null && !Number.isNaN(filters.waitingMaxDays))
    params.set("waiting_max", String(filters.waitingMaxDays));
  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.sort && filters.sort !== "price_asc")
    params.set("sort", filters.sort);
  if (filters.page != null && filters.page > 1)
    params.set("page", String(filters.page));
  if (filters.pageSize != null && filters.pageSize !== 12)
    params.set("page_size", String(filters.pageSize));
  if (compareIds && compareIds.length > 0)
    params.set("compare", compareIds.join(","));

  return params;
}

export function filtersToQueryString(
  filters: MarketplaceFilters,
  compareIds?: string[],
): string {
  const params = marketplaceFiltersToSearchParams(filters, compareIds);
  const str = params.toString();
  return str ? `?${str}` : "";
}
