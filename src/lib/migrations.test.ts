import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const UUID_REGEX =
  /['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi;

const TARIFF_V1_1_FILE = "20260903180000_tariff_schema_v1_1.sql";

describe("supabase migrations", () => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  it("includes phase 1 migration files", () => {
    expect(files).toContain("20250102000000_phase1_schema.sql");
    expect(files).toContain("20250102000001_phase1_seed_demo.sql");
    expect(files).toContain("20250103000000_organization_settings.sql");
  });

  it("includes tariff schema v1.1 migration", () => {
    expect(files).toContain(TARIFF_V1_1_FILE);
  });

  for (const file of files) {
    it(`${file} uses valid UUIDs in fixtures`, () => {
      const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
      const matches = [...content.matchAll(UUID_REGEX)].map((m) => m[1]);
      for (const uuid of matches) {
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      }
    });

    it(`${file} marks demo data explicitly`, () => {
      if (!file.includes("seed")) return;
      const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
      expect(content).toMatch(/is_demo\s*=\s*true|\[DEMO\]/);
    });
  }

  it("phase1 schema enables RLS on tenant tables", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, "20250102000000_phase1_schema.sql"),
      "utf-8",
    );
    expect(content).toContain("ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("organizations");
    expect(content).toContain("api_keys");
    expect(content).toContain("plan_versions_published_read");
  });

  describe("tariff schema v1.1 migration", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, TARIFF_V1_1_FILE),
      "utf-8",
    );

    it("converts tariffs.monthly_price to NUMERIC(12,2) with USING cast", () => {
      expect(content).toMatch(
        /ALTER COLUMN monthly_price TYPE NUMERIC\(12,\s*2\)\s+USING monthly_price::numeric/i,
      );
    });

    it("recreates positivity check allowing NULL", () => {
      expect(content).toContain(
        "CHECK (monthly_price IS NULL OR monthly_price > 0)",
      );
    });

    it("documents USD monthly from prima_mensual_con_imp, not cents", () => {
      expect(content).toContain("prima_mensual_con_imp");
      expect(content).toMatch(/not cents/i);
      expect(content).toMatch(/Do not divide BMI annual values by 12/i);
    });

    it("adds loader-ready tariff columns without dropping plan_id", () => {
      expect(content).toContain("plan_version_id");
      expect(content).toContain("grupo_asegurado");
      expect(content).toContain("tax_included");
      expect(content).toContain("tax_basis_raw");
      expect(content).not.toMatch(/DROP COLUMN.*plan_id/i);
    });

    it("documents deferred unique constraint on plan_version lookup keys", () => {
      expect(content).toMatch(
        /UNIQUE \(plan_version_id, age_min, age_max, gender, region, grupo_asegurado\)/,
      );
      expect(content).toContain("tariffs_plan_version_lookup_unique_idx");
      expect(content).toContain("WHERE plan_version_id IS NOT NULL");
    });

    it("adds plans provenance columns", () => {
      expect(content).toContain("coverage_provenance");
      expect(content).toContain("copay_provenance");
      expect(content).toContain("waiting_period_provenance");
    });

    it("drops exclusions empty-array default", () => {
      expect(content).toMatch(
        /ALTER COLUMN exclusions DROP DEFAULT/i,
      );
    });

    it("extends coverage_status with unknown and adds coverage_status_text", () => {
      expect(content).toMatch(
        /coverage_status IN \('covered', 'not_covered', 'conditional', 'unknown'\)/,
      );
      expect(content).toContain("coverage_status_text");
      expect(content).toMatch(/Do not coerce unknown to conditional/i);
    });

    it("does not import or seed Excel/matrix data", () => {
      expect(content).not.toMatch(/INSERT INTO/i);
      expect(content).not.toMatch(/COPY /i);
    });
  });

  it("organization settings migration enables RLS", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, "20250103000000_organization_settings.sql"),
      "utf-8",
    );
    expect(content).toContain("organization_settings");
    expect(content).toContain("ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("org_settings_admin_update");
  });
});
