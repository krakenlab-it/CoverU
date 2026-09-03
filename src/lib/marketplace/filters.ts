import type { SortOption, MarketplaceFilters } from "@/lib/marketplace/types";

const SORT_OPTIONS: SortOption[] = [
  "price_asc",
  "price_desc",
  "deductible_asc",
  "name_asc",
];

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

  return {
    insurerId: searchParams.get("insurer_id") ?? undefined,
    age: ageRaw ? Number(ageRaw) : undefined,
    gender: searchParams.get("gender") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    deductibleMax: deductibleRaw ? Number(deductibleRaw) : undefined,
    waitingMaxDays: waitingRaw ? Number(waitingRaw) : undefined,
    keyword: searchParams.get("q")?.trim() || undefined,
    sort,
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
