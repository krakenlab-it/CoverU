export interface InsurerRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_demo: boolean;
}

export interface PlanRow {
  id: string;
  insurer_id: string;
  name: string;
  description: string | null;
  coverage_summary: string | null;
  status: "active" | "inactive" | "archived";
  is_demo: boolean;
  natural_key_plan_id: string | null;
}

export interface PlanVersionRow {
  id: string;
  plan_id: string;
  version_number: number;
  label: string | null;
  status: "draft" | "published" | "archived";
  effective_from: string | null;
  effective_to: string | null;
  published_at: string | null;
  changelog: string | null;
  is_demo: boolean;
}

export interface TariffRow {
  id: string;
  plan_id: string;
  age_min: number;
  age_max: number;
  gender: "any" | "femenino" | "masculino";
  region: "Nacional" | "Austro" | "Costa" | "Sierra";
  monthly_price: number;
  raw_monthly_price_con_imp: number | null;
  raw_monthly_price_sin_imp: number | null;
  tax_included: boolean | null;
  tax_basis_raw: string | null;
  deductible: number | null;
  copay_pct: number | null;
  annual_limit: number | null;
  exclusions: string[] | null;
  is_demo: boolean;
  maternidad: "Si" | "No" | null;
  grupo_asegurado: "titular" | "nino_solo" | null;
  periodicidad_origen: string | null;
  vigencia_tarifario: string | null;
  archivo_fuente: string | null;
  source_file: string | null;
  source_drive_id: string | null;
  sheet: string | null;
  excel_row: number | null;
  load_blocked: boolean;
  load_block_reasons: string[] | null;
}

export interface CatalogPackage {
  insurers: InsurerRow[];
  plans: PlanRow[];
  planVersions: PlanVersionRow[];
  tariffs: TariffRow[];
  skippedTariffs: { id: string; reasons: string[] }[];
}

export interface TableCounts {
  insurers: number;
  plans: number;
  plan_versions: number;
  plan_versions_published: number;
  tariffs: number;
  tariffs_with_plan_version: number;
}
