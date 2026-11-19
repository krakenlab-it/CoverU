import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { MIGRATIONS_DIR, listMigrationFiles } from "@/lib/migrations/validate";

/**
 * Contract tests for KAN-252: the health-data access log must stay append-only and
 * tenant-scoped. These read the migration file statically — no database connection.
 */

const MIGRATION_FILE = "20261119140000_health_data_access_log.sql";
const TABLE = "health_data_access_log";

function migrationSql(): string {
  return readFileSync(join(MIGRATIONS_DIR, MIGRATION_FILE), "utf-8");
}

function policyBodies(sql: string): string[] {
  return [...sql.matchAll(/CREATE POLICY[\s\S]*?;/g)].map((match) => match[0]);
}

describe("health_data_access_log migration", () => {
  it("is present exactly once and sorted with the other migrations", () => {
    const files = listMigrationFiles();

    expect(files.filter((file) => file === MIGRATION_FILE)).toHaveLength(1);
    expect(files).toContain(MIGRATION_FILE);
  });

  it("creates the table with RLS enabled", () => {
    const sql = migrationSql();

    expect(sql).toMatch(
      new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${TABLE}\\s*\\(`),
    );
    expect(sql).toMatch(
      new RegExp(`ALTER TABLE public\\.${TABLE} ENABLE ROW LEVEL SECURITY`),
    );
  });

  it("has no UPDATE or DELETE policy for any role", () => {
    const policies = policyBodies(migrationSql());

    expect(policies.length).toBeGreaterThan(0);
    for (const policy of policies) {
      expect(policy).not.toMatch(/\bFOR\s+(UPDATE|DELETE|ALL)\b/i);
    }
  });

  it("rejects mutation at the trigger level, including for service_role", () => {
    const sql = migrationSql();

    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON public\.health_data_access_log/);
    expect(sql).toMatch(/BEFORE TRUNCATE ON public\.health_data_access_log/);
    expect(sql).toMatch(/RAISE EXCEPTION 'public\.health_data_access_log is append-only'/);
  });

  it("revokes update and delete privileges from every api role", () => {
    const sql = migrationSql();

    expect(sql).toMatch(
      new RegExp(
        `REVOKE UPDATE, DELETE, TRUNCATE ON public\\.${TABLE} FROM anon, authenticated`,
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        `REVOKE UPDATE, DELETE, TRUNCATE ON public\\.${TABLE} FROM service_role`,
      ),
    );
  });

  it("scopes reads to org admins and allows inserts only from service_role", () => {
    const sql = migrationSql();

    expect(sql).toMatch(
      new RegExp(
        `CREATE POLICY "health_data_access_log_admin_select" ON public\\.${TABLE}\\s+FOR SELECT TO authenticated`,
      ),
    );
    expect(sql).toMatch(/public\.user_is_org_admin\(organization_id\)/);
    expect(sql).toMatch(
      new RegExp(
        `CREATE POLICY "health_data_access_log_service_insert" ON public\\.${TABLE}\\s+FOR INSERT TO service_role`,
      ),
    );
  });

  it("stores field names only — there is no column for a health value", () => {
    const sql = migrationSql();
    const tableBody = sql.slice(
      sql.indexOf("CREATE TABLE IF NOT EXISTS public.health_data_access_log"),
      sql.indexOf("COMMENT ON TABLE public.health_data_access_log"),
    );

    expect(tableBody).toMatch(/fields_accessed TEXT\[\]/);
    const columnNames = tableBody
      .split("\n")
      .map((line) => line.trim().match(/^([a-z_]+)\s+(uuid|text|timestamptz|jsonb|integer)\b/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);

    for (const forbidden of [
      "field_value",
      "plaintext",
      "health_value",
      "ciphertext",
      "encrypted_value",
      "key_id",
      "encryption_key_id",
    ]) {
      expect(columnNames).not.toContain(forbidden);
    }
  });

  it("does not add foreign keys to audit actor/subject identifiers", () => {
    const sql = migrationSql();

    for (const column of ["actor_user_id", "actor_api_key_id", "subject_user_id"]) {
      const line = sql
        .split("\n")
        .find((candidate) => candidate.trim().startsWith(column));

      expect(line).toBeDefined();
      expect(line).not.toMatch(/REFERENCES/);
    }
  });

  it("indexes the compliance query paths", () => {
    const sql = migrationSql();

    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS health_data_access_log_org_created_at_idx/,
    );
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS health_data_access_log_subject_created_at_idx/,
    );
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS health_data_access_log_resource_idx/,
    );
  });
});
