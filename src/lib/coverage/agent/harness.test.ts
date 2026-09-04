import { describe, expect, it } from "vitest";
import { runCoverageHarness } from "@/lib/coverage/agent/harness";
import { mergeQuestionSlots } from "@/lib/coverage/agent/slot-memory";
import type { AgentContext } from "@/lib/coverage/qa-agent";
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
];

function context(tariffs: Tariff[]): AgentContext {
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
    clauses: [
      {
        title: "Hospitalización",
        category: "hospitalizacion",
        coverage_status: "covered",
        description: "Cobertura en red preferente.",
        conditions: null,
      },
    ],
    exclusions: [],
    waitingPeriods: [],
    citations: [
      {
        clause_ref: "Art. 4.1",
        excerpt: "Hospitalización cubierta en red preferente.",
        page_number: 1,
        policy_document_title: "Condiciones generales",
      },
    ],
    chunks: [
      {
        id: "chunk-1",
        clause_ref: "Art. 4.1",
        content: "Hospitalización cubierta en red preferente.",
        source_kind: "citation",
        policy_document_title: "Condiciones generales",
      },
    ],
  };
}

describe("coverage agent harness", () => {
  it("quotes a tariff through tools and records run status", async () => {
    const answer = await runCoverageHarness({
      context: context(FIXTURE_TARIFFS),
      input: { question: "hombre 35 Costa titular" },
    });

    expect(answer.status).toBe("quoted");
    expect(answer.matched_tariff?.monthly_price).toBe(92.5);
    expect(answer.run.tools.some((tool) => tool.name === "lookup_tariff")).toBe(
      true,
    );
    expect(answer.run.status).toBe("completed");
    expect(answer.run.events.length).toBeGreaterThan(2);
  });

  it("retrieves policy text instead of abstaining when a chunk matches", async () => {
    const answer = await runCoverageHarness({
      context: context([]),
      input: { question: "¿Está cubierta la hospitalización?" },
    });

    expect(answer.abstained).toBe(false);
    expect(answer.citations[0]?.clause_ref).toBe("Art. 4.1");
    expect(
      answer.run.tools.some((tool) => tool.name === "search_policy_vector"),
    ).toBe(true);
  });

  it("reuses age/gender/region from previous questions", () => {
    const merged = mergeQuestionSlots(
      [{ question: "hombre 35 Costa titular" }],
      "y si es mujer",
    );
    expect(merged.age).toBe(35);
    expect(merged.region).toBe("Costa");
    expect(merged.gender).toBe("femenino");
  });
});
