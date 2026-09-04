import { describe, expect, it } from "vitest";
import {
  fuseHybridRanks,
  lexicalSearchChunks,
  resultFromRetrievedChunks,
  type RetrievedChunk,
} from "@/lib/coverage/agent/retrieve";
import type { AgentContext } from "@/lib/coverage/qa-agent";
import type { Tariff } from "@/lib/types/database";

function emptyContext(overrides: Partial<AgentContext> = {}): AgentContext {
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
    tariffs: [] as Tariff[],
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
        excerpt: "El asegurado tendrá derecho a hospitalización en la red preferente.",
        page_number: 12,
        policy_document_title: "Condiciones generales",
      },
      {
        clause_ref: "Art. 6.1",
        excerpt: "No se cubren tratamientos cosméticos ni preexistencias no declaradas.",
        page_number: 18,
        policy_document_title: "Condiciones generales",
      },
    ],
    chunks: [],
    ...overrides,
  };
}

describe("hybrid policy retrieval", () => {
  it("ranks lexical citations by overlapping meaning tokens", () => {
    const hits = lexicalSearchChunks(
      emptyContext(),
      "¿Está cubierta la hospitalización?",
    );
    expect(hits[0]?.clause_ref).toBe("Art. 4.1");
    expect(hits[0]?.content).toMatch(/hospitalización/i);
  });

  it("fuses lexical and vector ranks with RRF", () => {
    const lexical: RetrievedChunk[] = [
      {
        id: "a",
        clause_ref: "Art. 4.1",
        content: "hospitalización",
        policy_document_title: "CG",
        source: "lexical",
        score: 3,
      },
      {
        id: "b",
        clause_ref: "Art. 6.1",
        content: "cosméticos",
        policy_document_title: "CG",
        source: "lexical",
        score: 1,
      },
    ];
    const vector: RetrievedChunk[] = [
      {
        id: "b",
        clause_ref: "Art. 6.1",
        content: "cosméticos",
        policy_document_title: "CG",
        source: "vector",
        score: 0.9,
      },
      {
        id: "a",
        clause_ref: "Art. 4.1",
        content: "hospitalización",
        policy_document_title: "CG",
        source: "vector",
        score: 0.4,
      },
    ];

    const fused = fuseHybridRanks(lexical, vector, 2);
    expect(fused).toHaveLength(2);
    expect(fused.every((hit) => hit.source === "hybrid")).toBe(true);
    expect(fused[0].score).toBeGreaterThan(0);
  });

  it("builds a grounded answer from retrieved chunks", () => {
    const context = emptyContext();
    const hits = lexicalSearchChunks(context, "hospitalización en red");
    const result = resultFromRetrievedChunks(context, hits, "rules");
    expect(result.abstained).toBe(false);
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].clause_ref).toBe("Art. 4.1");
    expect(result.policy_wording_controls).toBe(true);
  });
});
