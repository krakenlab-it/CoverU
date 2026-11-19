import { z } from "zod";
import { CATEGORY_LABELS } from "@/lib/marketplace/categories";
import { formatUsd } from "@/lib/marketplace/format";
import { createLogger } from "@/lib/logging/logger";
import type {
  ConditionNetwork,
  CoverageCeilingScope,
  DeductibleBasis,
  DeductibleScope,
  ExclusionType,
  PaymentFrequency,
  PaymentMethod,
  PlanCoinsurance,
  PlanCopay,
  PlanCoverageCeiling,
  PlanDeductible,
  PlanPaymentModality,
} from "@/lib/types/phase1";

/**
 * Plan conditions (KAN-230): deductibles, coinsurance, copays, payment modality and
 * coverage ceilings. Every row is keyed to plan_version_id, so conditions version with
 * the plan and freeze once that version is published.
 */

export const DEDUCTIBLE_SCOPE_LABELS: Record<DeductibleScope, string> = {
  individual: "Por persona",
  familiar: "Por familia",
};

export const DEDUCTIBLE_BASIS_LABELS: Record<DeductibleBasis, string> = {
  por_evento: "por evento",
  por_anio: "por año",
  por_ingreso: "por ingreso",
  vitalicio: "de por vida",
};

export const CONDITION_NETWORK_LABELS: Record<ConditionNetwork, string> = {
  en_red: "En red",
  fuera_de_red: "Fuera de red",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  debito: "Débito",
  tarjeta_credito: "Tarjeta de crédito",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  otro: "Otro medio",
};

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export const COVERAGE_CEILING_SCOPE_LABELS: Record<CoverageCeilingScope, string> = {
  por_persona: "Por persona",
  por_familia: "Por familia",
  por_evento: "Por evento",
  por_anio: "Por año",
  vitalicio: "De por vida",
};

export const EXCLUSION_TYPE_LABELS: Record<ExclusionType, string> = {
  general: "Exclusión general",
  especifica: "Exclusión específica",
};

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  consulta: "Consulta",
  examen: "Examen",
  medicamento: "Medicamento",
  emergencia: "Emergencia",
  hospitalizacion: "Hospitalización",
  cirugia: "Cirugía",
};

