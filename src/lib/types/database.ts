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
  gender: string;
  region: string;
  grupo_asegurado?: string | null;
  /** USD monthly from prima_mensual_con_imp — dollars, not cents */
  monthly_price: number;
  deductible: number | null;
  copay_pct: number | null;
  annual_limit: number | null;
  exclusions: string[] | null;
  tax_included?: boolean | null;
  tax_basis_raw?: string | null;
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
