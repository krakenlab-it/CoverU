import { describe, expect, it } from "vitest";
import {
  answerTariffQuestionForTest,
  matchPolicyQuestionForTest,
  type AgentContext,
} from "@/lib/coverage/qa-agent";
import { parseCoverageQuestion } from "@/lib/coverage/question-parser";
import type { Tariff } from "@/lib/types/database";

const FIXTURE_TARIFFS: Tariff[] = [
  {
    id: "tariff-m-35-costa",
    plan_id: "plan-1",
    plan_version_id: "pv-1",
    age_min: 18,
    age_max: 64,
    gender: "masculino",
    region: "Costa",
    grupo_asegurado: "titular",
    maternidad: "No",
    monthly_price: 92.5,
    deductible: 750,
    copay_pct: null,
    annual_limit: 100000,
    exclusions: null,
    tax_included: true,
    is_demo: false,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "tariff-f-18-34-sierra",
    plan_id: "plan-1",
    plan_version_id: "pv-1",
    age_min: 18,
    age_max: 34,
    gender: "femenino",
    region: "Sierra",
    grupo_asegurado: "titular",
    maternidad: "Si",
    monthly_price: 110,
    deductible: 500,
    copay_pct: null,
    annual_limit: 120000,
    exclusions: null,
    tax_included: true,
    is_demo: false,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "tariff-f-35-64-sierra",
    plan_id: "plan-1",
    plan_version_id: "pv-1",
    age_min: 35,
    age_max: 64,
    gender: "femenino",
    region: "Sierra",
    grupo_asegurado: "titular",
    maternidad: "Si",
    monthly_price: 145.75,
    deductible: 500,
    copay_pct: null,
    annual_limit: 120000,
    exclusions: null,
    tax_included: true,
    is_demo: false,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function buildTariffContext(tariffs: Tariff[]): AgentContext {
  return {
    planVersion: {
      id: "pv-1",
      plan_id: "plan-1",
      version_number: 1,
      label: "v1",
      status: "published",
      effective_from: null,
      effective_to: null,
      published_at: null,
      changelog: null,
      is_demo: false,
      created_at: "2026-01-01T00:00:00Z",
    },
    plan: {
      id: "plan-1",
      insurer_id: "ins-1",
      name: "Plan Test",
      description: null,
      coverage_summary: null,
      is_demo: false,
      created_at: "2026-01-01T00:00:00Z",
    },
    insurer: {
      id: "ins-1",
      name: "Aseguradora Test",
      slug: "test",
      logo_url: null,
      is_demo: false,
      created_at: "2026-01-01T00:00:00Z",
    },
    tariffs,
    clauses: [],
    exclusions: [],
    waitingPeriods: [],
    citations: [],
    chunks: [],
  };
}

const EMPTY_POLICY_CONTEXT: AgentContext = {
  ...buildTariffContext([]),
  tariffs: [],
  clauses: [],
  citations: [],
};

const GROUNDED_POLICY_CONTEXT: AgentContext = {
  ...buildTariffContext([]),
  clauses: [
    {
      title: "Hospitalización",
      category: "hospitalizacion",
      coverage_status: "covered",
      description: "Cobertura en red preferente.",
      conditions: null,
    },
  ],
  citations: [
    {
      clause_ref: "Art. 4.1",
      excerpt: "Hospitalización cubierta en red preferente.",
      page_number: 1,
      policy_document_title: "Condiciones generales",
    },
  ],
};

describe("coverage Q&A agent", () => {
  it("quotes tariff price from what-if question", () => {
    const context = buildTariffContext(FIXTURE_TARIFFS);
    const parsed = parseCoverageQuestion("hombre 35 Costa titular");
    const result = answerTariffQuestionForTest(context, parsed, "rules");

    expect(result).not.toBeNull();
    expect(result?.status).toBe("quoted");
    expect(result?.abstained).toBe(false);
    expect(result?.matched_tariff?.monthly_price).toBe(92.5);
    expect(result?.citations).toHaveLength(0);
    expect(result?.answer).toMatch(/\$92[,.]50/);
  });

  it("compares two age bands on tariff data", () => {
    const context = buildTariffContext(FIXTURE_TARIFFS);
    const parsed = parseCoverageQuestion("comparar edad 25 y 45 mujer Sierra");
    const result = answerTariffQuestionForTest(context, parsed, "rules");

    expect(result?.status).toBe("quoted");
    expect(result?.answer).toMatch(/\$110/);
    expect(result?.answer).toMatch(/\$145[,.]75/);
  });

  it("answers maternidad from tariff dimension", () => {
    const context = buildTariffContext(FIXTURE_TARIFFS);
    const parsed = parseCoverageQuestion("¿Incluye maternidad? mujer Sierra");
    const result = answerTariffQuestionForTest(context, parsed, "rules");

    expect(result?.status).toBe("covered");
    expect(result?.matched_tariff?.maternidad).toBe("Si");
    expect(result?.citations).toHaveLength(0);
  });

  it("abstains on policy wording when there is no policy text", () => {
    const result = matchPolicyQuestionForTest(
      EMPTY_POLICY_CONTEXT,
      parseCoverageQuestion("¿Está cubierta la hospitalización?"),
      "rules",
    );
    expect(result.abstained).toBe(true);
    expect(result.status).toBe("unknown");
    expect(result.citations).toHaveLength(0);
  });

  it("never returns hallucinated citations", () => {
    const result = matchPolicyQuestionForTest(
      EMPTY_POLICY_CONTEXT,
      parseCoverageQuestion("¿Está cubierta la hospitalización?"),
      "rules",
    );
    expect(result.citations.some((c) => c.clause_ref.startsWith("Art."))).toBe(
      false,
    );
  });

  it("answers policy questions only with real citations", () => {
    const result = matchPolicyQuestionForTest(
      GROUNDED_POLICY_CONTEXT,
      parseCoverageQuestion("¿Está cubierta la hospitalización?"),
      "rules",
    );
    expect(result.abstained).toBe(false);
    expect(result.status).toBe("covered");
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].clause_ref).toBe("Art. 4.1");
  });

  it("abstains for unknown policy topics even with grounding", () => {
    const result = matchPolicyQuestionForTest(
      GROUNDED_POLICY_CONTEXT,
      parseCoverageQuestion("¿Cubren vacaciones en la luna?"),
      "rules",
    );
    expect(result.abstained).toBe(true);
    expect(result.status).toBe("unknown");
  });
});
