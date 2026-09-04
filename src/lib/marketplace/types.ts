import type { TariffRegion } from "@/lib/catalog-enums";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";
import type { PlanVersion } from "@/lib/types/phase1";

export type QuoteState = "quoted" | "indicative" | "unavailable";

export type SortOption =
  | "price_asc"
  | "price_desc"
  | "deductible_asc"
  | "name_asc";

export interface MarketplaceFilters {
  insurerId?: string;
  age?: number;
  gender?: string;
  region?: TariffRegion;
  category?: string;
  deductibleMax?: number;
  waitingMaxDays?: number;
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: SortOption;
}

export interface MarketplacePlanResult {
  plan: Plan;
  insurer: Insurer;
  tariff: Tariff | null;
  planVersion: PlanVersion;
  quoteState: QuoteState;
  monthlyPrice: number | null;
  coverageHighlights: string[];
  exclusionWarnings: string[];
  waitingPeriodWarnings: string[];
  matchedCategories: string[];
  maxWaitingDays: number | null;
}

export interface ComparePlanEntry {
  planVersionId: string;
  plan: Plan;
  insurer: Insurer;
  planVersion: PlanVersion;
  tariff: Tariff | null;
  quoteState: QuoteState;
  monthlyPrice: number | null;
}

export const MAX_COMPARE_PLANS = 4;
export const MIN_COMPARE_PLANS = 2;
