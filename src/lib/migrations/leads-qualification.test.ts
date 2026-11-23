import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  MIGRATIONS_DIR,
  listMigrationFiles,
  validateAllMigrations,
} from "@/lib/migrations/validate";
import { detectSchemaTypeScriptDrift } from "@/lib/migrations/schema-drift";

const FILE = "20261119120000_leads_qualification.sql";
const content = readFileSync(join(MIGRATIONS_DIR, FILE), "utf-8");

describe("leads qualification migration", () => {
  it("uses the reserved filename and stays in timestamp order", () => {
    const files = listMigrationFiles();
    expect(files).toContain(FILE);
    expect(validateAllMigrations()).toEqual([]);
  });

  it("adds only additive columns to public.leads", () => {
    expect(content).toMatch(/ALTER TABLE public\.leads/);
    expect(content).not.toMatch(/DROP TABLE/i);
    expect(content).not.toMatch(/DROP COLUMN/i);
    expect(content).not.toMatch(/RENAME COLUMN/i);
    expect(content).not.toMatch(/CREATE TABLE/i);
    expect(content).not.toMatch(/INSERT INTO/i);

    for (const column of [
      "dependents",
      "city",
      "budget",
      "current_insurance",
      "needs_human_followup",
      "consent_granted",
      "consent_version",
      "consent_granted_at",
      "intent",
    ]) {
      expect(content).toContain(`ADD COLUMN IF NOT EXISTS ${column}`);
    }
  });

  it("keeps every added column nullable or defaulted so old inserts still work", () => {
    for (const notNull of [
      "needs_human_followup BOOLEAN NOT NULL DEFAULT false",
      "consent_granted BOOLEAN NOT NULL DEFAULT false",
      "intent TEXT NOT NULL DEFAULT 'contact'",
    ]) {
      expect(content).toContain(notNull);
    }

    // Qualification columns are optional, so a contact lead can omit them.
    expect(content).not.toMatch(/ADD COLUMN IF NOT EXISTS dependents INTEGER NOT NULL/);
    expect(content).not.toMatch(/ADD COLUMN IF NOT EXISTS city TEXT NOT NULL/);
    expect(content).not.toMatch(/ADD COLUMN IF NOT EXISTS budget NUMERIC\(12, 2\) NOT NULL/);
  });

  it("constrains the qualification ranges the API validates", () => {
    expect(content).toMatch(/dependents >= 0 AND dependents <= 20/);
    expect(content).toMatch(/budget >= 0/);
    expect(content).toMatch(/intent IN \('contact', 'quote', 'advisor'\)/);
  });

  it("indexes the advisor work queue without touching existing indexes", () => {
    expect(content).toContain("leads_human_followup_idx");
    expect(content).toContain("WHERE needs_human_followup");
    expect(content).not.toMatch(/DROP INDEX/i);
  });

  it("relies on the existing leads RLS rather than adding a conflicting policy", () => {
    expect(content).not.toMatch(/CREATE POLICY/i);
    expect(content).not.toMatch(/DISABLE ROW LEVEL SECURITY/i);
  });

  it("keeps TypeScript table references aligned with the migrations", () => {
    expect(detectSchemaTypeScriptDrift()).toEqual([]);
  });
});
