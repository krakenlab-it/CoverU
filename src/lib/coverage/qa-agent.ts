import { findMatchingTariff } from "@/lib/marketplace/tariff-match";
import type {
  CoverageCitation,
  CoverageQaResult,
  CoverageStatus,
  Exclusion,
  WaitingPeriod,
} from "@/lib/types/phase1";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";
import type { PlanVersion } from "@/lib/types/phase1";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseCoverageQuestion,
  type ParsedQuestion,
} from "@/lib/coverage/question-parser";
import {
  describeTariffDimensions,
  formatUsd,
  toTariffSnapshot,
} from "@/lib/coverage/tariff-snapshot";

export interface CoverageQaInput {
  planVersionId?: string;
  planId?: string;
  question: string;
}

interface PolicyClauseRow {
  title: string;
  category: string;
  coverage_status: CoverageStatus;
  description: string | null;
  conditions: string | null;
}

interface CitationRow {
  clause_ref: string;
  excerpt: string;
  page_number: number | null;
  policy_document_title: string;
}

export interface AgentContext {
  planVersion: PlanVersion;
  plan: Plan;
  insurer: Insurer;
  tariffs: Tariff[];
  clauses: PolicyClauseRow[];
  exclusions: Exclusion[];
  waitingPeriods: WaitingPeriod[];
  citations: CitationRow[];
}

type CoverageQaProvider = "rules" | "openai";

