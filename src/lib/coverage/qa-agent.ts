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
import type { CoverageQaInput } from "@/lib/coverage/agent/types";
import type { ParsedQuestion } from "@/lib/coverage/question-parser";
import {
  describeTariffDimensions,
  formatUsd,
  toTariffSnapshot,
} from "@/lib/coverage/tariff-snapshot";

export type { CoverageQaInput } from "@/lib/coverage/agent/types";

export interface PolicyClauseRow {
  title: string;
  category: string;
  coverage_status: CoverageStatus;
  description: string | null;
  conditions: string | null;
}

export interface CitationRow {
  clause_ref: string;
  excerpt: string;
  page_number: number | null;
  policy_document_title: string;
}

export interface PolicyChunkRow {
  id: string;
  clause_ref: string | null;
  content: string;
  source_kind: string;
  policy_document_title: string | null;
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
  chunks: PolicyChunkRow[];
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
    case "catalog_overview":
    case "policy_coverage":
    case "exclusion":
    case "waiting_period":
    case "unknown":
      return null;
    default: {
      const _never: never = parsed.intent;
      return _never;
    }
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
    chunks: await loadPolicyChunks(supabase, planVersionId, citations),
  };
}

async function loadPolicyChunks(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  planVersionId: string,
  citations: CitationRow[],
): Promise<PolicyChunkRow[]> {
  const { data } = await supabase
    .from("policy_chunks")
    .select("id, clause_ref, content, source_kind, policy_document_id")
    .eq("plan_version_id", planVersionId);

  if (data && data.length > 0) {
    const titleByExcerpt = new Map(
      citations.map((citation) => [citation.excerpt, citation.policy_document_title]),
    );
    return data.map((row) => ({
      id: row.id,
      clause_ref: row.clause_ref,
      content: row.content,
      source_kind: row.source_kind,
      policy_document_title:
        titleByExcerpt.get(row.content) ?? "Documento de póliza",
    }));
  }

  return citations.map((citation, index) => ({
    id: `citation-${index}-${citation.clause_ref}`,
    clause_ref: citation.clause_ref,
    content: citation.excerpt,
    source_kind: "citation",
    policy_document_title: citation.policy_document_title,
  }));
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

/** Exported for tests */
export {
  answerPolicyQuestion as matchPolicyQuestionForTest,
  answerTariffQuestion as answerTariffQuestionForTest,
  hasPolicyGrounding,
};
