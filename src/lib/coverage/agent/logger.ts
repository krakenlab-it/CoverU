import { randomUUID } from "crypto";
import type {
  AgentRunEvent,
  AgentRunSnapshot,
  AgentRunStatus,
  AgentToolTrace,
  CoverageAgentToolName,
  CoverageQaProvider,
  PackedContextInventory,
} from "@/lib/coverage/agent/types";
import type { QuestionIntent } from "@/lib/coverage/question-parser";

export class AgentRunLogger {
  readonly id: string;
  private status: AgentRunStatus = "queued";
  private readonly events: AgentRunEvent[] = [];
  private readonly tools: AgentToolTrace[] = [];
  private readonly startedAt = Date.now();
  private contextSummary: PackedContextInventory | null = null;
  private intent: QuestionIntent | null = null;
  private readonly provider: CoverageQaProvider;

  constructor(provider: CoverageQaProvider, runId?: string) {
    this.id = runId ?? randomUUID();
    this.provider = provider;
    this.record("run_started", "Arranque del asistente de cobertura");
  }

  setStatus(status: AgentRunStatus, message: string, data?: Record<string, unknown>) {
    this.status = status;
    this.record("status_changed", message, data);
  }

  setIntent(intent: QuestionIntent) {
    this.intent = intent;
    this.record("question_parsed", `Intención detectada: ${intent}`, { intent });
  }

  setContextSummary(summary: PackedContextInventory) {
    this.contextSummary = summary;
    this.record("context_packed", "Contexto del plan compactado para el harness", {
      tariff_count: summary.tariff_count,
      has_policy_text: summary.has_policy_text,
      clause_count: summary.clause_titles.length,
      citation_count: summary.citation_refs.length,
    });
  }

  record(type: string, message: string, data?: Record<string, unknown>) {
    this.events.push({
      at: new Date().toISOString(),
      status: this.status,
      type,
      message,
      data,
    });
  }

  addToolTrace(trace: AgentToolTrace) {
    this.tools.push(trace);
    this.record("tool_finished", `${trace.name}: ${trace.summary}`, {
      name: trace.name,
      ok: trace.ok,
      duration_ms: trace.duration_ms,
    });
  }

  fail(message: string, data?: Record<string, unknown>) {
    this.status = "failed";
    this.record("run_failed", message, data);
  }

  finish(status: Extract<AgentRunStatus, "completed" | "abstained">) {
    this.status = status;
    this.record("run_finished", `Ejecución ${status}`);
  }

  snapshot(): AgentRunSnapshot {
    return {
      id: this.id,
      status: this.status,
      events: [...this.events],
      tools: [...this.tools],
      duration_ms: Date.now() - this.startedAt,
      context_summary: this.contextSummary,
      intent: this.intent,
      provider: this.provider,
    };
  }

  plannedCall(
    name: CoverageAgentToolName,
    reason: string,
    input: Record<string, unknown>,
  ) {
    this.record("tool_planned", reason, { name, input });
  }
}
