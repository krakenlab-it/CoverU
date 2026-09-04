import {
  COVERAGE_AGENT_TOOL_CATALOG,
  isCoverageAgentToolName,
} from "@/lib/coverage/agent/tools";
import type {
  CoverageQaProvider,
  PackedAgentContext,
  PlannedToolCall,
  ToolExecution,
} from "@/lib/coverage/agent/types";

interface PlannerResponse {
  tools?: Array<{ name?: string; input?: Record<string, unknown>; reason?: string }>;
}

export async function planAdditionalToolsWithOpenAI(args: {
  packed: PackedAgentContext;
  question: string;
  prior: ToolExecution[];
  provider: CoverageQaProvider;
}): Promise<PlannedToolCall[]> {
  if (args.provider !== "openai" || !process.env.OPENAI_API_KEY) {
    return [];
  }

  const system = `Eres el planificador del asistente CoverÜ.
Solo eliges herramientas. Nunca inventes precios, artículos ni citas.
El inventario es un índice, no una respuesta. Usa search_policy_vector para coberturas.
Devuelve JSON: { "tools": [{ "name": "...", "input": {}, "reason": "..." }] }
Máximo 3 herramientas. Lista vacía si no aporta.`;

  const user = JSON.stringify({
    question: args.question,
    packed: {
      plan: args.packed.plan,
      inventory: args.packed.inventory,
      slots: args.packed.slots,
    },
    prior_tools: args.prior.map((execution) => ({
      name: execution.name,
      summary: execution.summary,
      status: execution.result?.status,
      abstained: execution.result?.abstained,
    })),
    tools: COVERAGE_AGENT_TOOL_CATALOG,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.COVERAGE_QA_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  try {
    const parsed = JSON.parse(
      payload.choices?.[0]?.message?.content ?? "{}",
    ) as PlannerResponse;

    return (parsed.tools ?? [])
      .filter((tool) => tool.name && isCoverageAgentToolName(tool.name))
      .slice(0, 3)
      .map((tool) => ({
        name: tool.name as PlannedToolCall["name"],
        input: tool.input ?? { query: args.question },
        reason: tool.reason ?? "Plan adicional del modelo",
      }));
  } catch {
    return [];
  }
}
