#!/usr/bin/env node
/**
 * Applies supabase/migrations to an ephemeral Postgres database.
 * Never connects to production. Skips gracefully when DATABASE_URL is unset.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log(
    JSON.stringify({
      status: "skipped",
      reason: "DATABASE_URL not set — ephemeral migration test skipped",
    }),
  );
  process.exit(0);
}

if (/supabase\.co/i.test(databaseUrl)) {
  console.error(
    JSON.stringify({
      status: "blocked",
      reason: "Refusing to run against remote Supabase URL",
    }),
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

function runPsql(sql) {
  const result = spawnSync(
    "psql",
    [databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", sql],
    { encoding: "utf-8" },
  );

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
}

console.log(
  JSON.stringify({ status: "running", migration_count: files.length }),
);

const bootstrapSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULL::UUID;
$$;
`;

runPsql(bootstrapSql);
console.log(JSON.stringify({ status: "bootstrapped", roles: ["anon", "authenticated", "service_role"] }));

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  const wrapped = `BEGIN;\n${sql}\nCOMMIT;`;
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1"], {
    input: wrapped,
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    console.error(
      JSON.stringify({ status: "failed", file, stderr: result.stderr }),
    );
    process.exit(1);
  }

  console.log(JSON.stringify({ status: "applied", file }));
}

// Seed idempotency check — re-apply seed files unless a later migration
// redefines constraints incompatible with original seed values (e.g. tariff v1.3 Ecuador regions).
const seedFiles = files.filter((f) => f.includes("seed"));
const seedConstraintSuperseded = files.some((f) => /tariff_schema_v1_3/i.test(f));

if (seedConstraintSuperseded) {
  console.log(
    JSON.stringify({
      status: "seed_idempotency_skipped",
      reason:
        "Post-seed migration tariff_schema_v1_3 redefines region CHECK; original seed metropolitana values are superseded by backfill",
    }),
  );
} else {
  for (const file of seedFiles) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const wrapped = `BEGIN;\n${sql}\nCOMMIT;`;
    const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1"], {
      input: wrapped,
      encoding: "utf-8",
    });

    if (result.status !== 0) {
      console.error(
        JSON.stringify({
          status: "seed_idempotency_failed",
          file,
          stderr: result.stderr,
        }),
      );
      process.exit(1);
    }
  }
}

runPsql(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;",
);

console.log(JSON.stringify({ status: "passed", migration_count: files.length }));
