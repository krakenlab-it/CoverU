import type {
  CoverageQaResult,
  CoverageStatus,
} from "@/lib/types/phase1";
import type { ParsedQuestion, QuestionIntent } from "@/lib/coverage/question-parser";

export type CoverageQaProvider = "rules" | "openai";

export type AgentRunStatus =
  | "queued"
  | "loading_context"
  | "planning"
  | "tool_running"
  | "synthesizing"
  | "completed"
  | "abstained"
  | "failed";

export type CoverageAgentToolName =
  | "inspect_plan"
  | "lookup_tariff"
  | "compare_tariffs"
  | "check_maternidad"
  | "list_deductibles"
  | "list_annual_limits"
  | "search_policy"
  | "search_policy_vector"
  | "search_exclusions"
  | "search_waiting_periods";

export interface CoverageQaTurn {
  question: string;
}

export interface CoverageQaInput {
  planVersionId?: string;
  planId?: string;
  question: string;
  history?: CoverageQaTurn[];
  organizationId?: string;
  requestId?: string;
}

export interface AgentRunEvent {
  at: string;
  status: AgentRunStatus;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AgentToolTrace {
  name: CoverageAgentToolName;
  input: Record<string, unknown>;
  ok: boolean;
  summary: string;
  duration_ms: number;
}

export interface PackedContextInventory {
  tariff_count: number;
  regions: string[];
  genders: string[];
  grupos: string[];
  maternidad_values: string[];
  deductibles: number[];
  annual_limits: number[];
  has_policy_text: boolean;
  clause_titles: string[];
  clause_categories: string[];
  exclusion_titles: string[];
  waiting_period_categories: string[];
  citation_refs: string[];
}

export interface PackedAgentContext {
  plan: {
    id: string;
    name: string;
    insurer: string;
    version_label: string;
    version_id: string;
  };
  inventory: PackedContextInventory;
  slots: ParsedQuestion;
}

export interface AgentRunSnapshot {
  id: string;
  status: AgentRunStatus;
  events: AgentRunEvent[];
  tools: AgentToolTrace[];
  duration_ms: number;
  context_summary: PackedContextInventory | null;
  intent: QuestionIntent | null;
  provider: CoverageQaProvider;
}

export interface PlannedToolCall {
  name: CoverageAgentToolName;
  input: Record<string, unknown>;
  reason: string;
}

export interface ToolExecution {
  name: CoverageAgentToolName;
  input: Record<string, unknown>;
  ok: boolean;
  summary: string;
  result: CoverageQaResult | null;
  duration_ms: number;
}

export interface CoverageAgentAnswer extends CoverageQaResult {
  run: AgentRunSnapshot;
}

export function terminalRunStatus(
  result: Pick<CoverageQaResult, "abstained" | "status">,
): Extract<AgentRunStatus, "completed" | "abstained"> {
  if (result.abstained || result.status === "unknown") {
    return "abstained";
  }
  return "completed";
}

export function isCoverageStatus(value: string): value is CoverageStatus {
  return (
    value === "covered" ||
    value === "not_covered" ||
    value === "conditional" ||
    value === "unknown" ||
    value === "quoted"
  );
}
