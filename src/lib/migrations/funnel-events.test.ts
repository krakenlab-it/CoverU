import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  MIGRATIONS_DIR,
  listMigrationFiles,
  validateAllMigrations,
} from "@/lib/migrations/validate";
import { detectSchemaTypeScriptDrift } from "@/lib/migrations/schema-drift";

const FILE = "20261119130000_funnel_events.sql";
const content = readFileSync(join(MIGRATIONS_DIR, FILE), "utf-8");
/** DDL only: comment lines explain the rationale and should not affect assertions. */
const ddl = content
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

describe("funnel events migration", () => {
  it("uses the reserved filename and stays in timestamp order", () => {
    const files = listMigrationFiles();
    expect(files).toContain(FILE);
    expect(files.indexOf(FILE)).toBeGreaterThan(
      files.indexOf("20261119120000_leads_qualification.sql"),
    );
    expect(validateAllMigrations()).toEqual([]);
  });

  it("only adds one new table, without touching existing objects", () => {
    expect(content).toMatch(/CREATE TABLE IF NOT EXISTS public\.funnel_events/);
    expect(content).not.toMatch(/DROP TABLE/i);
    expect(content).not.toMatch(/DROP COLUMN/i);
    expect(content).not.toMatch(/RENAME/i);
    expect(content).not.toMatch(/ALTER TABLE public\.(?!funnel_events)/);
    expect(content).not.toMatch(/INSERT INTO/i);
  });

  it("enables RLS and scopes reads to the organization", () => {
    expect(content).toContain("ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY");
    expect(content).toContain('CREATE POLICY "funnel_events_org_read"');
    expect(content).toContain("public.user_organization_ids()");
    expect(content).toContain('CREATE POLICY "funnel_events_service_all"');
    expect(content).not.toMatch(/DISABLE ROW LEVEL SECURITY/i);
    expect(content).not.toMatch(/FOR SELECT TO anon/i);
  });

  it("accepts only the steps that exist today", () => {
    expect(content).toContain(
      "CHECK (step IN ('lead', 'quote', 'advisor_request'))",
    );

    // KAN-242 to KAN-245 are blocked; reserving their steps would be dead code.
    for (const blocked of ["proposal", "application", "payment", "policy"]) {
      expect(content).not.toContain(`'${blocked}'`);
    }
  });

  it("has no free-text or JSON column that could carry health data", () => {
    const tableDefinition = ddl.slice(
      ddl.indexOf("CREATE TABLE"),
      ddl.indexOf("CREATE INDEX"),
    );

    expect(tableDefinition).not.toMatch(/\bJSONB?\b/i);
    expect(tableDefinition).not.toMatch(/\bTEXT\[\]/i);
    expect(tableDefinition).not.toMatch(/metadata/i);
    expect(tableDefinition).not.toMatch(/payload/i);
  });

  it("carries only typed, allowlisted columns", () => {
    for (const column of [
      "id UUID PRIMARY KEY",
      "organization_id UUID",
      "step TEXT NOT NULL",
      "source TEXT NOT NULL",
      "lead_intent TEXT",
      "offer_count INTEGER",
      "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
    ]) {
      expect(content).toContain(column);
    }
  });

  it("forces each step's columns and source to agree", () => {
    expect(content).toContain("CONSTRAINT funnel_events_step_columns CHECK");
    expect(content).toContain("CONSTRAINT funnel_events_step_source CHECK");
    expect(content).toContain("source IN ('contacto', 'cotizador', 'compare', 'api')");
    expect(content).toContain("lead_intent IN ('contact', 'quote', 'advisor')");
    expect(content).toContain("offer_count >= 0");
  });

  it("indexes the dashboard read paths without dropping anything", () => {
    expect(content).toContain("funnel_events_created_at_idx");
    expect(content).toContain("funnel_events_step_created_at_idx");
    expect(content).toContain("funnel_events_org_created_at_idx");
    expect(content).not.toMatch(/DROP INDEX/i);
  });

  it("keeps TypeScript table references aligned with the migrations", () => {
    expect(detectSchemaTypeScriptDrift()).toEqual([]);
  });
});
