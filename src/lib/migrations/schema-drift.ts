import { readFileSync } from "fs";
import { join } from "path";
import { MIGRATIONS_DIR } from "@/lib/migrations/validate";

export interface SchemaDriftIssue {
  table: string;
  field: string;
  message: string;
}

/**
 * Lightweight drift check between migration-defined public tables and
 * src/lib/types/database.ts + phase1.ts exported table names.
 * Does not connect to any database.
 */
export function extractPublicTablesFromMigrations(): Set<string> {
  const tables = new Set<string>();

  for (const file of ["20250101000000_initial_schema.sql", "20250102000000_phase1_schema.sql"]) {
    const path = join(MIGRATIONS_DIR, file);
    let content: string;
    try {
      content = readFileSync(path, "utf-8");
    } catch {
      continue;
    }

    for (const match of content.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.([a-z0-9_]+)/gi,
    )) {
      tables.add(match[1].toLowerCase());
    }
  }

  return tables;
}

export function extractTypeScriptTableReferences(): Set<string> {
  const refs = new Set<string>();
  const typeFiles = [
    join(process.cwd(), "src/lib/types/database.ts"),
    join(process.cwd(), "src/lib/types/phase1.ts"),
  ];

  for (const file of typeFiles) {
    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      continue;
    }

    for (const match of content.matchAll(/\.from\(\s*["']([a-z0-9_]+)["']\s*\)/g)) {
      refs.add(match[1].toLowerCase());
    }
  }

  return refs;
}

export function detectSchemaTypeScriptDrift(): SchemaDriftIssue[] {
  const migrationTables = extractPublicTablesFromMigrations();
  const tsTables = extractTypeScriptTableReferences();
  const issues: SchemaDriftIssue[] = [];

  for (const table of tsTables) {
    if (!migrationTables.has(table)) {
      issues.push({
        table,
        field: "table",
        message: `TypeScript references table "${table}" not found in checked migrations`,
      });
    }
  }

  return issues;
}
