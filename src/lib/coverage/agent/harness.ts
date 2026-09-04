import type { AgentContext } from "@/lib/coverage/qa-agent";
import {
  loadAgentContext,
  resolvePlanVersionId,
} from "@/lib/coverage/qa-agent";
import { packAgentContext } from "@/lib/coverage/agent/context-pack";
import { AgentRunLogger } from "@/lib/coverage/agent/logger";
import { planAdditionalToolsWithOpenAI } from "@/lib/coverage/agent/openai-loop";
import { persistCoverageAgentRun } from "@/lib/coverage/agent/persist";
import {
  planCoverageTools,
  shouldAskLlmForMoreTools,
} from "@/lib/coverage/agent/planner";
import { getCoverageQaProvider } from "@/lib/coverage/agent/provider";
import { mergeQuestionSlots } from "@/lib/coverage/agent/slot-memory";
import {
  executeCoverageTool,
  synthesizeFromTools,
} from "@/lib/coverage/agent/tools";
import type {
  CoverageAgentAnswer,
  CoverageQaInput,
  PlannedToolCall,
  ToolExecution,
} from "@/lib/coverage/agent/types";
import { terminalRunStatus } from "@/lib/coverage/agent/types";

export async function runCoverageHarness(args: {
  context: AgentContext;
  input: CoverageQaInput;
}): Promise<CoverageAgentAnswer> {
  const provider = getCoverageQaProvider();
  const logger = new AgentRunLogger(provider, args.input.requestId);
  const slots = mergeQuestionSlots(args.input.history, args.input.question);
  logger.setIntent(slots.intent);

  logger.setStatus("planning", "Empaquetando contexto del plan y armando herramientas");
  const packed = packAgentContext(args.context, slots);
  logger.setContextSummary(packed.inventory);

  const planned = planCoverageTools(packed, args.input.question);
  const executions: ToolExecution[] = [];
  const seen = new Set<string>();

  const runPlan = async (calls: PlannedToolCall[]) => {
    for (const call of calls) {
      const key = `${call.name}:${JSON.stringify(call.input)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      logger.plannedCall(call.name, call.reason, call.input);
      logger.setStatus("tool_running", `Ejecutando ${call.name}`);
      const execution = await executeCoverageTool(
        call.name,
        args.context,
        slots,
        call.input,
        provider,
      );
      executions.push(execution);
      logger.addToolTrace({
        name: execution.name,
        input: execution.input,
        ok: execution.ok,
        summary: execution.summary,
        duration_ms: execution.duration_ms,
      });
    }
  };

  await runPlan(planned);

  const draft = synthesizeFromTools(executions, provider, {
    status: "unknown",
    answer:
      "Puedo ayudarte con precios (edad, género, región) o con coberturas si hay texto de póliza.",
    citations: [],
    matched_tariff: null,
    abstained: false,
    policy_wording_controls: false,
    provider,
  });

  if (shouldAskLlmForMoreTools(packed, draft.status, draft.abstained)) {
    const extra = await planAdditionalToolsWithOpenAI({
      packed,
      question: args.input.question,
      prior: executions,
      provider,
    });
    if (extra.length > 0) {
      logger.record("llm_replanned", "El modelo pidió herramientas extra", {
        count: extra.length,
      });
      await runPlan(extra);
    }
  }

  logger.setStatus("synthesizing", "Armando la respuesta solo con resultados de herramientas");
  const result = synthesizeFromTools(executions, provider, draft);
  const terminal = terminalRunStatus(result);
  logger.finish(terminal);

  return {
    ...result,
    run: logger.snapshot(),
  };
}

export async function answerCoverageQuestion(
  input: CoverageQaInput,
): Promise<CoverageAgentAnswer | null> {
  const planVersionId = await resolvePlanVersionId(input);
  if (!planVersionId) return null;

  const context = await loadAgentContext(planVersionId);
  if (!context) return null;

  const answer = await runCoverageHarness({
    context,
    input: { ...input, planVersionId },
  });

  await persistCoverageAgentRun({ ...input, planVersionId }, answer);
  return answer;
}
