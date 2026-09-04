import { describe, expect, it } from "vitest";
import { parseCoverageQuestion } from "@/lib/coverage/question-parser";

describe("parseCoverageQuestion", () => {
  it("detects price quote from age, gender, region", () => {
    const parsed = parseCoverageQuestion("hombre 35 Costa titular");
    expect(parsed.intent).toBe("price_quote");
    expect(parsed.age).toBe(35);
    expect(parsed.gender).toBe("masculino");
    expect(parsed.region).toBe("Costa");
    expect(parsed.grupoAsegurado).toBe("titular");
  });

  it("detects compare ages intent", () => {
    const parsed = parseCoverageQuestion("comparar edad 25 y 45 mujer Sierra");
    expect(parsed.intent).toBe("compare_ages");
    expect(parsed.compareAges).toEqual([25, 45]);
    expect(parsed.gender).toBe("femenino");
    expect(parsed.region).toBe("Sierra");
  });

  it("detects maternidad intent", () => {
    const parsed = parseCoverageQuestion("¿Incluye maternidad?");
    expect(parsed.intent).toBe("maternidad");
  });

  it("detects policy coverage intent", () => {
    const parsed = parseCoverageQuestion("¿Está cubierta la hospitalización?");
    expect(parsed.intent).toBe("policy_coverage");
    expect(parsed.policyTopic).toBe("hospitalizacion");
  });
});
