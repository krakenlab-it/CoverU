import type { ComparePlanEntry } from "@/lib/marketplace/types";

export const MAX_COMPARE_PLANS = 4;
export const MIN_COMPARE_PLANS = 2;

export function parseCompareIds(param: string | null | undefined): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE_PLANS);
}

export function serializeCompareIds(ids: string[]): string {
  return ids.slice(0, MAX_COMPARE_PLANS).join(",");
}

export function canAddToCompare(
  currentIds: string[],
  planVersionId: string,
): { allowed: boolean; reason?: string } {
  if (currentIds.includes(planVersionId)) {
    return { allowed: false, reason: "Este plan ya está en la comparación." };
  }
  if (currentIds.length >= MAX_COMPARE_PLANS) {
    return {
      allowed: false,
      reason: `Puedes comparar hasta ${MAX_COMPARE_PLANS} planes.`,
    };
  }
  return { allowed: true };
}

export function toggleCompareId(
  currentIds: string[],
  planVersionId: string,
): string[] {
  if (currentIds.includes(planVersionId)) {
    return currentIds.filter((id) => id !== planVersionId);
  }
  const check = canAddToCompare(currentIds, planVersionId);
  if (!check.allowed) return currentIds;
  return [...currentIds, planVersionId];
}

export function isCompareReady(ids: string[]): boolean {
  return ids.length >= MIN_COMPARE_PLANS && ids.length <= MAX_COMPARE_PLANS;
}

export function sortCompareEntries(
  entries: ComparePlanEntry[],
  order: string[],
): ComparePlanEntry[] {
  const index = new Map(order.map((id, i) => [id, i]));
  return [...entries].sort(
    (a, b) =>
      (index.get(a.planVersionId) ?? 99) - (index.get(b.planVersionId) ?? 99),
  );
}
