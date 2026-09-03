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

// Seed idempotency check — re-apply seed files only
const seedFiles = files.filter((f) => f.includes("seed"));
for (const file of seedFiles) {
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  const wrapped = `BEGIN;\n${sql}\nCOMMIT;`;
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1"], {
    input: wrapped,
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    console.error(
      JSON.stringify({ status: "seed_idempotency_failed", file, stderr: result.stderr }),
    );
    process.exit(1);
  }
}

runPsql(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;",
);

console.log(JSON.stringify({ status: "passed", migration_count: files.length }));
