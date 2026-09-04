import type { ParsedQuestion, QuestionIntent } from "@/lib/coverage/question-parser";
import type {
  CoverageAgentToolName,
  PackedAgentContext,
  PlannedToolCall,
} from "@/lib/coverage/agent/types";

function toolsForIntent(intent: QuestionIntent): CoverageAgentToolName[] {
  switch (intent) {
    case "price_quote":
      return ["lookup_tariff"];
    case "compare_ages":
      return ["compare_tariffs"];
    case "maternidad":
      return ["check_maternidad"];
    case "deductible":
      return ["list_deductibles"];
    case "annual_limit":
      return ["list_annual_limits"];
    case "policy_coverage":
      return ["search_policy_vector", "search_policy"];
    case "exclusion":
      return ["search_exclusions", "search_policy_vector"];
    case "waiting_period":
      return ["search_waiting_periods", "search_policy_vector"];
    case "catalog_overview":
      return ["inspect_plan"];
    case "unknown":
      return ["inspect_plan", "search_policy_vector"];
    default: {
      const _never: never = intent;
      return [_never];
    }
  }
}

function toolInput(
  name: CoverageAgentToolName,
  slots: ParsedQuestion,
  question: string,
): Record<string, unknown> {
  switch (name) {
    case "inspect_plan":
      return {};
    case "lookup_tariff":
    case "compare_tariffs":
    case "check_maternidad":
    case "list_deductibles":
    case "list_annual_limits":
      return {
        age: slots.age,
        gender: slots.gender,
        region: slots.region,
        grupoAsegurado: slots.grupoAsegurado,
        deductible: slots.deductible,
        maternidad: slots.maternidad,
        compareAges: slots.compareAges,
      };
    case "search_policy":
    case "search_policy_vector":
    case "search_exclusions":
    case "search_waiting_periods":
      return {
        policyTopic: slots.policyTopic,
        query: question,
      };
    default: {
      const _never: never = name;
      return { name: _never };
    }
  }
}

function reasonFor(name: CoverageAgentToolName, intent: QuestionIntent): string {
  switch (name) {
    case "inspect_plan":
      return "Revisar inventario del plan antes de responder en vacío";
    case "lookup_tariff":
      return "Cotizar con los criterios de tarifa en contexto";
    case "compare_tariffs":
      return "Comparar primas por edad";
    case "check_maternidad":
      return "Consultar la dimensión de maternidad en tarifario";
    case "list_deductibles":
      return "Listar deducibles publicados";
    case "list_annual_limits":
      return "Listar topes anuales publicados";
    case "search_policy":
      return intent === "unknown"
        ? "Buscar si la pregunta encaja con una cláusula real"
        : "Responder con cláusulas y citas reales";
    case "search_policy_vector":
      return "Buscar fragmentos de póliza por significado y palabras clave";
    case "search_exclusions":
      return "Buscar exclusiones registradas";
    case "search_waiting_periods":
      return "Buscar períodos de carencia";
    default: {
      const _never: never = name;
      return String(_never);
    }
  }
}

export function planCoverageTools(
  packed: PackedAgentContext,
  question: string,
): PlannedToolCall[] {
  const names = toolsForIntent(packed.slots.intent);

  if (
    packed.slots.intent === "unknown" &&
    packed.slots.age != null &&
    packed.slots.gender &&
    packed.slots.region
  ) {
    names.unshift("lookup_tariff");
  }

  const unique = [...new Set(names)];
  return unique.map((name) => ({
    name,
    input: toolInput(name, packed.slots, question),
    reason: reasonFor(name, packed.slots.intent),
  }));
}

export function shouldAskLlmForMoreTools(
  packed: PackedAgentContext,
  lastStatus: string,
  abstained: boolean,
): boolean {
  if (packed.slots.intent === "unknown") return true;
  if (abstained || lastStatus === "unknown") return true;
  return false;
}
