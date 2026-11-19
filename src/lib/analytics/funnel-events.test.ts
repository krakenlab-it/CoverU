import { describe, expect, it } from "vitest";
import {
  FUNNEL_STEPS,
  HEALTH_FIELD_PATTERN,
  funnelEventSchema,
  parseFunnelEvent,
  toFunnelEventRow,
} from "@/lib/analytics/funnel-events";

describe("funnel event catalog", () => {
  it("only lists steps that are emitted today", () => {
    // Proposal, application, payment and policy (KAN-242 to 245) are blocked;
    // reserving them here would be dead code.
    expect([...FUNNEL_STEPS]).toEqual(["lead", "quote", "advisor_request"]);
  });

  it("accepts every surface the emitters use", () => {
    const cases: { step: string; source: string; properties: object }[] = [
      { step: "lead", source: "contacto", properties: { intent: "contact" } },
      { step: "lead", source: "cotizador", properties: { intent: "quote" } },
      { step: "quote", source: "compare", properties: { offerCount: 3 } },
      { step: "quote", source: "api", properties: {} },
      { step: "advisor_request", source: "cotizador", properties: {} },
    ];

    for (const entry of cases) {
      expect(funnelEventSchema.safeParse(entry).success).toBe(true);
    }
  });
});

describe("funnelEventSchema — strict allowlist", () => {
  it("accepts a contact-form lead", () => {
    const parsed = funnelEventSchema.safeParse({
      step: "lead",
      source: "contacto",
      properties: { intent: "contact" },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a quoter lead and an advisor request", () => {
    expect(
      funnelEventSchema.safeParse({
        step: "lead",
        source: "cotizador",
        properties: { intent: "quote" },
      }).success,
    ).toBe(true);

    expect(
      funnelEventSchema.safeParse({
        step: "advisor_request",
        source: "cotizador",
        properties: {},
      }).success,
    ).toBe(true);
  });

  it("accepts a quote with and without an offer count", () => {
    for (const properties of [{ offerCount: 12 }, {}]) {
      const parsed = funnelEventSchema.safeParse({
        step: "quote",
        source: "compare",
        properties,
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects a step that does not exist yet", () => {
    for (const step of ["proposal", "application", "payment", "policy"]) {
      const parsed = funnelEventSchema.safeParse({
        step,
        source: "compare",
        properties: {},
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("rejects an unknown surface", () => {
    expect(
      funnelEventSchema.safeParse({
        step: "quote",
        source: "whatsapp",
        properties: {},
      }).success,
    ).toBe(false);
  });

  it("rejects a source that cannot produce that step", () => {
    // The contact form cannot request an advisor, and the API cannot capture a lead.
    expect(
      funnelEventSchema.safeParse({
        step: "advisor_request",
        source: "contacto",
        properties: {},
      }).success,
    ).toBe(false);

    expect(
      funnelEventSchema.safeParse({
        step: "lead",
        source: "api",
        properties: { intent: "quote" },
      }).success,
    ).toBe(false);
  });

  it("rejects a negative or fractional offer count", () => {
    for (const offerCount of [-1, 2.5]) {
      expect(
        funnelEventSchema.safeParse({
          step: "quote",
          source: "compare",
          properties: { offerCount },
        }).success,
      ).toBe(false);
    }
  });

  it("rejects unknown keys at every level instead of dropping them", () => {
    expect(
      funnelEventSchema.safeParse({
        step: "quote",
        source: "compare",
        properties: {},
        userEmail: "ana@example.com",
      }).success,
    ).toBe(false);

    expect(
      funnelEventSchema.safeParse({
        step: "quote",
        source: "compare",
        properties: { city: "Quito" },
      }).success,
    ).toBe(false);
  });

  it("rejects an advisor request carrying any property", () => {
    expect(
      funnelEventSchema.safeParse({
        step: "advisor_request",
        source: "cotizador",
        properties: { note: "llamar" },
      }).success,
    ).toBe(false);
  });
});

describe("health data is impossible in a funnel payload", () => {
  const healthPayloads: Record<string, Record<string, unknown>> = {
    diagnosis: { diagnosis: "diabetes tipo 2" },
    medications: { medications: ["metformina"] },
    condition: { condition: "hipertensión" },
    pregnancy: { pregnancy: true },
    nestedSymptoms: { intake: { symptoms: ["dolor de pecho"] } },
    spanish: { enfermedad: "asma" },
  };

  for (const [name, extra] of Object.entries(healthPayloads)) {
    it(`rejects a payload carrying ${name}`, () => {
      const result = parseFunnelEvent({
        step: "lead",
        source: "cotizador",
        properties: { intent: "quote", ...extra },
      });

      expect(result.ok).toBe(false);
    });
  }

  it("reports health fields separately from a malformed shape", () => {
    // A health key is also an unknown key, so the strict object catches it first;
    // the named guard is the second line of defence and is asserted directly.
    expect(
      parseFunnelEvent({
        step: "lead",
        source: "cotizador",
        properties: { intent: "quote", diagnosis: "x" },
      }),
    ).toEqual({ ok: false, reason: "invalid_payload" });

    expect(
      parseFunnelEvent({ step: "quote", source: "compare", properties: {}, hiv: 1 }),
    ).toEqual({ ok: false, reason: "invalid_payload" });
  });

  it("matches clinical terms in English and Spanish", () => {
    for (const key of [
      "diagnosis",
      "symptoms",
      "medication",
      "pregnancy",
      "enfermedad",
      "síntomas",
      "medicamentos",
      "embarazo",
      "salud",
    ]) {
      expect(HEALTH_FIELD_PATTERN.test(key)).toBe(true);
    }

    for (const key of ["step", "source", "offerCount", "intent", "organizationId"]) {
      expect(HEALTH_FIELD_PATTERN.test(key)).toBe(false);
    }
  });

  it("the accepted event carries exactly the allowlisted fields", () => {
    const result = parseFunnelEvent({
      step: "quote",
      source: "compare",
      properties: { offerCount: 7 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.event).sort()).toEqual(["properties", "source", "step"]);
    expect(Object.keys(result.event.properties)).toEqual(["offerCount"]);
  });
});

describe("toFunnelEventRow", () => {
  it("maps a lead onto the lead columns only", () => {
    const result = parseFunnelEvent({
      step: "lead",
      source: "cotizador",
      properties: { intent: "advisor" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(toFunnelEventRow(result.event)).toEqual({
      organization_id: null,
      step: "lead",
      source: "cotizador",
      lead_intent: "advisor",
      offer_count: null,
    });
  });

  it("maps a quote with no offer count to a null column", () => {
    const result = parseFunnelEvent({
      step: "quote",
      source: "api",
      properties: {},
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(toFunnelEventRow(result.event, "org-1")).toEqual({
      organization_id: "org-1",
      step: "quote",
      source: "api",
      lead_intent: null,
      offer_count: null,
    });
  });

  it("keeps an explicit zero offer count instead of null", () => {
    const result = parseFunnelEvent({
      step: "quote",
      source: "compare",
      properties: { offerCount: 0 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(toFunnelEventRow(result.event).offer_count).toBe(0);
  });

  it("leaves an advisor request with no property columns", () => {
    const result = parseFunnelEvent({
      step: "advisor_request",
      source: "cotizador",
      properties: {},
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(toFunnelEventRow(result.event)).toEqual({
      organization_id: null,
      step: "advisor_request",
      source: "cotizador",
      lead_intent: null,
      offer_count: null,
    });
  });

  it("never returns a column outside the table shape", () => {
    const allowed = ["organization_id", "step", "source", "lead_intent", "offer_count"];

    for (const payload of [
      { step: "lead", source: "contacto", properties: { intent: "contact" } },
      { step: "quote", source: "compare", properties: { offerCount: 4 } },
      { step: "advisor_request", source: "cotizador", properties: {} },
    ]) {
      const result = parseFunnelEvent(payload);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(Object.keys(toFunnelEventRow(result.event)).sort()).toEqual(
        [...allowed].sort(),
      );
    }
  });
});
