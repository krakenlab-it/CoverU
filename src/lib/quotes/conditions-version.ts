import type { PlanConditions } from "@/lib/marketplace/plan-conditions";

/**
 * Conditions version descriptor (KAN-231). Plan conditions are keyed to plan_version_id by
 * KAN-230 and frozen once that version is published, so the plan version id *is* the
 * conditions version. This module gives that id a stable, serialisable shape so a quote can
 * record it and a client can display what it was quoted against.
 */

export interface PlanConditionsCounts {
  deductibles: number;
  coinsurance: number;
  copays: number;
  paymentModalities: number;
  ceilings: number;
  total: number;
}

export interface ConditionsVersion {
  plan_conditions_version_id: string;
  plan_version_id: string;
  condition_counts: PlanConditionsCounts;
}

export interface PlanConditionsRowsInput {
  deductibles: unknown;
  coinsurance: unknown;
  copays: unknown;
  paymentModalities: unknown;
  ceilings: unknown;
}

function rowCount(rows: unknown): number {
  return Array.isArray(rows) ? rows.length : 0;
}

/** Counts the raw condition rows per family; accepts whatever PostgREST returned. */
export function planConditionsCounts(
  rows: PlanConditionsRowsInput,
): PlanConditionsCounts {
  const counts = {
    deductibles: rowCount(rows.deductibles),
    coinsurance: rowCount(rows.coinsurance),
    copays: rowCount(rows.copays),
    paymentModalities: rowCount(rows.paymentModalities),
    ceilings: rowCount(rows.ceilings),
  };

  return {
    ...counts,
    total:
      counts.deductibles +
      counts.coinsurance +
      counts.copays +
      counts.paymentModalities +
      counts.ceilings,
  };
}

/**
 * Builds the conditions version for a plan version. `plan_conditions_version_id` equals the
 * plan version id today; it is a separate field so quotes and clients never depend on that
 * coincidence.
 */
export function describeConditionsVersion(
  planVersionId: string,
  counts: PlanConditionsCounts,
): ConditionsVersion {
  return {
    plan_conditions_version_id: planVersionId,
    plan_version_id: planVersionId,
    condition_counts: counts,
  };
}

/** Counts an already-validated conditions payload. */
export function countsFromPlanConditions(
  conditions: PlanConditions,
): PlanConditionsCounts {
  return planConditionsCounts({
    deductibles: conditions.deductibles,
    coinsurance: conditions.coinsurance,
    copays: conditions.copays,
    paymentModalities: conditions.paymentModalities,
    ceilings: conditions.ceilings,
  });
}
