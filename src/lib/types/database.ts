import type { TariffGender, TariffMaternidad, TariffRegion, GrupoAsegurado } from "@/lib/catalog-enums";
import type { RegionValue } from "@/lib/regions";

export interface Insurer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  insurer_id: string;
  name: string;
  description: string | null;
  coverage_summary: string | null;
  natural_key_plan_id?: string | null;
  status?: "active" | "inactive" | "archived";
  coverage_provenance?: string | null;
  copay_provenance?: string | null;
  waiting_period_provenance?: string | null;
  is_demo: boolean;
  created_at: string;
  insurer?: Insurer;
}

export interface Tariff {
  id: string;
  plan_id: string;
  plan_version_id?: string | null;
  age_min: number;
  age_max: number;
  gender: TariffGender;
  region: TariffRegion | RegionValue | "any";
  grupo_asegurado?: GrupoAsegurado | null;
  /** USD monthly tax-included (prima_mensual_con_imp) — dollars, not cents */
  monthly_price: number;
  deductible: number | null;
  copay_pct: number | null;
  annual_limit: number | null;
  maternidad?: TariffMaternidad | null;
  exclusions: string[] | null;
  tax_included?: boolean | null;
  tax_basis_raw?: string | null;
  /** Lineage only — not sellable */
  raw_monthly_price_con_imp?: number | null;
  raw_monthly_price_sin_imp?: number | null;
  periodicidad_origen?: string | null;
  vigencia_tarifario?: string | null;
  archivo_fuente?: string | null;
  source_file?: string | null;
  source_drive_id?: string | null;
  sheet?: string | null;
  excel_row?: number | null;
  load_blocked?: boolean;
  load_block_reasons?: string[] | null;
  is_demo: boolean;
  created_at: string;
  plan?: Plan;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  region: string | null;
  source: string | null;
  plan_interest: string | null;
  created_at: string;
}

export interface ComparisonResult {
  tariff: Tariff;
  plan: Plan;
  insurer: Insurer;
}
