import type {
  CoverageCitation,
  CoverageQaResult,
  CoverageStatus,
} from "@/lib/types/phase1";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CoverageQaInput {
  planVersionId: string;
  question: string;
}

interface GroundingContext {
  clauses: Array<{
    title: string;
    coverage_status: CoverageStatus;
    description: string | null;
    conditions: string | null;
  }>;
  citations: Array<{
    clause_ref: string;
    excerpt: string;
    page_number: number | null;
    policy_document_title: string;
  }>;
}

type CoverageQaProvider = "rules" | "openai";

function getProvider(): CoverageQaProvider {
  const configured = process.env.COVERAGE_QA_PROVIDER;
  if (configured === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "rules";
}

function hasPolicyGrounding(context: GroundingContext): boolean {
  return context.clauses.length > 0 || context.citations.length > 0;
}

function abstainResult(provider: string): CoverageQaResult {
  return {
    status: "unknown",
    answer:
      "No hay texto de póliza disponible para responder esta pregunta. Consulta el documento de póliza vigente.",
    citations: [],
    abstained: true,
    policy_wording_controls: true,
    provider,
  };
}

const KEYWORD_RULES: Array<{
  patterns: RegExp[];
  status: CoverageStatus;
  answer: string;
  citationRefs: string[];
}> = [
  {
    patterns: [/hospitaliz/i, /internaci/i],
    status: "covered",
    answer:
      "Según las condiciones del plan, la hospitalización en red preferente está cubierta, sujeta a deducible y copago vigentes.",
    citationRefs: ["Art. 4.1"],
  },
  {
    patterns: [/urgenc/i, /emergenc/i],
    status: "conditional",
    answer:
      "Las urgencias están cubiertas en red. Fuera de red, el reembolso es parcial con tope mensual.",
    citationRefs: ["Art. 4.2"],
  },
  {
    patterns: [/maternidad/i, /parto/i, /embarazo/i],
    status: "not_covered",
    answer: "Este plan no incluye cobertura de maternidad.",
    citationRefs: ["Art. 5.1"],
  },
  {
    patterns: [/cosm[eé]tic/i, /est[eé]tic/i],
    status: "not_covered",
    answer: "Los tratamientos cosméticos no están cubiertos por este plan.",
    citationRefs: ["Art. 6.1"],
  },
  {
    patterns: [/preexist/i, /preexistencia/i],
    status: "not_covered",
    answer:
      "Las preexistencias no declaradas quedan excluidas de la cobertura.",
    citationRefs: ["Art. 6.1"],
  },
  {
    patterns: [/carencia/i, /espera/i, /cirug[ií]a/i],
    status: "conditional",
    answer:
      "Las cirugías programadas pueden tener un período de carencia según la póliza.",
    citationRefs: ["Art. 7.1"],
  },
];

function buildCitations(
  refs: string[],
  context: GroundingContext,
): CoverageCitation[] {
  return context.citations
    .filter((c) => refs.includes(c.clause_ref))
    .map((c) => ({
      clause_ref: c.clause_ref,
      excerpt: c.excerpt,
      page_number: c.page_number,
      policy_document_title: c.policy_document_title,
    }));
}

function matchPolicyQuestion(
  question: string,
  context: GroundingContext,
): CoverageQaResult {
  if (!hasPolicyGrounding(context)) {
    return abstainResult("rules");
  }

  const normalized = question.toLowerCase().trim();

  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(normalized))) {
      const citations = buildCitations(rule.citationRefs, context);
      if (citations.length === 0) {
        return abstainResult("rules");
      }
      return {
        status: rule.status,
        answer: rule.answer,
        citations,
        abstained: false,
        policy_wording_controls: true,
        provider: "rules",
      };
    }
  }

  return abstainResult("rules");
}

async function loadGroundingContext(
  planVersionId: string,
): Promise<GroundingContext | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: version } = await supabase
    .from("plan_versions")
    .select("id, status")
    .eq("id", planVersionId)
    .maybeSingle();

  if (!version || version.status !== "published") {
    return null;
  }

  const { data: clauses } = await supabase
    .from("coverage_clauses")
    .select("title, coverage_status, description, conditions")
    .eq("plan_version_id", planVersionId);

  const { data: documents } = await supabase
    .from("policy_documents")
    .select("id, title")
    .eq("plan_version_id", planVersionId);

  const docIds = (documents ?? []).map((d) => d.id);
  const docMap = new Map((documents ?? []).map((d) => [d.id, d.title]));

  let citations: GroundingContext["citations"] = [];
  if (docIds.length > 0) {
    const { data: citationRows } = await supabase
      .from("citations")
      .select("clause_ref, excerpt, page_number, policy_document_id")
      .in("policy_document_id", docIds);

    citations = (citationRows ?? []).map((c) => ({
      clause_ref: c.clause_ref,
      excerpt: c.excerpt,
      page_number: c.page_number,
      policy_document_title:
        docMap.get(c.policy_document_id) ?? "Documento de póliza",
    }));
  }

  return {
    clauses: (clauses ?? []).map((c) => ({
      title: c.title,
      coverage_status: c.coverage_status as CoverageStatus,
      description: c.description,
      conditions: c.conditions,
    })),
    citations,
  };
}

async function answerWithOpenAI(
  input: CoverageQaInput,
  context: GroundingContext,
): Promise<CoverageQaResult> {
  if (!hasPolicyGrounding(context)) {
    return abstainResult("openai");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return matchPolicyQuestion(input.question, context);
  }

  const systemPrompt = `Eres un asistente de cobertura de seguros de salud en Ecuador.
Responde SOLO con base en el contexto de póliza proporcionado.
Si no hay información suficiente, indica status "unknown" y abstente.
Responde en español. El texto de la póliza prevalece (policy_wording_controls: true).
Formato JSON: { "status": "covered|not_covered|conditional|unknown", "answer": "...", "citation_refs": ["Art. X.X"] }`;

  const userContent = JSON.stringify({
    question: input.question,
    clauses: context.clauses,
    citations: context.citations,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.COVERAGE_QA_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!response.ok) {
    return matchPolicyQuestion(input.question, context);
  }

  const payload = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  try {
    const parsed = JSON.parse(
      payload.choices[0]?.message?.content ?? "{}",
    ) as {
      status?: CoverageStatus;
      answer?: string;
      citation_refs?: string[];
    };

    const status: CoverageStatus = parsed.status ?? "unknown";
    const citations = buildCitations(parsed.citation_refs ?? [], context);

    if (status === "unknown" || citations.length === 0) {
      return abstainResult("openai");
    }

    return {
      status,
      answer:
        parsed.answer ?? "Consulta la póliza para detalles específicos.",
      citations,
      abstained: false,
      policy_wording_controls: true,
      provider: "openai",
    };
  } catch {
    return matchPolicyQuestion(input.question, context);
  }
}

export async function answerCoverageQuestion(
  input: CoverageQaInput,
): Promise<CoverageQaResult | null> {
  const context = await loadGroundingContext(input.planVersionId);
  if (!context) return null;

  const provider = getProvider();

  if (provider === "openai") {
    return answerWithOpenAI(input, context);
  }

  return matchPolicyQuestion(input.question, context);
}

/** Exported for tests */
export function matchPolicyQuestionForTest(
  question: string,
  context: GroundingContext,
): CoverageQaResult {
  return matchPolicyQuestion(question, context);
}

export type { GroundingContext };
