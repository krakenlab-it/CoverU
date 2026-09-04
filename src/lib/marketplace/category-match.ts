import { CATEGORY_LABELS } from "@/lib/marketplace/categories";
import type { Plan, Tariff } from "@/lib/types/database";
import type { CoverageClause } from "@/lib/types/phase1";

export type CategoryMatchSignal = "match" | "no_match" | "inconclusive";

export function matchesCategoryFromClauses(
  clauses: CoverageClause[],
  category: string,
): boolean {
  return clauses.some(
    (clause) =>
      clause.category === category &&
      (clause.coverage_status === "covered" ||
        clause.coverage_status === "conditional"),
  );
}

function planText(plan: Plan): string {
  return [plan.name, plan.description ?? "", plan.coverage_summary ?? ""]
    .join(" ")
    .toLowerCase();
}

function textMentionsCategory(plan: Plan, category: string): boolean {
  const haystack = planText(plan);
  const label = CATEGORY_LABELS[category]?.toLowerCase() ?? "";
  return (
    haystack.includes(category.toLowerCase()) ||
    (label.length > 0 && haystack.includes(label))
  );
}

export function getCategoryFallbackSignal(
  plan: Plan,
  tariff: Tariff | null,
  category: string,
): CategoryMatchSignal {
  if (category === "maternidad") {
    if (tariff?.maternidad === "Si") return "match";
    if (tariff?.maternidad === "No") return "no_match";
    if (textMentionsCategory(plan, category)) return "match";
    return "inconclusive";
  }

  if (textMentionsCategory(plan, category)) return "match";
  return "inconclusive";
}

export function matchesCategoryWithFallback(
  clauses: CoverageClause[],
  category: string,
  plan: Plan,
  tariff: Tariff | null,
): boolean {
  if (clauses.length > 0) {
    return matchesCategoryFromClauses(clauses, category);
  }

  const signal = getCategoryFallbackSignal(plan, tariff, category);
  if (signal === "match") return true;
  if (signal === "no_match") return false;
  return true;
}

export function deriveMatchedCategories(
  clauses: CoverageClause[],
  plan: Plan,
  tariff: Tariff | null,
): string[] {
  const fromClauses = clauses
    .filter((clause) => clause.coverage_status !== "not_covered")
    .map((clause) => clause.category);

  if (fromClauses.length > 0) {
    return fromClauses;
  }

  const derived: string[] = [];
  if (tariff?.maternidad === "Si") {
    derived.push("maternidad");
  }
  if (textMentionsCategory(plan, "hospitalizacion")) {
    derived.push("hospitalizacion");
  }
  if (textMentionsCategory(plan, "urgencias")) {
    derived.push("urgencias");
  }
  if (textMentionsCategory(plan, "ambulatorio")) {
    derived.push("ambulatorio");
  }
  if (textMentionsCategory(plan, "dental")) {
    derived.push("dental");
  }
  if (textMentionsCategory(plan, "medicamentos")) {
    derived.push("medicamentos");
  }

  return derived;
}
