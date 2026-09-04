import { describe, expect, it } from "vitest";
import {
  emptyToNull,
  mapCatalogPackage,
  mapInsurerRow,
  mapPlanRow,
  mapPlanVersionRow,
  mapTariffRow,
  parseBoolean,
} from "../../scripts/catalog-v1_3/map-rows";
import { parseCsv } from "../../scripts/catalog-v1_3/parse-csv";

describe("catalog v1.3 row mapping", () => {
  it("parses insurer booleans and null logo_url", () => {
    const row = mapInsurerRow({
      id: "81145748-de94-5397-a7f9-599ea9ec048f",
      name: "BMI",
      slug: "bmi",
      logo_url: "",
      is_demo: "False",
    });

    expect(row.is_demo).toBe(false);
    expect(row.logo_url).toBeNull();
  });

  it("maps plan natural_key_plan_id and active status", () => {
    const row = mapPlanRow({
      id: "4aea58a3-f1c6-5669-b717-3d6514969da2",
      insurer_id: "81145748-de94-5397-a7f9-599ea9ec048f",
      name: "GMM Tarifa 10K - Austro",
      description: "producto=GMM",
      coverage_summary: "",
      status: "active",
      is_demo: "False",
      natural_key_plan_id: "BMI-GMM-AUSTRO-TARIFA-10K",
    });

    expect(row.natural_key_plan_id).toBe("BMI-GMM-AUSTRO-TARIFA-10K");
    expect(row.status).toBe("active");
  });

  it("maps draft plan_versions from CSV", () => {
    const row = mapPlanVersionRow({
      id: "0deb7182-310b-5a36-9a21-b3518c4198f5",
      plan_id: "4aea58a3-f1c6-5669-b717-3d6514969da2",
      version_number: "1",
      label: "2026 / Anual (por confirmar)",
      status: "draft",
      effective_from: "",
      effective_to: "",
      published_at: "",
      changelog: "Staged",
      is_demo: "False",
      natural_key_plan_id: "BMI-GMM-AUSTRO-TARIFA-10K",
    });

    expect(row.status).toBe("draft");
    expect(row.published_at).toBeNull();
    expect(row.version_number).toBe(1);
  });

  it("maps loadable tariff rows with tax-included monthly price", () => {
    const { row, skipReason } = mapTariffRow({
      id: "02ae118c-1252-5700-81c8-862e18300f9b",
      plan_id: "4aea58a3-f1c6-5669-b717-3d6514969da2",
      age_min: "0",
      age_max: "0",
      gender: "any",
      region: "Austro",
      monthly_price: "4.34",
      raw_monthly_price_con_imp: "4.34",
      raw_monthly_price_sin_imp: "4.32",
      tax_included: "true",
      tax_basis_raw: "prima_mensual_con_imp=4.34",
      deductible: "10000.0",
      copay_pct: "",
      annual_limit: "",
      exclusions: "",
      is_demo: "False",
      maternidad: "",
      grupo_asegurado: "titular",
      periodicidad_origen: "Anual (por confirmar)",
      vigencia_tarifario: "2026",
      archivo_fuente: "Tarifas_2026_bmi_.xlsx",
      source_file: "matriz_consolidada_coveru (1).xlsx",
      source_drive_id: "drive-id",
      sheet: "CONSOLIDADO",
      excel_row: "2",
      load_blocked: "False",
      load_block_reasons: "",
    });

    expect(skipReason).toBeNull();
    expect(row?.monthly_price).toBe(4.34);
    expect(row?.grupo_asegurado).toBe("titular");
    expect(row?.tax_included).toBe(true);
  });

  it("skips load_blocked tariff rows", () => {
    const { row, skipReason } = mapTariffRow({
      id: "blocked-1",
      plan_id: "plan-1",
      age_min: "18",
      age_max: "65",
      gender: "any",
      region: "Sierra",
      monthly_price: "100",
      load_blocked: "True",
      load_block_reasons: "quarantined",
    });

    expect(row).toBeNull();
    expect(skipReason).toMatch(/load_blocked|quarantined/);
  });

  it("parses CSV with quoted commas in tax_basis_raw", () => {
    const csv = `id,plan_id,age_min,age_max,gender,region,monthly_price,tax_basis_raw,load_blocked,load_block_reasons,is_demo
t1,p1,18,65,any,Sierra,10.5,"prima=10.5; note=with, comma",False,,False`;

    const [raw] = parseCsv(csv);
    const { row } = mapTariffRow({
      ...raw,
      raw_monthly_price_con_imp: "",
      raw_monthly_price_sin_imp: "",
      tax_included: "true",
      deductible: "",
      copay_pct: "",
      annual_limit: "",
      exclusions: "",
      maternidad: "",
      grupo_asegurado: "titular",
      periodicidad_origen: "",
      vigencia_tarifario: "",
      archivo_fuente: "",
      source_file: "",
      source_drive_id: "",
      sheet: "",
      excel_row: "",
    });

    expect(row?.tax_basis_raw).toContain("comma");
  });

  it("maps full package counts from fixture rows", () => {
    const pkg = mapCatalogPackage({
      insurers: [
        {
          id: "i1",
          name: "BMI",
          slug: "bmi",
          logo_url: "",
          is_demo: "False",
        },
      ],
      plans: [
        {
          id: "p1",
          insurer_id: "i1",
          name: "Plan",
          description: "",
          coverage_summary: "",
          status: "active",
          is_demo: "False",
          natural_key_plan_id: "PLAN-1",
        },
      ],
      planVersions: [
        {
          id: "v1",
          plan_id: "p1",
          version_number: "1",
          label: "v1",
          status: "draft",
          effective_from: "",
          effective_to: "",
          published_at: "",
          changelog: "",
          is_demo: "False",
          natural_key_plan_id: "PLAN-1",
        },
      ],
      tariffs: [
        {
          id: "t1",
          plan_id: "p1",
          age_min: "18",
          age_max: "65",
          gender: "any",
          region: "Nacional",
          monthly_price: "50",
          load_blocked: "False",
          load_block_reasons: "",
          is_demo: "False",
        },
      ],
    });

    expect(pkg.insurers).toHaveLength(1);
    expect(pkg.plans).toHaveLength(1);
    expect(pkg.planVersions).toHaveLength(1);
    expect(pkg.tariffs).toHaveLength(1);
    expect(pkg.skippedTariffs).toHaveLength(0);
  });
});

describe("catalog v1.3 parse helpers", () => {
  it("parses boolean strings from CSV", () => {
    expect(parseBoolean("False")).toBe(false);
    expect(parseBoolean("True")).toBe(true);
  });

  it("converts empty strings to null", () => {
    expect(emptyToNull("  ")).toBeNull();
    expect(emptyToNull("value")).toBe("value");
  });
});
