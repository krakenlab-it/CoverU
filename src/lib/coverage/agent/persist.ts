import { createAdminClient } from "@/lib/supabase/admin";
import type { CoverageAgentAnswer, CoverageQaInput } from "@/lib/coverage/agent/types";

export async function persistCoverageAgentRun(
  input: CoverageQaInput,
  answer: CoverageAgentAnswer,
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { run } = answer;
  const { error } = await supabase.from("coverage_agent_runs").insert({
    id: run.id,
    organization_id: input.organizationId ?? null,
    request_id: input.requestId ?? null,
    plan_version_id: input.planVersionId ?? null,
    plan_id: input.planId ?? null,
    question: input.question,
    parsed_intent: run.intent,
    parsed_slots: {},
    provider: run.provider,
    status: run.status,
    result_status: answer.status,
    answer: answer.answer,
    abstained: answer.abstained,
    events: run.events,
    tool_calls: run.tools,
    duration_ms: run.duration_ms,
  });

  if (error) {
    console.error("coverage_agent_runs insert failed:", error.message);
  }
}

export function coverageUsageMetadata(
  input: CoverageQaInput,
  answer: CoverageAgentAnswer | null,
  route: string,
) {
  return {
    planVersionId: input.planVersionId,
    planId: input.planId,
    metadata: {
      route,
      agent_run_id: answer?.run.id ?? null,
      agent_status: answer?.run.status ?? null,
      agent_tools: answer?.run.tools.map((tool) => tool.name) ?? [],
      provider: answer?.provider ?? null,
      result_status: answer?.status ?? null,
      abstained: answer?.abstained ?? null,
    },
  };
}
