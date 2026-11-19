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

export const PLAN_CONDITIONS_MIGRATION = "20261119100000_plan_conditions.sql";

export const PLAN_CONDITION_TABLES = [
  "plan_deductibles",
  "plan_coinsurance",
  "plan_copays",
  "plan_payment_modalities",
  "plan_coverage_ceilings",
] as const;

/** Tables that already existed before KAN-230 and must only be extended, never re-created. */
export const PRE_EXISTING_CONDITION_TABLES = ["exclusions", "waiting_periods"] as const;

/**
 * KAN-230 guardrails: plan conditions must be additive, versioned by plan_versions,
 * RLS-protected, immutable after publish, and must not re-create existing tables.
 */
export function validatePlanConditionsSchema(files: string[]): MigrationIssue[] {
  const issues: MigrationIssue[] = [];

  if (!files.includes(PLAN_CONDITIONS_MIGRATION)) {
    return [
      {
        file: "(missing)",
        rule: "plan_conditions",
        message: `Missing ${PLAN_CONDITIONS_MIGRATION}`,
      },
    ];
  }

  const content = readFileSync(join(MIGRATIONS_DIR, PLAN_CONDITIONS_MIGRATION), "utf-8");

  for (const table of PLAN_CONDITION_TABLES) {
    if (!new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+public\\.${table}\\b`, "i").test(content)) {
      issues.push({
        file: PLAN_CONDITIONS_MIGRATION,
        rule: "plan_conditions",
        message: `Plan conditions table ${table} must be created with IF NOT EXISTS (additive)`,
      });
    }

    if (!new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i").test(content)) {
      issues.push({
        file: PLAN_CONDITIONS_MIGRATION,
        rule: "plan_conditions",
        message: `Plan conditions table ${table} must enable RLS`,
      });
    }
  }

  const versionedTables = content.match(
    /plan_version_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.plan_versions\(id\)/gi,
  );
  if ((versionedTables ?? []).length < PLAN_CONDITION_TABLES.length) {
    issues.push({
      file: PLAN_CONDITIONS_MIGRATION,
      rule: "plan_conditions",
      message: "Every plan conditions table must reference plan_versions(id) via plan_version_id",
    });
  }

  for (const table of PRE_EXISTING_CONDITION_TABLES) {
    if (new RegExp(`CREATE\\s+TABLE[^;]*public\\.${table}\\b`, "i").test(content)) {
      issues.push({
        file: PLAN_CONDITIONS_MIGRATION,
        rule: "plan_conditions",
        message: `${table} already exists in 20250102000000_phase1_schema.sql and must be extended, not re-created`,
      });
    }

    if (new RegExp(`DROP\\s+TABLE[^;]*public\\.${table}\\b`, "i").test(content)) {
      issues.push({
        file: PLAN_CONDITIONS_MIGRATION,
        rule: "plan_conditions",
        message: `${table} must not be dropped by the plan conditions migration`,
      });
    }
  }

  if (!/prevent_published_plan_condition_change/.test(content)) {
    issues.push({
      file: PLAN_CONDITIONS_MIGRATION,
      rule: "plan_conditions",
      message: "Plan conditions must reuse the published-version immutability trigger pattern",
    });
  }

  for (const table of PLAN_CONDITION_TABLES) {
    if (!new RegExp(`CREATE\\s+TRIGGER\\s+${table}_immutable`, "i").test(content)) {
      issues.push({
        file: PLAN_CONDITIONS_MIGRATION,
        rule: "plan_conditions",
        message: `Table ${table} must have an immutability trigger`,
      });
    }
  }

  if (!/is_demo\s*=\s*true|\[DEMO\]/.test(content)) {
    issues.push({
      file: PLAN_CONDITIONS_MIGRATION,
      rule: "plan_conditions",
      message: "Plan conditions demo fixtures must be marked is_demo=true / [DEMO]",
    });
  }

  const insertCount = (content.match(/\bINSERT\s+INTO\b/gi) ?? []).length;
  const idempotentInserts = (content.match(/ON\s+CONFLICT|WHERE\s+NOT\s+EXISTS/gi) ?? [])
    .length;
  if (insertCount > 0 && idempotentInserts < insertCount) {
    issues.push({
      file: PLAN_CONDITIONS_MIGRATION,
      rule: "plan_conditions",
      message:
        "Every plan conditions fixture insert must be replay-safe (ON CONFLICT or WHERE NOT EXISTS)",
    });
  }

  if (/(DROP\s+COLUMN|DROP\s+CONSTRAINT\s+(?!IF\s+EXISTS))/i.test(content)) {
    issues.push({
      file: PLAN_CONDITIONS_MIGRATION,
      rule: "plan_conditions",
      message: "Plan conditions migration must be additive: no DROP COLUMN, drop constraints only with IF EXISTS",
    });
  }

  return issues;
}

export const QUOTE_VERSION_REFS_MIGRATION = "20261119110000_quotes_version_refs.sql";

export const QUOTE_VERSION_REF_COLUMNS = [
  "tariff_version_id",
  "plan_conditions_version_id",
] as const;

/**
 * KAN-231 guardrails: quotes must pin both versions, the columns must be additive and
 * nullable for legacy rows, and the pins must be validated and frozen by triggers.
 */
export function validateQuoteVersionRefsSchema(files: string[]): MigrationIssue[] {
  const issues: MigrationIssue[] = [];

  if (!files.includes(QUOTE_VERSION_REFS_MIGRATION)) {
    return [
      {
        file: "(missing)",
        rule: "quote_version_refs",
        message: `Missing ${QUOTE_VERSION_REFS_MIGRATION}`,
      },
    ];
  }

  const content = readFileSync(join(MIGRATIONS_DIR, QUOTE_VERSION_REFS_MIGRATION), "utf-8");

  for (const column of QUOTE_VERSION_REF_COLUMNS) {
    if (
      !new RegExp(
        `ALTER\\s+TABLE\\s+public\\.quotes\\s+ADD\\s+COLUMN\\s+IF\\s+NOT\\s+EXISTS\\s+${column}\\b`,
        "i",
      ).test(content)
    ) {
      issues.push({
        file: QUOTE_VERSION_REFS_MIGRATION,
        rule: "quote_version_refs",
        message: `quotes.${column} must be added additively with ADD COLUMN IF NOT EXISTS`,
      });
    }
  }

  if (/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+\w+\s+UUID\s+NOT\s+NULL/i.test(content)) {
    issues.push({
      file: QUOTE_VERSION_REFS_MIGRATION,
      rule: "quote_version_refs",
      message: "Version pins must stay nullable so legacy quotes remain valid",
    });
  }

  if (
    !/tariff_version_id\s+UUID\s+REFERENCES\s+public\.tariffs\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i.test(
      content,
    )
  ) {
    issues.push({
      file: QUOTE_VERSION_REFS_MIGRATION,
      rule: "quote_version_refs",
      message: "quotes.tariff_version_id must reference public.tariffs(id) ON DELETE SET NULL",
    });
  }

  if (
    !/plan_conditions_version_id\s+UUID\s+REFERENCES\s+public\.plan_versions\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i.test(
      content,
    )
  ) {
    issues.push({
      file: QUOTE_VERSION_REFS_MIGRATION,
      rule: "quote_version_refs",
      message:
        "quotes.plan_conditions_version_id must reference public.plan_versions(id) ON DELETE SET NULL",
    });
  }

  if (!/CREATE\s+TRIGGER\s+quotes_version_refs_validate/i.test(content)) {
    issues.push({
      file: QUOTE_VERSION_REFS_MIGRATION,
      rule: "quote_version_refs",
      message: "Quote version pins must be validated by a trigger",
    });
  }

  if (!/CREATE\s+TRIGGER\s+quotes_version_refs_immutable/i.test(content)) {
    issues.push({
      file: QUOTE_VERSION_REFS_MIGRATION,
      rule: "quote_version_refs",
      message: "Quote version pins must be immutable once recorded",
    });
  }

  if (/(DROP\s+COLUMN|DROP\s+TABLE)/i.test(content)) {
    issues.push({
      file: QUOTE_VERSION_REFS_MIGRATION,
      rule: "quote_version_refs",
      message: "Quote version pins must be additive: no DROP COLUMN or DROP TABLE",
    });
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
    ...validatePlanConditionsSchema(files),
    ...validateQuoteVersionRefsSchema(files),
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
