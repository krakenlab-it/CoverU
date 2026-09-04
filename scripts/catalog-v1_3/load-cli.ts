#!/usr/bin/env node
import { join } from "node:path";
import { formatLoadReport, runCatalogLoad } from "./load";

function parseArgs(argv: string[]): { dataDir: string; dryRun: boolean } {
  let dataDir = join(process.cwd(), "data/catalog/v1.3");
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--data-dir" && argv[i + 1]) {
      dataDir = argv[i + 1];
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { dataDir, dryRun };
}

function printHelp(): void {
  console.log(`CoverU catalog v1.3 loader

Usage:
  npm run catalog:load -- [--dry-run] [--data-dir <path>]

Environment (never commit secrets):
  SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Examples:
  npm run catalog:load:dry-run
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run catalog:load
`);
}

async function main(): Promise<void> {
  const { dataDir, dryRun } = parseArgs(process.argv.slice(2));

  try {
    const report = await runCatalogLoad({ dataDir, dryRun });
    console.log(formatLoadReport(report));
    if (dryRun) {
      console.log("\nRe-run without --dry-run to write to Supabase.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Catalog load failed: ${message}`);
    process.exit(1);
  }
}

void main();
