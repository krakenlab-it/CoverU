export type CoverageStatus =
  | "covered"
  | "not_covered"
  | "conditional"
  | "unknown"
  | "quoted";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "suspended";
  created_at: string;
}

export interface ApiClient {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: "active" | "suspended" | "revoked";
  is_demo: boolean;
  created_at: string;
}

export interface ApiKeyRecord {
  id: string;
  api_client_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  status: "active" | "revoked" | "expired";
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface PlanVersion {
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
  created_at: string;
}

export interface CoverageClause {
  id: string;
  plan_version_id: string;
  category: string;
  title: string;
  description: string | null;
  coverage_status: CoverageStatus;
  coverage_status_text?: string | null;
  conditions: string | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface Exclusion {
  id: string;
  plan_version_id: string;
  title: string;
  description: string | null;
  /** KAN-229 field 7: general exclusion vs plan-specific. Null on legacy rows. */
  exclusion_type?: ExclusionType | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface WaitingPeriod {
  id: string;
  plan_version_id: string;
  service_category: string;
  days: number;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
}

export type ExclusionType = "general" | "especifica";

export type DeductibleScope = "individual" | "familiar";

export type DeductibleBasis =
  | "por_evento"
  | "por_anio"
  | "por_ingreso"
  | "vitalicio";

export type ConditionNetwork = "en_red" | "fuera_de_red";

export type PaymentMethod =
  | "debito"
  | "tarjeta_credito"
  | "transferencia"
  | "efectivo"
  | "otro";

export type PaymentFrequency = "mensual" | "trimestral" | "semestral" | "anual";

export type CoverageCeilingScope =
  | "por_persona"
  | "por_familia"
  | "por_evento"
  | "por_anio"
  | "vitalicio";

export interface PlanDeductible {
  id: string;
  plan_version_id: string;
  scope: DeductibleScope;
  basis: DeductibleBasis;
  /** USD, dollars not cents. 0 means no deductible. */
  amount: number;
  notes: string | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface PlanCoinsurance {
  id: string;
  plan_version_id: string;
  network: ConditionNetwork;
  /** Percentage covered by the insurer. insurer_pct + insured_pct = 100. */
  insurer_pct: number;
  /** Percentage paid by the insured. */
  insured_pct: number;
  service_category: string | null;
  notes: string | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface PlanCopay {
  id: string;
  plan_version_id: string;
  service_category: string;
  network: ConditionNetwork;
  /** USD fixed copay, dollars not cents. */
  amount: number;
  notes: string | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface PlanPaymentModality {
  id: string;
  plan_version_id: string;
  method: PaymentMethod;
  frequency: PaymentFrequency;
  is_default: boolean;
  payment_url: string | null;
  notes: string | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface PlanCoverageCeiling {
  id: string;
  plan_version_id: string;
  scope: CoverageCeilingScope;
  /** USD ceiling, dollars not cents. */
  amount: number;
  service_category: string | null;
  notes: string | null;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
}

export interface PolicyDocument {
  id: string;
  plan_version_id: string;
  title: string;
  document_type: string;
  content: string;
  is_demo: boolean;
  created_at: string;
}

export interface Citation {
  id: string;
  policy_document_id: string;
  clause_ref: string;
  excerpt: string;
  page_number: number | null;
  is_demo: boolean;
  created_at: string;
}

export interface Quote {
  id: string;
  organization_id: string | null;
  plan_version_id: string;
  tariff_id: string | null;
  external_ref: string | null;
  status: "draft" | "active" | "expired" | "accepted" | "cancelled";
  age: number | null;
  gender: string | null;
  region: string | null;
  /** USD monthly — dollars, not cents (NUMERIC(12,2) in DB) */
  monthly_price: number | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface OrganizationSettings {
  organization_id: string;
  rate_limit_requests: number;
  rate_limit_window_ms: number;
  updated_at: string;
  updated_by: string | null;
}

export interface ApiAuthContext {
  apiKeyId: string;
  apiClientId: string;
  organizationId: string;
  scopes: string[];
  isDemo: boolean;
}

export interface CoverageCitation {
  clause_ref: string;
  excerpt: string;
  page_number: number | null;
  policy_document_title: string;
}

export interface MatchedTariffSnapshot {
  id: string;
  age_min: number;
  age_max: number;
  gender: string;
  region: string;
  grupo_asegurado: string | null;
  maternidad: string | null;
  deductible: number | null;
  annual_limit: number | null;
  monthly_price: number;
  tax_included: boolean | null;
}

export interface CoverageQaRunTrace {
  id: string;
  status: string;
  duration_ms: number;
  intent: string | null;
  provider: string;
  tools: Array<{
    name: string;
    summary: string;
    ok: boolean;
    duration_ms: number;
  }>;
}

export interface CoverageQaResult {
  status: CoverageStatus;
  answer: string;
  citations: CoverageCitation[];
  matched_tariff: MatchedTariffSnapshot | null;
  abstained: boolean;
  policy_wording_controls: boolean;
  provider: string;
  run?: CoverageQaRunTrace;
}
