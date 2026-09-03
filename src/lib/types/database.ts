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
  is_demo: boolean;
  created_at: string;
  insurer?: Insurer;
}

export interface Tariff {
  id: string;
  plan_id: string;
  age_min: number;
  age_max: number;
  gender: string;
  region: string;
  monthly_price: number;
  deductible: number | null;
  copay_pct: number | null;
  annual_limit: number | null;
  exclusions: string[] | null;
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