export function serviceCategoryLabel(category: string): string {
  return (
    SERVICE_CATEGORY_LABELS[category] ??
    CATEGORY_LABELS[category] ??
    category.replace(/_/g, " ")
  );
}

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("es-EC", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

/** NUMERIC columns arrive as numbers, but PostgREST may serialize them as strings. */
const decimal = z.coerce.number().finite();

const baseRow = {
  id: z.string().min(1),
  plan_version_id: z.string().min(1),
  is_demo: z.boolean(),
  created_at: z.string().min(1),
  notes: z.string().nullable(),
  sort_order: z.number().int(),
};

export const planDeductibleRowSchema = z.object({
  ...baseRow,
  scope: z.enum(["individual", "familiar"]),
  basis: z.enum(["por_evento", "por_anio", "por_ingreso", "vitalicio"]),
  amount: decimal.min(0),
});

export const planCoinsuranceRowSchema = z.object({
  ...baseRow,
  network: z.enum(["en_red", "fuera_de_red"]),
  insurer_pct: decimal.min(0).max(100),
  insured_pct: decimal.min(0).max(100),
  service_category: z.string().nullable(),
});

export const planCopayRowSchema = z.object({
  ...baseRow,
  service_category: z.string().min(1),
  network: z.enum(["en_red", "fuera_de_red"]),
  amount: decimal.min(0),
});

export const planPaymentModalityRowSchema = z.object({
  ...baseRow,
  method: z.enum(["debito", "tarjeta_credito", "transferencia", "efectivo", "otro"]),
  frequency: z.enum(["mensual", "trimestral", "semestral", "anual"]),
  is_default: z.boolean(),
  payment_url: z.string().nullable(),
});

export const planCoverageCeilingRowSchema = z.object({
  ...baseRow,
  scope: z.enum(["por_persona", "por_familia", "por_evento", "por_anio", "vitalicio"]),
  amount: decimal.positive(),
  service_category: z.string().nullable(),
});

export interface PlanConditions {
  deductibles: PlanDeductible[];
  coinsurance: PlanCoinsurance[];
  copays: PlanCopay[];
  paymentModalities: PlanPaymentModality[];
  ceilings: PlanCoverageCeiling[];
}

export interface PlanConditionsRows {
  deductibles: unknown;
  coinsurance: unknown;
  copays: unknown;
  paymentModalities: unknown;
  ceilings: unknown;
}

export const EMPTY_PLAN_CONDITIONS: PlanConditions = {
  deductibles: [],
  coinsurance: [],
  copays: [],
  paymentModalities: [],
  ceilings: [],
};

const logger = createLogger("plan-conditions");

function parseRows<T>(schema: z.ZodType<T>, rows: unknown, table: string): T[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const parsed = z.array(schema).safeParse(rows);
  if (!parsed.success) {
    logger.warn("Discarding plan condition rows that do not match the row contract", {
      table,
      rowCount: rows.length,
    });
    return [];
  }

  return parsed.data;
}

/**
 * Validates condition rows read from Supabase. A table whose rows drift from the row
 * contract is dropped as a whole instead of being rendered with partial typing.
 */
export function parsePlanConditions(rows: PlanConditionsRows): PlanConditions {
  return {
    deductibles: parseRows(
      planDeductibleRowSchema,
      rows.deductibles,
      "plan_deductibles",
    ),
    coinsurance: parseRows(
      planCoinsuranceRowSchema,
      rows.coinsurance,
      "plan_coinsurance",
    ),
    copays: parseRows(planCopayRowSchema, rows.copays, "plan_copays"),
    paymentModalities: parseRows(
      planPaymentModalityRowSchema,
      rows.paymentModalities,
      "plan_payment_modalities",
    ),
    ceilings: parseRows(
      planCoverageCeilingRowSchema,
      rows.ceilings,
      "plan_coverage_ceilings",
    ),
  };
}

export function hasPlanConditions(conditions: PlanConditions): boolean {
  return (
    conditions.deductibles.length > 0 ||
    conditions.coinsurance.length > 0 ||
    conditions.copays.length > 0 ||
    conditions.paymentModalities.length > 0 ||
    conditions.ceilings.length > 0
  );
}

export function describeDeductible(row: PlanDeductible): string {
  return `${DEDUCTIBLE_SCOPE_LABELS[row.scope]}, ${DEDUCTIBLE_BASIS_LABELS[row.basis]}: ${formatUsd(row.amount)}`;
}

export function describeCoinsurance(row: PlanCoinsurance): string {
  const category = row.service_category
    ? ` · ${serviceCategoryLabel(row.service_category)}`
    : "";
  return `${CONDITION_NETWORK_LABELS[row.network]}${category}: aseguradora ${formatPercent(row.insurer_pct)} · asegurado ${formatPercent(row.insured_pct)}`;
}

export function describeCopay(row: PlanCopay): string {
  return `${serviceCategoryLabel(row.service_category)} · ${CONDITION_NETWORK_LABELS[row.network]}: ${formatUsd(row.amount)}`;
}

export function describePaymentModality(row: PlanPaymentModality): string {
  const base = `${PAYMENT_METHOD_LABELS[row.method]} · ${PAYMENT_FREQUENCY_LABELS[row.frequency]}`;
  return row.is_default ? `${base} · predeterminada` : base;
}

export function describeCoverageCeiling(row: PlanCoverageCeiling): string {
  const category = row.service_category
    ? ` · ${serviceCategoryLabel(row.service_category)}`
    : "";
  return `${COVERAGE_CEILING_SCOPE_LABELS[row.scope]}${category}: ${formatUsd(row.amount)}`;
}
