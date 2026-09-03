import type { TariffRegion } from "@/lib/catalog-enums";
import type { Tariff } from "@/lib/types/database";

export interface TariffMatchFilters {
  age?: number;
  gender?: string;
  region?: TariffRegion | "any";
}

export function findMatchingTariff(
  tariffs: Tariff[],
  filters: TariffMatchFilters,
): Tariff | null {
  const { age, gender, region } = filters;
  if (tariffs.length === 0) return null;

  const scored = tariffs.map((tariff) => {
    let score = 0;
    if (age != null) {
      if (age >= tariff.age_min && age <= tariff.age_max) score += 3;
      else return { tariff, score: -1 };
    }
    if (gender) {
      if (tariff.gender === gender || tariff.gender === "any") score += 2;
      else return { tariff, score: -1 };
    }
    if (region) {
      if (tariff.region === region || tariff.region === "any") score += 2;
      else return { tariff, score: -1 };
    }
    return { tariff, score };
  });

  const valid = scored.filter((s) => s.score >= 0);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.score - a.score);
  return valid[0].tariff;
}
