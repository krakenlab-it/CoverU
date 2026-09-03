import { describe, expect, it } from "vitest";
import {
  validateAllMigrations,
  validateMigrationOrdering,
  listMigrationFiles,
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
