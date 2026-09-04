import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const UUID_REGEX =
  /['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi;

const TARIFF_V1_1_FILE = "20260903180000_tariff_schema_v1_1.sql";
const TARIFF_V1_3_FILE = "20260903190000_tariff_schema_v1_3.sql";
const AUTH_ORG_PROVISIONING_FILE = "20260903200000_auth_org_provisioning.sql";
const INSURER_LOGO_URLS_FILE = "20260904010000_insurer_logo_urls_v1_3.sql";
const COVERAGE_AGENT_HARNESS_FILE = "20260904020000_coverage_agent_harness.sql";
const FIX_HYBRID_SEARCH_VECTOR_OPS_FILE =
  "20260904170000_fix_hybrid_search_policy_chunks_vector_ops.sql";

describe("supabase migrations (legacy checks)", () => {
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

  it("includes tariff schema v1.3 migration", () => {
    expect(files).toContain(TARIFF_V1_3_FILE);
  });

  it("includes auth org provisioning migration", () => {
    expect(files).toContain(AUTH_ORG_PROVISIONING_FILE);
  });

  it("includes insurer logo URLs migration for v1.3 carriers", () => {
    expect(files).toContain(INSURER_LOGO_URLS_FILE);
  });

  it("includes coverage agent harness and pgvector search migration", () => {
    expect(files).toContain(COVERAGE_AGENT_HARNESS_FILE);
    expect(files).toContain(FIX_HYBRID_SEARCH_VECTOR_OPS_FILE);
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

  describe("tariff schema v1.3 migration", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, TARIFF_V1_3_FILE),
      "utf-8",
    );

    it("documents plan_id vs plan_version_id FK decision for v1.3 loader", () => {
      expect(content).toMatch(/v1\.3 source files key tariffs by plan_id/i);
      expect(content).toContain("plan_version_id");
      expect(content).toMatch(/not reject rows that only provide plan_id/i);
    });

    it("adds plans.natural_key_plan_id and tariff v1.3 columns", () => {
      expect(content).toContain("natural_key_plan_id");
      expect(content).toContain("maternidad");
      expect(content).toContain("raw_monthly_price_con_imp");
      expect(content).toContain("raw_monthly_price_sin_imp");
      expect(content).toContain("periodicidad_origen");
      expect(content).toContain("vigencia_tarifario");
      expect(content).toContain("archivo_fuente");
      expect(content).toContain("source_file");
      expect(content).toContain("excel_row");
      expect(content).toContain("load_blocked");
    });

    it("aligns CHECK constraints to v1.3 observed enum values", () => {
      expect(content).toMatch(
        /gender IN \('any', 'femenino', 'masculino'\)/,
      );
      expect(content).toMatch(
        /region IN \('Nacional', 'Austro', 'Costa', 'Sierra'\)/,
      );
      expect(content).toMatch(
        /grupo_asegurado IS NULL OR grupo_asegurado IN \('titular', 'nino_solo'\)/,
      );
      expect(content).toMatch(
        /maternidad IS NULL OR maternidad IN \('Si', 'No'\)/,
      );
    });

    it("keeps sparse and empty v1.3 fields nullable with comments", () => {
      expect(content).toMatch(/tariffs\.deductible[\s\S]*Nullable/i);
      expect(content).toMatch(/tariffs\.annual_limit[\s\S]*Nullable/i);
      expect(content).toMatch(/tariffs\.copay_pct[\s\S]*100% null/i);
      expect(content).toMatch(/insurers\.logo_url[\s\S]*100% null/i);
      expect(content).toMatch(/plans\.coverage_summary[\s\S]*100% null/i);
      expect(content).toMatch(/plan_versions\.effective_from[\s\S]*100% null/i);
      expect(content).toMatch(/plan_versions\.published_at[\s\S]*100% null/i);
    });

    it("defines conservative unique grain on plan_id with lineage tiebreaker", () => {
      expect(content).toContain("tariffs_v1_3_load_grain_unique_idx");
      expect(content).toContain("plan_id");
      expect(content).toContain("COALESCE(source_file, '')");
      expect(content).toContain("COALESCE(excel_row, -1)");
      expect(content).toContain("COALESCE(deductible, -1)");
      expect(content).toContain("COALESCE(annual_limit, -1)");
      expect(content).toContain("COALESCE(maternidad, '')");
    });

    it("does not require coverage catalog tables for tariff load", () => {
      expect(content).not.toMatch(/coverage_clauses.*NOT NULL/i);
      expect(content).not.toMatch(/INSERT INTO.*coverage_clauses/i);
    });

    it("does not import or seed Excel/matrix data", () => {
      expect(content).not.toMatch(/INSERT INTO public\.(insurers|plans|tariffs)/i);
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

  describe("auth org provisioning migration", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, AUTH_ORG_PROVISIONING_FILE),
      "utf-8",
    );

    it("creates SECURITY DEFINER provisioning functions with search_path = public", () => {
      expect(content).toContain("SECURITY DEFINER");
      expect(content).toContain("SET search_path = public");
      expect(content).toContain("provision_user_organization");
      expect(content).toContain("provision_my_organization");
    });

    it("provisions owner membership from organization_name metadata", () => {
      expect(content).toContain("organization_name");
      expect(content).toContain("organization_members");
      expect(content).toMatch(/role[\s\S]*owner/);
      expect(content).toContain("status = 'active'");
    });

    it("is idempotent when membership already exists", () => {
      expect(content).toContain("IF EXISTS");
      expect(content).toContain("ON CONFLICT");
    });

    it("attaches trigger on auth.users insert", () => {
      expect(content).toContain("on_auth_user_created_provision_org");
      expect(content).toContain("AFTER INSERT ON auth.users");
    });
  });

  describe("coverage agent harness migration", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, COVERAGE_AGENT_HARNESS_FILE),
      "utf-8",
    );

    it("enables pgvector and hybrid search filtered by plan version", () => {
      expect(content).toContain("CREATE EXTENSION IF NOT EXISTS vector");
      expect(content).toContain("policy_chunks");
      expect(content).toContain("hybrid_search_policy_chunks");
      expect(content).toContain("match_plan_version_id");
      expect(content).toContain("SET search_path = public, extensions");
      expect(content).toContain(
        "ORDER BY pc.embedding OPERATOR(extensions.<=>) query_embedding",
      );
      expect(content).toContain("extensions.vector_cosine_ops");
      expect(content).toContain("ENABLE ROW LEVEL SECURITY");
    });

    it("records agent runs with tool traces", () => {
      expect(content).toContain("coverage_agent_runs");
      expect(content).toContain("tool_calls");
      expect(content).toContain("events");
    });
  });

  describe("hybrid search vector ops fix migration", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, FIX_HYBRID_SEARCH_VECTOR_OPS_FILE),
      "utf-8",
    );

    it("only replaces hybrid_search_policy_chunks with extensions-qualified vector ops", () => {
      expect(content).toContain("CREATE OR REPLACE FUNCTION public.hybrid_search_policy_chunks");
      expect(content).toContain("SET search_path = public, extensions");
      expect(content).toContain(
        "ORDER BY pc.embedding OPERATOR(extensions.<=>) query_embedding",
      );
      expect(content).not.toMatch(/CREATE TABLE/i);
      expect(content).not.toMatch(/CREATE INDEX/i);
    });
  });
});
