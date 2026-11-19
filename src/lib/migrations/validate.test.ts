import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  PLAN_CONDITIONS_MIGRATION,
  PLAN_CONDITION_TABLES,
  QUOTE_VERSION_REFS_MIGRATION,
  QUOTE_VERSION_REF_COLUMNS,
  validateAllMigrations,
  validateMigrationOrdering,
  validatePlanConditionsSchema,
  validateQuoteVersionRefsSchema,
  listMigrationFiles,
  MIGRATIONS_DIR,
} from "@/lib/migrations/validate";
import { detectSchemaTypeScriptDrift } from "@/lib/migrations/schema-drift";

describe("migration static validation", () => {
  it("has lexicographically ordered migration files", () => {
    const files = listMigrationFiles();
    const issues = validateMigrationOrdering(files);
    expect(issues).toEqual([]);
  });

  it("passes full static validation suite", () => {
    const issues = validateAllMigrations();
    expect(issues).toEqual([]);
  });

  it("has no schema/typescript table drift for referenced tables", () => {
    const drift = detectSchemaTypeScriptDrift();
    expect(drift).toEqual([]);
  });
});

describe("plan conditions migration (KAN-230)", () => {
  const files = listMigrationFiles();
  const content = readFileSync(join(MIGRATIONS_DIR, PLAN_CONDITIONS_MIGRATION), "utf-8");

  it("is the only plan conditions migration and precedes the quote version pins", () => {
    const planConditionFiles = files.filter((f) => f.includes("plan_conditions"));
    expect(planConditionFiles).toEqual([PLAN_CONDITIONS_MIGRATION]);
    expect(files.indexOf(PLAN_CONDITIONS_MIGRATION)).toBeLessThan(
      files.indexOf(QUOTE_VERSION_REFS_MIGRATION),
    );
  });

  it("creates every condition table additively with a plan_versions reference", () => {
    for (const table of PLAN_CONDITION_TABLES) {
      expect(content).toContain(`CREATE TABLE IF NOT EXISTS public.${table} (`);
      expect(content).toMatch(
        new RegExp(
          `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        ),
      );
      expect(content).toMatch(
        new RegExp(`CREATE\\s+TRIGGER\\s+${table}_immutable`),
      );
    }
    expect(content).toMatch(
      /plan_version_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.plan_versions\(id\)/,
    );
  });

  it("extends existing tables instead of re-creating them", () => {
    expect(content).not.toMatch(/CREATE\s+TABLE[^;]*public\.exclusions\b/i);
    expect(content).not.toMatch(/CREATE\s+TABLE[^;]*public\.waiting_periods\b/i);
    expect(content).not.toMatch(/DROP\s+TABLE/i);
    expect(content).not.toMatch(/DROP\s+COLUMN/i);
    expect(content).toMatch(
      /ALTER TABLE public\.exclusions\s+ADD COLUMN IF NOT EXISTS exclusion_type/,
    );
  });

  it("keeps published plan versions immutable through the shared trigger", () => {
    expect(content).toContain("prevent_published_plan_condition_change");
    expect(content).toMatch(/IF v_status = 'published' THEN/);
    expect(content).toMatch(/RAISE EXCEPTION 'Plan conditions/);
  });

  it("guards every demo fixture insert for replay safety", () => {
    const inserts = content.match(/\bINSERT\s+INTO\b/gi) ?? [];
    const guards = content.match(/WHERE\s+NOT\s+EXISTS/gi) ?? [];
    expect(inserts.length).toBeGreaterThan(0);
    expect(guards.length).toBeGreaterThanOrEqual(inserts.length);
    expect(content).toContain("is_demo = true");
  });

  it("flags a non-additive or unprotected plan conditions schema", () => {
    const issues = validatePlanConditionsSchema([
      ...files.filter((f) => f !== PLAN_CONDITIONS_MIGRATION),
    ]);
    expect(issues).toEqual([
      {
        file: "(missing)",
        rule: "plan_conditions",
        message: `Missing ${PLAN_CONDITIONS_MIGRATION}`,
      },
    ]);
  });
});

describe("quote version refs migration (KAN-231)", () => {
  const files = listMigrationFiles();
  const content = readFileSync(join(MIGRATIONS_DIR, QUOTE_VERSION_REFS_MIGRATION), "utf-8");

  it("is the only quote version refs migration and sits last", () => {
    expect(files.filter((f) => f.includes("quotes_version_refs"))).toEqual([
      QUOTE_VERSION_REFS_MIGRATION,
    ]);
    expect(files.at(-1)).toBe(QUOTE_VERSION_REFS_MIGRATION);
    expect(files.indexOf(QUOTE_VERSION_REFS_MIGRATION)).toBeGreaterThan(
      files.indexOf(PLAN_CONDITIONS_MIGRATION),
    );
  });

  it("adds both version pins to quotes additively and nullable", () => {
    for (const column of QUOTE_VERSION_REF_COLUMNS) {
      expect(content).toMatch(
        new RegExp(
          `ALTER TABLE public\\.quotes\\s+ADD COLUMN IF NOT EXISTS ${column} UUID`,
        ),
      );
    }
    expect(content).not.toMatch(/ADD COLUMN IF NOT EXISTS \w+ UUID NOT NULL/i);
    expect(content).not.toMatch(/DROP COLUMN/i);
  });

  it("references tariffs and plan_versions without blocking catalog cleanup", () => {
    expect(content).toMatch(
      /tariff_version_id UUID\s+REFERENCES public\.tariffs\(id\) ON DELETE SET NULL/,
    );
    expect(content).toMatch(
      /plan_conditions_version_id UUID\s+REFERENCES public\.plan_versions\(id\) ON DELETE SET NULL/,
    );
  });

  it("validates and freezes the pins with triggers", () => {
    expect(content).toContain("CREATE TRIGGER quotes_version_refs_validate");
    expect(content).toContain("CREATE TRIGGER quotes_version_refs_immutable");
    expect(content).toContain("validate_quote_version_refs");
    expect(content).toContain("prevent_quote_version_ref_change");
  });

  it("backfills legacy rows without guessing", () => {
    expect(content).toMatch(/SET plan_conditions_version_id = plan_version_id/);
    expect(content).toMatch(/SET tariff_version_id = q\.tariff_id/);
    expect(content).toMatch(/AND t\.plan_id = pv\.plan_id/);
  });
  it("flags a missing quote version refs migration", () => {
    const issues = validateQuoteVersionRefsSchema([
      ...files.filter((f) => f !== QUOTE_VERSION_REFS_MIGRATION),
    ]);
    expect(issues).toEqual([
      {
        file: "(missing)",
        rule: "quote_version_refs",
        message: `Missing ${QUOTE_VERSION_REFS_MIGRATION}`,
      },
    ]);
  });

  it("is wired into the full static validation suite", () => {
    expect(validateQuoteVersionRefsSchema(files)).toEqual([]);
  });
});