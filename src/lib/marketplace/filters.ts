import { TARIFF_REGIONS, type TariffRegion } from "@/lib/catalog-enums";
import { GENDER_OPTIONS } from "@/lib/regions";
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
const GENDER_VALUES = GENDER_OPTIONS.map((option) => option.value);

function parseFiniteNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseGender(value: string | null): string | undefined {
  if (!value) return undefined;
  return GENDER_VALUES.includes(value as (typeof GENDER_VALUES)[number])
    ? value
    : undefined;
}

export function parseTariffRegion(value: string | null): TariffRegion | undefined {
  if (!value) return undefined;
  return TARIFF_REGION_VALUES.includes(value as TariffRegion)
    ? (value as TariffRegion)
    : undefined;
}

export function parseMarketplaceFilters(
  searchParams: URLSearchParams,
): MarketplaceFilters {
  const sortRaw = searchParams.get("sort");
  const sort = SORT_OPTIONS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : "price_asc";

  const pageRaw = searchParams.get("page");
  const pageSizeRaw = searchParams.get("page_size");

  return {
    insurerId: searchParams.get("insurer_id") ?? undefined,
    age: parseFiniteNumber(searchParams.get("age")),
    gender: parseGender(searchParams.get("gender")),
    region: parseTariffRegion(searchParams.get("region")),
    category: searchParams.get("category") ?? undefined,
    deductibleMax: parseFiniteNumber(searchParams.get("deductible_max")),
    waitingMaxDays: parseFiniteNumber(searchParams.get("waiting_max")),
    keyword: searchParams.get("q")?.trim() || undefined,
    priceMin: parseFiniteNumber(searchParams.get("price_min")),
    priceMax: parseFiniteNumber(searchParams.get("price_max")),
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
  if (filters.priceMin != null && !Number.isNaN(filters.priceMin))
    params.set("price_min", String(filters.priceMin));
  if (filters.priceMax != null && !Number.isNaN(filters.priceMax))
    params.set("price_max", String(filters.priceMax));
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

export function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export function asistenteFiltersToSearchParams(
  filters: MarketplaceFilters,
  planVersionId?: string,
): URLSearchParams {
  const params = marketplaceFiltersToSearchParams(filters);
  if (planVersionId) params.set("plan_version_id", planVersionId);
  return params;
}
