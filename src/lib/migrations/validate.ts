import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

const UUID_REGEX =
  /['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi;

const TIMESTAMP_PREFIX = /^(\d{14})_/;

export interface MigrationIssue {
  file: string;
  rule: string;
  message: string;
}

export function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function validateMigrationOrdering(files: string[]): MigrationIssue[] {
  const issues: MigrationIssue[] = [];
  let previousTimestamp = "";

  for (const file of files) {
    const match = file.match(TIMESTAMP_PREFIX);
    if (!match) {
      issues.push({
        file,
        rule: "ordering",
        message: "Migration filename must start with YYYYMMDDHHMMSS_",
      });
      continue;
    }

    const timestamp = match[1];
    if (previousTimestamp && timestamp < previousTimestamp) {
      issues.push({
        file,
        rule: "ordering",
        message: `Out-of-order timestamp ${timestamp} after ${previousTimestamp}`,
      });
    }
    previousTimestamp = timestamp;
  }

  return issues;
}

export function validateMigrationUuids(content: string, file: string): MigrationIssue[] {
  const issues: MigrationIssue[] = [];
  const matches = [...content.matchAll(UUID_REGEX)].map((m) => m[1]);

  for (const uuid of matches) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      issues.push({
        file,
        rule: "uuid",
        message: `Invalid UUID literal: ${uuid}`,
      });
    }
  }

  return issues;
}

export function validateSeedMarkers(content: string, file: string): MigrationIssue[] {
  if (!file.includes("seed")) return [];

  if (!content.match(/is_demo\s*=\s*true|\[DEMO\]/)) {
    return [
      {
        file,
        rule: "seed_marker",
        message: "Seed migration must mark demo data with is_demo=true or [DEMO]",
      },
    ];
  }

  return [];
}

export function validateSeedIdempotency(content: string, file: string): MigrationIssue[] {
  if (!file.includes("seed")) return [];

  const insertCount = (content.match(/\bINSERT\b/gi) ?? []).length;
  const onConflictCount = (content.match(/ON CONFLICT/gi) ?? []).length;

  if (insertCount > 0 && onConflictCount === 0) {
    return [
      {
        file,
        rule: "seed_idempotency",
        message: "Seed migration should use ON CONFLICT for idempotent inserts",
      },
    ];
  }

  return [];
}

export function validateRlsPresence(files: string[]): MigrationIssue[] {
  const schemaFiles = files.filter((f) => f.includes("schema") && !f.includes("seed"));
  const issues: MigrationIssue[] = [];

  for (const file of schemaFiles) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    const createsTable = /\bCREATE TABLE\b/i.test(content);
    const enablesRls = /ENABLE ROW LEVEL SECURITY/i.test(content);

    if (createsTable && !enablesRls) {
      issues.push({
        file,
        rule: "rls",
        message: "Schema migration creates tables but does not enable RLS",
      });
    }
  }

  return issues;
}

export function validateDuplicateHazards(files: string[]): MigrationIssue[] {
  const issues: MigrationIssue[] = [];
  const seenTypes = new Map<string, string>();
  const seenPolicies = new Map<string, string>();
  const seenTables = new Map<string, string>();

  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");

    for (const match of content.matchAll(
      /CREATE\s+(?:OR\s+REPLACE\s+)?TYPE\s+([a-z0-9_."]+)/gi,
    )) {
      const name = match[1].replace(/"/g, "").toLowerCase();
      const previous = seenTypes.get(name);
      if (previous && previous !== file) {
        issues.push({
          file,
          rule: "duplicate_type",
          message: `Type ${name} also created in ${previous}`,
        });
      } else {
        seenTypes.set(name, file);
      }
    }

    for (const match of content.matchAll(
      /CREATE\s+POLICY\s+([a-z0-9_"]+)/gi,
    )) {
      const name = match[1].replace(/"/g, "").toLowerCase();
      const previous = seenPolicies.get(name);
      if (previous && previous !== file) {
        issues.push({
          file,
          rule: "duplicate_policy",
          message: `Policy ${name} also created in ${previous}`,
        });
      } else {
        seenPolicies.set(name, file);
      }
    }

    for (const match of content.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z0-9_"]+)/gi,
    )) {
      const name = match[1].replace(/"/g, "").toLowerCase();
      const previous = seenTables.get(name);
      if (previous && previous !== file) {
        issues.push({
          file,
          rule: "duplicate_table",
          message: `Table ${name} also created in ${previous}`,
        });
      } else {
        seenTables.set(name, file);
      }
    }
  }

  return issues;
}

export function validatePhase1Requirements(files: string[]): MigrationIssue[] {
  const issues: MigrationIssue[] = [];

  if (!files.includes("20250102000000_phase1_schema.sql")) {
    issues.push({
      file: "(missing)",
      rule: "phase1",
      message: "Missing 20250102000000_phase1_schema.sql",
    });
  }

  if (!files.includes("20250102000001_phase1_seed_demo.sql")) {
    issues.push({
      file: "(missing)",
      rule: "phase1",
      message: "Missing 20250102000001_phase1_seed_demo.sql",
    });
  }

  const phase1 = files.find((f) => f === "20250102000000_phase1_schema.sql");
  if (phase1) {
    const content = readFileSync(join(MIGRATIONS_DIR, phase1), "utf-8");
    for (const required of [
      "ENABLE ROW LEVEL SECURITY",
      "organizations",
      "api_keys",
      "plan_versions_published_read",
    ]) {
      if (!content.includes(required)) {
        issues.push({
          file: phase1,
          rule: "phase1",
          message: `Phase 1 schema missing required fragment: ${required}`,
        });
      }
    }
  }

  return issues;
}

export function validateAllMigrations(): MigrationIssue[] {
  const files = listMigrationFiles();
  const issues: MigrationIssue[] = [
    ...validateMigrationOrdering(files),
    ...validatePhase1Requirements(files),
    ...validateRlsPresence(files),
    ...validateDuplicateHazards(files),
  ];

  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    issues.push(
      ...validateMigrationUuids(content, file),
      ...validateSeedMarkers(content, file),
      ...validateSeedIdempotency(content, file),
    );
  }

  return issues;
}