function getProvider(): CoverageQaProvider {
  const configured = process.env.COVERAGE_QA_PROVIDER;
  if (configured === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "rules";
}

function hasPolicyGrounding(context: AgentContext): boolean {
  return context.clauses.length > 0 || context.citations.length > 0;
}

function baseResult(
  partial: Omit<CoverageQaResult, "matched_tariff"> & {
    matched_tariff?: CoverageQaResult["matched_tariff"];
  },
): CoverageQaResult {
  return {
    matched_tariff: partial.matched_tariff ?? null,
    ...partial,
  };
}

function policyAbstain(provider: string): CoverageQaResult {
  return baseResult({
    status: "unknown",
    answer:
      "No hay texto de póliza disponible para responder esta pregunta. Consulta el documento de póliza vigente o pregunta por precios y tarifas del plan.",
    citations: [],
    abstained: true,
    policy_wording_controls: true,
    provider,
  });
}

function buildCitations(
  refs: string[],
  context: AgentContext,
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

function findClauseByTopic(
  context: AgentContext,
  topic: string | undefined,
): PolicyClauseRow | undefined {
  if (!topic) return undefined;
  return context.clauses.find(
    (c) =>
      c.category === topic ||
      c.title.toLowerCase().includes(topic.replace(/_/g, " ")),
  );
}

function citationsForClause(
  clause: PolicyClauseRow,
  context: AgentContext,
): CoverageCitation[] {
  const titleMatch = context.citations.filter((c) =>
    c.excerpt.toLowerCase().includes(clause.title.toLowerCase()),
  );
  if (titleMatch.length > 0) {
    return titleMatch.map((c) => ({
      clause_ref: c.clause_ref,
      excerpt: c.excerpt,
      page_number: c.page_number,
      policy_document_title: c.policy_document_title,
    }));
  }

  const categoryMatch = context.citations.filter((c) =>
    clause.category
      ? c.clause_ref.toLowerCase().includes(clause.category.slice(0, 4))
      : false,
  );
  return categoryMatch.map((c) => ({
    clause_ref: c.clause_ref,
    excerpt: c.excerpt,
    page_number: c.page_number,
    policy_document_title: c.policy_document_title,
  }));
}

function matchTariffs(
  context: AgentContext,
  parsed: ParsedQuestion,
): Tariff[] {
  const filters = {
    age: parsed.age,
    gender: parsed.gender,
    region: parsed.region,
  };

  if (parsed.deductible != null) {
    const byDeductible = context.tariffs.filter(
      (t) => t.deductible === parsed.deductible,
    );
    if (byDeductible.length > 0) {
      const matched = findMatchingTariff(byDeductible, filters);
      return matched ? [matched] : byDeductible;
    }
  }

  if (parsed.maternidad) {
    const byMaternidad = context.tariffs.filter(
      (t) => t.maternidad === parsed.maternidad,
    );
    if (byMaternidad.length > 0) {
      const matched = findMatchingTariff(byMaternidad, filters);
      return matched ? [matched] : byMaternidad;
    }
  }

  if (parsed.grupoAsegurado) {
    const byGrupo = context.tariffs.filter(
      (t) =>
        t.grupo_asegurado === parsed.grupoAsegurado ||
        t.grupo_asegurado == null,
    );
    const matched = findMatchingTariff(byGrupo, filters);
    return matched ? [matched] : [];
  }

  const matched = findMatchingTariff(context.tariffs, filters);
  return matched ? [matched] : [];
}

function missingTariffFilters(parsed: ParsedQuestion): string[] {
  const missing: string[] = [];
  if (parsed.age == null) missing.push("edad");
  if (!parsed.gender) missing.push("género");
  if (!parsed.region) missing.push("región");
  return missing;
}

function answerPriceQuote(
  context: AgentContext,
  parsed: ParsedQuestion,
  provider: string,
): CoverageQaResult | null {
  const missing = missingTariffFilters(parsed);
  if (missing.length > 0) {
    return baseResult({
      status: "unknown",
      answer: `Para cotizar el precio mensual necesito: ${missing.join(", ")}. Ejemplo: "hombre 35 Costa titular".`,
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const matches = matchTariffs(context, parsed);
  if (matches.length === 0) {
    return baseResult({
      status: "unknown",
      answer:
        "No encontré una tarifa publicada que coincida con esos criterios en nuestro catálogo.",
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const tariff = matches[0];
  const snapshot = toTariffSnapshot(tariff);
  const taxNote =
    snapshot.tax_included === false
      ? " (sin impuestos)"
      : snapshot.tax_included
        ? " (impuestos incluidos)"
        : "";

  return baseResult({
    status: "quoted",
    answer: `Para ${describeTariffDimensions(snapshot)}, la prima mensual es ${formatUsd(snapshot.monthly_price)}${taxNote}.`,
    citations: [],
    matched_tariff: snapshot,
    abstained: false,
    policy_wording_controls: false,
    provider,
  });
}

function answerCompareAges(
  context: AgentContext,
  parsed: ParsedQuestion,
  provider: string,
): CoverageQaResult | null {
  if (!parsed.compareAges) return null;
  const [ageA, ageB] = parsed.compareAges;
  const missing = missingTariffFilters({ ...parsed, age: ageA });
  if (missing.length > 0) {
    return baseResult({
      status: "unknown",
      answer: `Para comparar precios por edad también necesito: ${missing.join(", ")}.`,
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const quoteA = matchTariffs(context, { ...parsed, age: ageA })[0];
  const quoteB = matchTariffs(context, { ...parsed, age: ageB })[0];

  if (!quoteA || !quoteB) {
    return baseResult({
      status: "unknown",
      answer:
        "No encontré tarifas para ambas edades con los criterios indicados.",
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const snapA = toTariffSnapshot(quoteA);
  const snapB = toTariffSnapshot(quoteB);

  return baseResult({
    status: "quoted",
    answer: `Comparación de prima mensual: edad ${ageA} → ${formatUsd(snapA.monthly_price)}; edad ${ageB} → ${formatUsd(snapB.monthly_price)} (${parsed.gender}, ${parsed.region}).`,
    citations: [],
    matched_tariff: snapA,
    abstained: false,
    policy_wording_controls: false,
    provider,
  });
}

function answerMaternidadFromTariff(
  context: AgentContext,
  parsed: ParsedQuestion,
  provider: string,
): CoverageQaResult | null {
  const withMaternidad = context.tariffs.filter((t) => t.maternidad != null);
  if (withMaternidad.length === 0) return null;

  const matches =
    parsed.age || parsed.gender || parsed.region
      ? matchTariffs(
          { ...context, tariffs: withMaternidad },
          parsed,
        )
      : withMaternidad;

  if (matches.length === 0) {
    return baseResult({
      status: "unknown",
      answer:
        "Hay tarifas con dimensión maternidad, pero ninguna coincide con los criterios indicados.",
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const values = [...new Set(matches.map((t) => t.maternidad))];
  const snapshot = toTariffSnapshot(matches[0]);

  if (values.length === 1 && values[0] === "Si") {
    return baseResult({
      status: "covered",
      answer: `Según las tarifas del catálogo (${describeTariffDimensions(snapshot)}), esta variante incluye maternidad.`,
      citations: [],
      matched_tariff: snapshot,
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  if (values.length === 1 && values[0] === "No") {
    return baseResult({
      status: "not_covered",
      answer: `Según las tarifas del catálogo (${describeTariffDimensions(snapshot)}), esta variante no incluye maternidad.`,
      citations: [],
      matched_tariff: snapshot,
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  return baseResult({
    status: "conditional",
    answer: `El catálogo tiene variantes con y sin maternidad. Especifica edad, género y región para identificar la tarifa correcta.`,
    citations: [],
    abstained: false,
    policy_wording_controls: false,
    provider,
  });
}

function answerDeductibleQuery(
  context: AgentContext,
  parsed: ParsedQuestion,
  provider: string,
): CoverageQaResult | null {
  if (parsed.deductible != null) {
    return answerPriceQuote(context, parsed, provider);
  }

  const matches = matchTariffs(context, parsed);
  if (matches.length === 0 && (parsed.age || parsed.gender || parsed.region)) {
    return baseResult({
      status: "unknown",
      answer: "No encontré una tarifa que coincida para consultar el deducible.",
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const tariffs = matches.length > 0 ? matches : context.tariffs;
  const deductibles = [
    ...new Set(
      tariffs
        .map((t) => t.deductible)
        .filter((d): d is number => d != null),
    ),
  ].sort((a, b) => a - b);

  if (deductibles.length === 0) {
    return baseResult({
      status: "unknown",
      answer:
        "Las tarifas cargadas no incluyen deducible para este plan. Consulta condiciones contractuales.",
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider,
    });
  }

  const snapshot =
    matches.length > 0 ? toTariffSnapshot(matches[0]) : undefined;

  return baseResult({
    status: "quoted",
    answer: `Deducibles disponibles en tarifario: ${deductibles.map(formatUsd).join(", ")}.`,
    citations: [],
    matched_tariff: snapshot ?? null,
    abstained: false,
    policy_wording_controls: false,
    provider,
  });
}

function answerPolicyQuestion(
  context: AgentContext,
  parsed: ParsedQuestion,
  provider: string,
): CoverageQaResult {
  if (!hasPolicyGrounding(context)) {
    return policyAbstain(provider);
  }

  const clause = findClauseByTopic(context, parsed.policyTopic);
  if (clause) {
    const citations = citationsForClause(clause, context);
    if (citations.length === 0) {
      return policyAbstain(provider);
    }

    const status = clause.coverage_status;
    const answerParts = [clause.description ?? clause.title];
    if (clause.conditions) answerParts.push(clause.conditions);

    return baseResult({
      status,
      answer: answerParts.filter(Boolean).join(" "),
      citations,
      abstained: false,
      policy_wording_controls: true,
      provider,
    });
  }

  const exclusion = context.exclusions.find((e) =>
    parsed.policyTopic
      ? e.title.toLowerCase().includes(parsed.policyTopic.replace(/_/g, " "))
      : false,
  );
  if (exclusion && parsed.intent === "exclusion") {
    const citations = buildCitations([], context);
    if (citations.length === 0) {
      return baseResult({
        status: "not_covered",
        answer: `${exclusion.title}: ${exclusion.description ?? "Exclusión registrada en el catálogo."}`,
        citations: [],
        abstained: false,
        policy_wording_controls: true,
        provider,
      });
    }
  }

  const waiting = context.waitingPeriods.find((w) =>
    parsed.policyTopic
      ? w.service_category.includes(parsed.policyTopic)
      : parsed.intent === "waiting_period",
  );
  if (waiting && (parsed.intent === "waiting_period" || parsed.policyTopic)) {
    return baseResult({
      status: "conditional",
      answer: `Período de carencia de ${waiting.days} días para ${waiting.service_category.replace(/_/g, " ")}.${waiting.notes ? ` ${waiting.notes}` : ""}`,
      citations: [],
      abstained: false,
      policy_wording_controls: true,
      provider,
    });
  }

  return policyAbstain(provider);
}

function answerTariffQuestion(
  context: AgentContext,
  parsed: ParsedQuestion,
  provider: string,
): CoverageQaResult | null {
  switch (parsed.intent) {
    case "price_quote":
      return answerPriceQuote(context, parsed, provider);
    case "compare_ages":
      return answerCompareAges(context, parsed, provider);
    case "maternidad":
      return (
        answerMaternidadFromTariff(context, parsed, provider) ??
        answerPolicyQuestion(context, parsed, provider)
      );
    case "deductible":
      return answerDeductibleQuery(context, parsed, provider);
    case "annual_limit": {
      const limits = [
        ...new Set(
          context.tariffs
            .map((t) => t.annual_limit)
            .filter((l): l is number => l != null),
        ),
      ].sort((a, b) => a - b);
      if (limits.length === 0) {
        return baseResult({
          status: "unknown",
          answer: "No hay topes anuales en las tarifas cargadas para este plan.",
          citations: [],
          abstained: false,
          policy_wording_controls: false,
          provider,
        });
      }
      return baseResult({
        status: "quoted",
        answer: `Topes anuales en tarifario: ${limits.map(formatUsd).join(", ")}.`,
        citations: [],
        abstained: false,
        policy_wording_controls: false,
        provider,
      });
    }
    default:
      return null;
  }
}

async function answerWithOpenAI(
  input: CoverageQaInput,
  context: AgentContext,
  parsed: ParsedQuestion,
): Promise<CoverageQaResult> {
  const tariffResult = answerTariffQuestion(context, parsed, "openai");
  if (
    tariffResult &&
    (tariffResult.status === "quoted" ||
      (parsed.intent !== "policy_coverage" &&
        parsed.intent !== "exclusion" &&
        parsed.intent !== "waiting_period"))
  ) {
    return tariffResult;
  }

  if (!hasPolicyGrounding(context)) {
    return tariffResult ?? policyAbstain("openai");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return (
      tariffResult ?? answerPolicyQuestion(context, parsed, "rules")
    );
  }

  const systemPrompt = `Eres un asistente de cobertura de seguros de salud en Ecuador.
Responde SOLO con base en el contexto proporcionado (cláusulas, citas y tarifas).
Nunca inventes números de artículo ni citas. Si no hay cita real en el contexto, abstente.
Para precios usa status "quoted" y datos de tarifas. Responde en español.
Formato JSON: { "status": "covered|not_covered|conditional|unknown|quoted", "answer": "...", "citation_refs": ["ref exacto del contexto"] }`;

  const userContent = JSON.stringify({
    question: input.question,
    parsed,
    plan: context.plan.name,
    insurer: context.insurer.name,
    clauses: context.clauses,
    citations: context.citations,
    tariffs: context.tariffs.slice(0, 20),
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
    return (
      tariffResult ?? answerPolicyQuestion(context, parsed, "rules")
    );
  }

  const payload = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  try {
    const raw = JSON.parse(payload.choices[0]?.message?.content ?? "{}") as {
      status?: CoverageStatus;
      answer?: string;
      citation_refs?: string[];
    };

    const status: CoverageStatus = raw.status ?? "unknown";
    const citations = buildCitations(raw.citation_refs ?? [], context);

    if (status === "quoted") {
      return (
        tariffResult ??
        baseResult({
          status: "unknown",
          answer: raw.answer ?? "No hay tarifa coincidente.",
          citations: [],
          abstained: true,
          policy_wording_controls: false,
          provider: "openai",
        })
      );
    }

    if (status === "unknown" || citations.length === 0) {
      return policyAbstain("openai");
    }

    return baseResult({
      status,
      answer: raw.answer ?? "Consulta la póliza para detalles específicos.",
      citations,
      abstained: false,
      policy_wording_controls: true,
      provider: "openai",
    });
  } catch {
    return (
      tariffResult ?? answerPolicyQuestion(context, parsed, "rules")
    );
  }
}

export async function loadAgentContext(
  planVersionId: string,
): Promise<AgentContext | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: version } = await supabase
    .from("plan_versions")
    .select(
      `
      *,
      plan:plans (
        *,
        insurer:insurers (*)
      )
    `,
    )
    .eq("id", planVersionId)
    .maybeSingle();

  if (!version || version.status !== "published") {
    return null;
  }

  const plan = version.plan as Plan & { insurer: Insurer };
  const insurer = plan.insurer;

  const tariffQuery = supabase.from("tariffs").select("*");
  const { data: tariffsByVersion } = await tariffQuery.eq(
    "plan_version_id",
    planVersionId,
  );

  let tariffs = (tariffsByVersion ?? []) as Tariff[];
  if (tariffs.length === 0) {
    const { data: tariffsByPlan } = await supabase
      .from("tariffs")
      .select("*")
      .eq("plan_id", plan.id);
    tariffs = (tariffsByPlan ?? []) as Tariff[];
  }

  const [
    { data: clauseRows },
    { data: exclusionRows },
    { data: waitingRows },
    { data: documents },
  ] = await Promise.all([
    supabase
      .from("coverage_clauses")
      .select("title, category, coverage_status, description, conditions")
      .eq("plan_version_id", planVersionId),
    supabase.from("exclusions").select("*").eq("plan_version_id", planVersionId),
    supabase
      .from("waiting_periods")
      .select("*")
      .eq("plan_version_id", planVersionId),
    supabase
      .from("policy_documents")
      .select("id, title")
      .eq("plan_version_id", planVersionId),
  ]);

  const docIds = (documents ?? []).map((d) => d.id);
  const docMap = new Map((documents ?? []).map((d) => [d.id, d.title]));

  let citations: CitationRow[] = [];
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
    planVersion: version as PlanVersion,
    plan,
    insurer,
    tariffs,
    clauses: (clauseRows ?? []).map((c) => ({
      title: c.title,
      category: c.category,
      coverage_status: c.coverage_status as CoverageStatus,
      description: c.description,
      conditions: c.conditions,
    })),
    exclusions: (exclusionRows ?? []) as Exclusion[],
    waitingPeriods: (waitingRows ?? []) as WaitingPeriod[],
    citations,
  };
}

export async function resolvePlanVersionId(
  input: CoverageQaInput,
): Promise<string | null> {
  if (input.planVersionId) return input.planVersionId;
  if (!input.planId) return null;

  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: version } = await supabase
    .from("plan_versions")
    .select("id")
    .eq("plan_id", input.planId)
    .eq("status", "published")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return version?.id ?? null;
}

export async function answerCoverageQuestion(
  input: CoverageQaInput,
): Promise<CoverageQaResult | null> {
  const planVersionId = await resolvePlanVersionId(input);
  if (!planVersionId) return null;

  const context = await loadAgentContext(planVersionId);
  if (!context) return null;

  const parsed = parseCoverageQuestion(input.question);
  const provider = getProvider();

  if (provider === "openai") {
    return answerWithOpenAI(input, context, parsed);
  }

  const tariffResult = answerTariffQuestion(context, parsed, "rules");
  if (tariffResult) return tariffResult;

  if (
    parsed.intent === "policy_coverage" ||
    parsed.intent === "exclusion" ||
    parsed.intent === "waiting_period"
  ) {
    return answerPolicyQuestion(context, parsed, "rules");
  }

  if (context.tariffs.length > 0) {
    return baseResult({
      status: "unknown",
      answer:
        "Puedo ayudarte con precios y tarifas (edad, género, región) o con coberturas cuando haya texto de póliza cargado.",
      citations: [],
      abstained: false,
      policy_wording_controls: false,
      provider: "rules",
    });
  }

  return policyAbstain("rules");
}

/** Exported for tests */
export {
  answerPolicyQuestion as matchPolicyQuestionForTest,
  answerTariffQuestion as answerTariffQuestionForTest,
  hasPolicyGrounding,
};
