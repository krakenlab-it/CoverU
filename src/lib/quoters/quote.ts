import { TARIFF_REGIONS, type TariffRegion } from "@/lib/catalog-enums";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";
import {
  QUOTE_AGE_MAX,
  QUOTE_AGE_MIN,
  QUOTE_GENDERS,
  type PublicQuoteOffer,
  type PublicQuoteResult,
  type QuoteGender,
  type QuoteRequest,
} from "@/lib/quoters/types";

export interface CatalogQuoteInput {
  insurers: readonly Insurer[];
  plans: readonly Plan[];
  tariffs: readonly Tariff[];
}

const REGION_VALUES: readonly string[] = TARIFF_REGIONS.map((region) => region.value);

export function isQuoteGender(value: string): value is QuoteGender {
  return (QUOTE_GENDERS as readonly string[]).includes(value);
}

export function isQuoteAge(value: number): boolean {
  return Number.isInteger(value) && value >= QUOTE_AGE_MIN && value <= QUOTE_AGE_MAX;
}

function asRegion(value: string): TariffRegion {
  return REGION_VALUES.includes(value) ? (value as TariffRegion) : "Nacional";
}

/**
 * A row priced for the requested region beats a nationwide row; the same holds
 * for gender. Returns null when the row cannot serve the profile.
 */
function fitScore(tariff: Tariff, request: QuoteRequest): number | null {
  if (request.age < tariff.age_min || request.age > tariff.age_max) return null;
  if (tariff.load_blocked) return null;
  if (tariff.grupo_asegurado === "nino_solo") return null;

  const region = asRegion(String(tariff.region));
  const regionFit = region === request.region ? 2 : region === "Nacional" ? 1 : 0;
  if (regionFit === 0) return null;

  const genderFit =
    tariff.gender === request.gender ? 2 : tariff.gender === "any" ? 1 : 0;
  if (genderFit === 0) return null;

  return regionFit * 10 + genderFit;
}

interface ScoredTariff {
  tariff: Tariff;
  score: number;
}

/**
 * One quote per plan: picks the best-fitting tariff, breaking ties on price so
 * an identical row is never quoted twice.
 */
export function selectPlanTariffs(
  tariffs: readonly Tariff[],
  request: QuoteRequest,
): Map<string, ScoredTariff> {
  const selected = new Map<string, ScoredTariff>();

  for (const tariff of tariffs) {
    const score = fitScore(tariff, request);
    if (score == null) continue;

    const current = selected.get(tariff.plan_id);
    const cheaperTie =
      current !== undefined &&
      score === current.score &&
      tariff.monthly_price >= current.tariff.monthly_price;

    if (!current || score > current.score || (score === current.score && !cheaperTie)) {
      selected.set(tariff.plan_id, { tariff, score });
    }
  }

  return selected;
}

function toOffer(tariff: Tariff, plan: Plan, insurer: Insurer): PublicQuoteOffer {
  return {
    planId: plan.id,
    planName: plan.name,
    insurerName: insurer.name,
    insurerSlug: insurer.slug,
    insurerLogoUrl: insurer.logo_url,
    monthlyPrice: tariff.monthly_price,
    deductible: tariff.deductible,
    annualLimit: tariff.annual_limit,
    region: asRegion(String(tariff.region)),
    ageMin: tariff.age_min,
    ageMax: tariff.age_max,
    gender: tariff.gender === "any" ? "any" : tariff.gender,
    isDemo: tariff.is_demo || plan.is_demo || insurer.is_demo,
  };
}

/**
 * Builds the public quote for one profile from catalog rows, sorted cheapest
 * first. `source` records whether the rows came from Supabase or the committed
 * catalog package.
 */
export function buildQuotesFromCatalog(
  catalog: CatalogQuoteInput,
  request: QuoteRequest,
  source: PublicQuoteResult["source"],
): PublicQuoteResult {
  if (!isQuoteAge(request.age)) {
    return { request, offers: [], totalOffers: 0, source };
  }

  const planById = new Map(catalog.plans.map((plan) => [plan.id, plan]));
  const insurerById = new Map(catalog.insurers.map((insurer) => [insurer.id, insurer]));
  const selected = selectPlanTariffs(catalog.tariffs, request);

  const offers: PublicQuoteOffer[] = [];
  for (const [planId, { tariff }] of selected) {
    const plan = planById.get(planId);
    if (!plan) continue;
    if (plan.status && plan.status !== "active") continue;

    const insurer = insurerById.get(plan.insurer_id);
    if (!insurer) continue;

    offers.push(toOffer(tariff, plan, insurer));
  }

  offers.sort((a, b) => {
    if (a.monthlyPrice !== b.monthlyPrice) return a.monthlyPrice - b.monthlyPrice;
    return a.insurerName.localeCompare(b.insurerName, "es");
  });

  return { request, offers, totalOffers: offers.length, source };
}
