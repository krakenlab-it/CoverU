import {
  answerTariffQuestionForTest,
  matchPolicyQuestionForTest,
  type AgentContext,
} from "@/lib/coverage/qa-agent";
import type {
  CoverageAgentToolName,
  CoverageQaProvider,
  ToolExecution,
} from "@/lib/coverage/agent/types";
import type { ParsedQuestion } from "@/lib/coverage/question-parser";
import { describePackedContext, packAgentContext } from "@/lib/coverage/agent/context-pack";
import type { CoverageQaResult } from "@/lib/types/phase1";
import {
  hybridSearchPolicy,
  resultFromRetrievedChunks,
} from "@/lib/coverage/agent/retrieve";

const TOOL_NAMES = [
  "inspect_plan",
  "lookup_tariff",
  "compare_tariffs",
  "check_maternidad",
  "list_deductibles",
  "list_annual_limits",
  "search_policy",
  "search_policy_vector",
  "search_exclusions",
  "search_waiting_periods",
] as const satisfies readonly CoverageAgentToolName[];

export const COVERAGE_AGENT_TOOL_CATALOG: Record<
  CoverageAgentToolName,
  { description: string; inputs: string[] }
> = {
  inspect_plan: {
    description:
      "Resume el plan, inventario de tarifas y si hay texto de póliza. No cotiza.",
    inputs: [],
  },
  lookup_tariff: {
    description: "Cotiza prima mensual con edad, género y región.",
    inputs: ["age", "gender", "region", "grupoAsegurado", "deductible", "maternidad"],
  },
  compare_tariffs: {
    description: "Compara primas de dos edades con el resto de criterios fijos.",
    inputs: ["compareAges", "gender", "region", "grupoAsegurado"],
  },
  check_maternidad: {
    description: "Indica si la variante tarifaria incluye maternidad.",
    inputs: ["age", "gender", "region"],
  },
  list_deductibles: {
    description: "Lista deducibles publicados en el tarifario.",
    inputs: ["age", "gender", "region"],
  },
  list_annual_limits: {
    description: "Lista topes anuales publicados en el tarifario.",
    inputs: ["age", "gender", "region"],
  },
  search_policy: {
    description:
      "Busca cláusulas y citas reales de póliza. Se abstiene si no hay texto.",
    inputs: ["policyTopic", "query"],
  },
  search_policy_vector: {
    description:
      "Búsqueda híbrida (pgvector + palabras clave) sobre fragmentos de póliza.",
    inputs: ["query"],
  },
  search_exclusions: {
    description: "Busca exclusiones del plan por tema o texto.",
    inputs: ["policyTopic", "query"],
  },
  search_waiting_periods: {
    description: "Busca períodos de carencia por categoría de servicio.",
    inputs: ["policyTopic"],
  },
};

export function isCoverageAgentToolName(
  value: string,
): value is CoverageAgentToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

function inspectPlan(
  context: AgentContext,
  slots: ParsedQuestion,
  provider: CoverageQaProvider,
): CoverageQaResult {
  const packed = packAgentContext(context, slots);
  return {
    status: "unknown",
    answer: describePackedContext(packed),
    citations: [],
    matched_tariff: null,
    abstained: false,
    policy_wording_controls: false,
    provider,
  };
}

function inferTopicFromQuery(query: string): string | undefined {
  const text = query.toLowerCase();
  if (/hospitaliz|internaci/.test(text)) return "hospitalizacion";
  if (/urgenc|emergenc/.test(text)) return "urgencias";
  if (/maternidad|embarazo|parto/.test(text)) return "maternidad";
  if (/cosm[eé]tic|est[eé]tic/.test(text)) return "cosmetico";
  if (/preexist/.test(text)) return "preexistencia";
  if (/cirug[ií]a/.test(text)) return "cirugia";
  if (/odont|dental/.test(text)) return "odontologia";
  if (/oftal|vision|visión/.test(text)) return "oftalmologia";
  if (/c[aá]ncer|oncol/.test(text)) return "oncologia";
  if (/ambulator|consulta/.test(text)) return "ambulatorio";
  return undefined;
}

function matchText(haystack: string, query: string): boolean {
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 3);
  if (tokens.length === 0) return false;
  const target = haystack.toLowerCase();
  return tokens.some((token) => target.includes(token));
}

