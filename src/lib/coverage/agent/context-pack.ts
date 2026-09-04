import type { AgentContext } from "@/lib/coverage/qa-agent";
import type {
  PackedAgentContext,
  PackedContextInventory,
} from "@/lib/coverage/agent/types";
import type { ParsedQuestion } from "@/lib/coverage/question-parser";

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function uniqueSortedNumbers(values: Array<number | null | undefined>): number[] {
  return [...new Set(values.filter((value): value is number => value != null))].sort(
    (a, b) => a - b,
  );
}

export function packAgentContext(
  context: AgentContext,
  slots: ParsedQuestion,
): PackedAgentContext {
  return {
    plan: {
      id: context.plan.id,
      name: context.plan.name,
      insurer: context.insurer.name,
      version_label: context.planVersion.label ?? `v${context.planVersion.version_number}`,
      version_id: context.planVersion.id,
    },
    inventory: packInventory(context),
    slots,
  };
}

export function packInventory(context: AgentContext): PackedContextInventory {
  return {
    tariff_count: context.tariffs.length,
    regions: uniqueSorted(context.tariffs.map((tariff) => String(tariff.region))),
    genders: uniqueSorted(context.tariffs.map((tariff) => tariff.gender)),
    grupos: uniqueSorted(context.tariffs.map((tariff) => tariff.grupo_asegurado)),
    maternidad_values: uniqueSorted(context.tariffs.map((tariff) => tariff.maternidad)),
    deductibles: uniqueSortedNumbers(context.tariffs.map((tariff) => tariff.deductible)),
    annual_limits: uniqueSortedNumbers(context.tariffs.map((tariff) => tariff.annual_limit)),
    has_policy_text:
      context.clauses.length > 0 || context.citations.length > 0,
    clause_titles: context.clauses.map((clause) => clause.title).slice(0, 24),
    clause_categories: uniqueSorted(context.clauses.map((clause) => clause.category)),
    exclusion_titles: context.exclusions.map((exclusion) => exclusion.title).slice(0, 24),
    waiting_period_categories: uniqueSorted(
      context.waitingPeriods.map((period) => period.service_category),
    ),
    citation_refs: uniqueSorted(context.citations.map((citation) => citation.clause_ref)),
  };
}

export function describePackedContext(packed: PackedAgentContext): string {
  const { plan, inventory, slots } = packed;
  const slotBits = [
    slots.age != null ? `edad ${slots.age}` : null,
    slots.gender,
    slots.region,
    slots.grupoAsegurado,
  ].filter(Boolean);

  return [
    `Plan ${plan.name} de ${plan.insurer} (${plan.version_label}).`,
    `${inventory.tariff_count} tarifas publicadas.`,
    inventory.regions.length > 0 ? `Regiones: ${inventory.regions.join(", ")}.` : null,
    inventory.has_policy_text
      ? `Hay texto de póliza: ${inventory.clause_titles.length} cláusulas, ${inventory.citation_refs.length} citas.`
      : "No hay texto de póliza cargado.",
    slotBits.length > 0 ? `Criterios en memoria: ${slotBits.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}
