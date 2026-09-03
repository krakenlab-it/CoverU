import { describe, expect, it } from "vitest";
import {
  matchPolicyQuestionForTest,
  type GroundingContext,
} from "@/lib/coverage/qa-provider";

const EMPTY_CONTEXT: GroundingContext = {
  clauses: [],
  citations: [],
};

const GROUNDED_CONTEXT: GroundingContext = {
  clauses: [
    {
      title: "Hospitalización",
      coverage_status: "covered",
      description: "Cobertura en red",
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

describe("coverage Q&A provider", () => {
  it("abstains when there is no policy text", () => {
    const result = matchPolicyQuestionForTest(
      "¿Está cubierta la hospitalización?",
      EMPTY_CONTEXT,
    );
    expect(result.abstained).toBe(true);
    expect(result.status).toBe("unknown");
    expect(result.citations).toHaveLength(0);
  });

  it("answers when grounded citations exist", () => {
    const result = matchPolicyQuestionForTest(
      "¿Está cubierta la hospitalización?",
      GROUNDED_CONTEXT,
    );
    expect(result.abstained).toBe(false);
    expect(result.status).toBe("covered");
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it("abstains for unknown topics even with grounding", () => {
    const result = matchPolicyQuestionForTest(
      "¿Cubren vacaciones en la luna?",
      GROUNDED_CONTEXT,
    );
    expect(result.abstained).toBe(true);
    expect(result.status).toBe("unknown");
  });
});