function searchPolicy(
  context: AgentContext,
  slots: ParsedQuestion,
  input: Record<string, unknown>,
  provider: CoverageQaProvider,
): CoverageQaResult {
  const query = typeof input.query === "string" ? input.query : "";
  const topic =
    (typeof input.policyTopic === "string" && input.policyTopic) ||
    slots.policyTopic ||
    inferTopicFromQuery(query);

  const parsed: ParsedQuestion = {
    ...slots,
    intent: "policy_coverage",
    policyTopic: topic,
  };

  const direct = matchPolicyQuestionForTest(context, parsed, provider);
  if (!direct.abstained) return direct;

  if (!query) return direct;

  const clause = context.clauses.find(
    (row) =>
      matchText(`${row.title} ${row.category} ${row.description ?? ""}`, query),
  );
  if (!clause) return direct;

  return matchPolicyQuestionForTest(
    context,
    { ...parsed, policyTopic: clause.category || clause.title.toLowerCase() },
    provider,
  );
}

function searchExclusions(
  context: AgentContext,
  slots: ParsedQuestion,
  input: Record<string, unknown>,
  provider: CoverageQaProvider,
): CoverageQaResult {
  const query = typeof input.query === "string" ? input.query : "";
  const topic =
    (typeof input.policyTopic === "string" && input.policyTopic) ||
    slots.policyTopic ||
    inferTopicFromQuery(query);

  const parsed: ParsedQuestion = {
    ...slots,
    intent: "exclusion",
    policyTopic: topic,
  };
  return matchPolicyQuestionForTest(context, parsed, provider);
}

function searchWaitingPeriods(
  context: AgentContext,
  slots: ParsedQuestion,
  input: Record<string, unknown>,
  provider: CoverageQaProvider,
): CoverageQaResult {
  const topic =
    (typeof input.policyTopic === "string" && input.policyTopic) ||
    slots.policyTopic;
  return matchPolicyQuestionForTest(
    context,
    { ...slots, intent: "waiting_period", policyTopic: topic },
    provider,
  );
}

function runTariffIntent(
  context: AgentContext,
  slots: ParsedQuestion,
  intent: ParsedQuestion["intent"],
  provider: CoverageQaProvider,
): CoverageQaResult | null {
  return answerTariffQuestionForTest(context, { ...slots, intent }, provider);
}

export async function executeCoverageTool(
  name: CoverageAgentToolName,
  context: AgentContext,
  slots: ParsedQuestion,
  input: Record<string, unknown>,
  provider: CoverageQaProvider,
): Promise<ToolExecution> {
  const started = Date.now();
  let result: CoverageQaResult | null = null;

  switch (name) {
    case "inspect_plan":
      result = inspectPlan(context, slots, provider);
      break;
    case "lookup_tariff":
      result = runTariffIntent(context, slots, "price_quote", provider);
      break;
    case "compare_tariffs":
      result = runTariffIntent(context, slots, "compare_ages", provider);
      break;
    case "check_maternidad":
      result = runTariffIntent(context, slots, "maternidad", provider);
      break;
    case "list_deductibles":
      result = runTariffIntent(context, slots, "deductible", provider);
      break;
    case "list_annual_limits":
      result = runTariffIntent(context, slots, "annual_limit", provider);
      break;
    case "search_policy":
      result = searchPolicy(context, slots, input, provider);
      break;
    case "search_policy_vector": {
      const query =
        (typeof input.query === "string" && input.query) ||
        slots.policyTopic ||
        "";
      const hits = await hybridSearchPolicy(context, query);
      result = resultFromRetrievedChunks(context, hits, provider);
      break;
    }
    case "search_exclusions":
      result = searchExclusions(context, slots, input, provider);
      break;
    case "search_waiting_periods":
      result = searchWaitingPeriods(context, slots, input, provider);
      break;
    default: {
      const _never: never = name;
      return {
        name: _never,
        input,
        ok: false,
        summary: "Herramienta desconocida",
        result: null,
        duration_ms: Date.now() - started,
      };
    }
  }

  return {
    name,
    input,
    ok: Boolean(result),
    summary: result?.answer.slice(0, 180) ?? "Sin resultado",
    result,
    duration_ms: Date.now() - started,
  };
}

export function synthesizeFromTools(
  executions: ToolExecution[],
  provider: CoverageQaProvider,
  fallback: CoverageQaResult,
): CoverageQaResult {
  const answers = executions
    .map((execution) => execution.result)
    .filter((result): result is CoverageQaResult => result != null);

  const withCitations = answers.find(
    (result) => !result.abstained && result.citations.length > 0,
  );
  if (withCitations) return { ...withCitations, provider };

  const decisive = answers.find(
    (result) =>
      !result.abstained &&
      result.status !== "unknown" &&
      result.answer.length > 0,
  );
  if (decisive) return { ...decisive, provider };

  const inspect = answers.find((result) =>
    result.answer.includes("tarifas publicadas"),
  );
  if (inspect && answers.every((result) => result.status === "unknown")) {
    return {
      ...inspect,
      provider,
      answer: `${inspect.answer} Pregunta por un precio con edad, género y región, o por una cobertura concreta.`,
    };
  }

  return { ...fallback, provider };
}
