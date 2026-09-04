import type { MatchedTariffSnapshot } from "@/lib/types/phase1";
import type { Tariff } from "@/lib/types/database";

export function toTariffSnapshot(tariff: Tariff): MatchedTariffSnapshot {
  return {
    id: tariff.id,
    age_min: tariff.age_min,
    age_max: tariff.age_max,
    gender: tariff.gender,
    region: String(tariff.region),
    grupo_asegurado: tariff.grupo_asegurado ?? null,
    maternidad: tariff.maternidad ?? null,
    deductible: tariff.deductible,
    annual_limit: tariff.annual_limit,
    monthly_price: tariff.monthly_price,
    tax_included: tariff.tax_included ?? null,
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function describeTariffDimensions(snapshot: MatchedTariffSnapshot): string {
  const parts = [
    `Edad ${snapshot.age_min}–${snapshot.age_max}`,
    snapshot.gender !== "any" ? snapshot.gender : null,
    snapshot.region,
    snapshot.grupo_asegurado ? `grupo ${snapshot.grupo_asegurado}` : null,
    snapshot.maternidad ? `maternidad ${snapshot.maternidad}` : null,
    snapshot.deductible != null ? `deducible ${formatUsd(snapshot.deductible)}` : null,
    snapshot.annual_limit != null
      ? `tope anual ${formatUsd(snapshot.annual_limit)}`
      : null,
  ].filter(Boolean);

  return parts.join(" · ");
}
