import { describe, expect, it } from "vitest";
import {
  buildDemoGroundingContext,
  matchDemoQuestionForTest,
} from "@/lib/coverage/qa-provider";

describe("coverage Q&A demo provider", () => {
  const context = buildDemoGroundingContext();

  it("answers hospitalization as covered with citation", () => {
    const result = matchDemoQuestionForTest(
      "¿Está cubierta la hospitalización?",
      context,
    );
    expect(result.status).toBe("covered");
    expect(result.abstained).toBe(false);
    expect(result.policy_wording_controls).toBe(true);
    expect(result.citations.some((c) => c.clause_ref === "Art. 4.1")).toBe(
      true,
    );
    expect(result.answer).toMatch(/hospitalización/i);
  });

  it("answers maternity as not covered", () => {
    const result = matchDemoQuestionForTest("¿Cubre maternidad?", context);
    expect(result.status).toBe("not_covered");
    expect(result.citations.some((c) => c.clause_ref === "Art. 5.1")).toBe(
      true,
    );
  });

  it("abstains on unknown topics", () => {
    const result = matchDemoQuestionForTest(
      "¿Cubre tratamiento en la luna?",
      context,
    );
    expect(result.status).toBe("unknown");
    expect(result.abstained).toBe(true);
    expect(result.citations).toHaveLength(0);
  });
});
