import { describe, expect, it } from "vitest";
import {
  describeCoinsurance,
  describeCopay,
  describeCoverageCeiling,
  describeDeductible,
  describePaymentModality,
  EMPTY_PLAN_CONDITIONS,
  hasPlanConditions,
  parsePlanConditions,
  planCoinsuranceRowSchema,
  planCopayRowSchema,
  planCoverageCeilingRowSchema,
  planDeductibleRowSchema,
  planPaymentModalityRowSchema,
  serviceCategoryLabel,
} from "@/lib/marketplace/plan-conditions";

const DEDUCTIBLE_ROW = {
  id: "ded-1",
  plan_version_id: "ver-1",
  scope: "individual",
  basis: "por_anio",
  amount: "100.00",
  notes: "[DEMO] Deducible individual por año.",
  sort_order: 1,
  is_demo: true,
  created_at: "2026-11-19T00:00:00Z",
};

const COINSURANCE_ROW = {
  id: "coi-1",
  plan_version_id: "ver-1",
  network: "en_red",
  insurer_pct: "80.00",
  insured_pct: "20.00",
  service_category: null,
  notes: null,
  sort_order: 1,
  is_demo: true,
  created_at: "2026-11-19T00:00:00Z",
};

const COPAY_ROW = {
  id: "cop-1",
  plan_version_id: "ver-1",
  service_category: "consulta",
  network: "en_red",
  amount: 10,
  notes: null,
  sort_order: 1,
  is_demo: true,
  created_at: "2026-11-19T00:00:00Z",
};

const PAYMENT_ROW = {
  id: "pay-1",
  plan_version_id: "ver-1",
  method: "debito",
  frequency: "mensual",
  is_default: true,
  payment_url: null,
  notes: null,
  sort_order: 1,
  is_demo: true,
  created_at: "2026-11-19T00:00:00Z",
};

const CEILING_ROW = {
  id: "cei-1",
  plan_version_id: "ver-1",
  scope: "por_anio",
  amount: 50000,
  service_category: null,
  notes: null,
  sort_order: 1,
  is_demo: true,
  created_at: "2026-11-19T00:00:00Z",
};

function fullRows() {
  return {
    deductibles: [DEDUCTIBLE_ROW],
    coinsurance: [COINSURANCE_ROW],
    copays: [COPAY_ROW],
    paymentModalities: [PAYMENT_ROW],
    ceilings: [CEILING_ROW],
  };
}

describe("plan condition row contracts", () => {
  it("coerces NUMERIC columns that PostgREST serializes as strings", () => {
    const deductible = planDeductibleRowSchema.parse(DEDUCTIBLE_ROW);
    expect(deductible.amount).toBe(100);

    const coinsurance = planCoinsuranceRowSchema.parse(COINSURANCE_ROW);
    expect(coinsurance.insurer_pct).toBe(80);
    expect(coinsurance.insured_pct).toBe(20);
  });

  it("rejects an unknown deductible basis", () => {
    const parsed = planDeductibleRowSchema.safeParse({
      ...DEDUCTIBLE_ROW,
      basis: "por_semestre",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a coinsurance percentage outside 0-100", () => {
    const parsed = planCoinsuranceRowSchema.safeParse({
      ...COINSURANCE_ROW,
      insurer_pct: 150,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a copay with a negative amount", () => {
    const parsed = planCopayRowSchema.safeParse({ ...COPAY_ROW, amount: -5 });
    expect(parsed.success).toBe(false);
  });

  it("rejects a coverage ceiling of zero", () => {
    const parsed = planCoverageCeilingRowSchema.safeParse({
      ...CEILING_ROW,
      amount: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unsupported payment method", () => {
    const parsed = planPaymentModalityRowSchema.safeParse({
      ...PAYMENT_ROW,
      method: "bitcoin",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a nullable payment URL and rejects a non-http one at the DB layer", () => {
    const parsed = planPaymentModalityRowSchema.parse({
      ...PAYMENT_ROW,
      payment_url: "https://aseguradora.example/pagar",
    });
    expect(parsed.payment_url).toBe("https://aseguradora.example/pagar");
  });
});

describe("parsePlanConditions", () => {
  it("returns typed rows for a complete condition set", () => {
    const conditions = parsePlanConditions(fullRows());

    expect(conditions.deductibles).toHaveLength(1);
    expect(conditions.deductibles[0].amount).toBe(100);
    expect(conditions.coinsurance[0].network).toBe("en_red");
    expect(conditions.copays[0].service_category).toBe("consulta");
    expect(conditions.paymentModalities[0].frequency).toBe("mensual");
    expect(conditions.ceilings[0].scope).toBe("por_anio");
    expect(hasPlanConditions(conditions)).toBe(true);
  });

  it("returns empty lists when Supabase returns null for a missing table", () => {
    const conditions = parsePlanConditions({
      deductibles: null,
      coinsurance: null,
      copays: null,
      paymentModalities: null,
      ceilings: null,
    });

    expect(conditions).toEqual(EMPTY_PLAN_CONDITIONS);
    expect(hasPlanConditions(conditions)).toBe(false);
  });

  it("drops only the table whose rows drift from the contract", () => {
    const conditions = parsePlanConditions({
      ...fullRows(),
      copays: [{ ...COPAY_ROW, network: "red_internacional" }],
    });

    expect(conditions.copays).toEqual([]);
    expect(conditions.deductibles).toHaveLength(1);
    expect(conditions.ceilings).toHaveLength(1);
  });

  it("treats an empty array as no conditions rather than a parse failure", () => {
    const conditions = parsePlanConditions({
      deductibles: [],
      coinsurance: [],
      copays: [],
      paymentModalities: [],
      ceilings: [],
    });

    expect(hasPlanConditions(conditions)).toBe(false);
  });
});

describe("plan condition display copy", () => {
  it("describes a deductible with scope, basis and USD amount", () => {
    const [row] = parsePlanConditions(fullRows()).deductibles;
    expect(describeDeductible(row)).toBe("Por persona, por año: $100,00");
  });

  it("describes an in-network coinsurance split", () => {
    const [row] = parsePlanConditions(fullRows()).coinsurance;
    expect(describeCoinsurance(row)).toBe("En red: aseguradora 80% · asegurado 20%");
  });

  it("names the benefit category on a coinsurance split when present", () => {
    const [row] = parsePlanConditions({
      ...fullRows(),
      coinsurance: [{ ...COINSURANCE_ROW, service_category: "hospitalizacion" }],
    }).coinsurance;
    expect(describeCoinsurance(row)).toBe(
      "En red · Hospitalización: aseguradora 80% · asegurado 20%",
    );
  });

  it("describes a copay with its service and network", () => {
    const [row] = parsePlanConditions(fullRows()).copays;
    expect(describeCopay(row)).toBe("Consulta · En red: $10,00");
  });

  it("marks the default payment modality", () => {
    const [row] = parsePlanConditions(fullRows()).paymentModalities;
    expect(describePaymentModality(row)).toBe("Débito · Mensual · predeterminada");
  });

  it("describes a coverage ceiling with its scope", () => {
    const [row] = parsePlanConditions(fullRows()).ceilings;
    expect(describeCoverageCeiling(row)).toBe("Por año: $50.000,00");
  });

  it("falls back to a readable label for an unmapped service category", () => {
    expect(serviceCategoryLabel("terapia_fisica")).toBe("terapia fisica");
    expect(serviceCategoryLabel("consulta")).toBe("Consulta");
  });
});
